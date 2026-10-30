"use client";

import React, { useState } from "react";
import { Task, PubStatus } from "@/types";
import { APP_CONFIG } from "@/config/app";
import { Copy, ExternalLink, Check, Send } from "lucide-react";
import { MascotCosmino } from "./MascotCosmino";

interface QueueViewProps {
  tasks: Task[];
  onClickTask: (task: Task) => void;
  onSetPubStatus: (task: Task, status: PubStatus) => void;
}

export function QueueView({ tasks, onClickTask, onSetPubStatus }: QueueViewProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard non disponibile */
    }
  };

  const sorted = (list: Task[]) => [...list].sort((a, b) => a.date.localeCompare(b.date));
  const toPrepare = sorted(tasks.filter((t) => t.pub_status === "da_preparare" && t.status !== "skipped"));
  const ready = sorted(tasks.filter((t) => t.pub_status === "pronto" && t.status !== "skipped"));
  const published = [...tasks.filter((t) => t.pub_status === "pubblicato")]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const renderItem = (t: Task) => {
    const kind = APP_CONFIG.kinds.find((k) => k.id === t.kind);
    return (
      <div key={t.id} className="bg-white rounded-3xl border border-cream-300 shadow-soft p-4">
        <div className="flex items-center gap-2 flex-wrap mb-1" onClick={() => onClickTask(t)}>
          {kind && (
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
              style={{ backgroundColor: kind.bgColor, color: kind.textColor, borderColor: kind.borderColor }}
            >
              {kind.label}
            </span>
          )}
          <span className="text-xs font-semibold text-plum-500">{t.date.split("-").reverse().join("/")}</span>
        </div>
        <h4 className="text-base font-semibold text-plum-800 leading-snug cursor-pointer" onClick={() => onClickTask(t)}>
          {t.title}
        </h4>

        <div className="flex flex-wrap gap-2 mt-3">
          {t.link && (
            <>
              <button
                type="button"
                onClick={() => copy(t.id + "l", t.link!)}
                className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-2xl bg-pastel-sky text-cosmo-alien"
              >
                {copied === t.id + "l" ? <Check size={13} /> : <Copy size={13} />} Copia link
              </button>
              <a
                href={t.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-2xl bg-cream-100 text-plum-700 border border-cream-300"
              >
                <ExternalLink size={13} /> Apri
              </a>
            </>
          )}
          {t.social_text && (
            <button
              type="button"
              onClick={() => copy(t.id + "s", t.social_text!)}
              className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-2xl bg-pastel-peach text-[#5C3A20]"
            >
              {copied === t.id + "s" ? <Check size={13} /> : <Copy size={13} />} Copia testo social
            </button>
          )}
          {!t.link && !t.social_text && (
            <span className="text-xs text-plum-500">Nessun link né testo: aprilo per aggiungerli.</span>
          )}
        </div>

        <div className="flex gap-2 mt-3 pt-3 border-t border-cream-200">
          {t.pub_status === "da_preparare" && (
            <button
              type="button"
              onClick={() => onSetPubStatus(t, "pronto")}
              className="flex-1 text-xs font-bold py-2 rounded-2xl bg-[#D6ECFF] text-[#1E3E66] active:scale-95"
            >
              Segna pronto
            </button>
          )}
          {t.pub_status !== "pubblicato" && (
            <button
              type="button"
              onClick={() => onSetPubStatus(t, "pubblicato")}
              className="flex-1 text-xs font-bold py-2 rounded-2xl bg-[#D4F1E4] text-[#1D4E3A] active:scale-95"
            >
              Segna pubblicato
            </button>
          )}
          {t.pub_status === "pubblicato" && (
            <button
              type="button"
              onClick={() => onSetPubStatus(t, "da_preparare")}
              className="flex-1 text-xs font-bold py-2 rounded-2xl bg-cream-100 text-plum-700 border border-cream-300 active:scale-95"
            >
              Rimetti in coda
            </button>
          )}
        </div>
      </div>
    );
  };

  const section = (title: string, list: Task[]) =>
    list.length > 0 && (
      <div className="mb-5">
        <h3 className="text-xs font-bold text-plum-600 uppercase tracking-wide mb-2 px-1">
          {title} ({list.length})
        </h3>
        <div className="space-y-2.5">{list.map(renderItem)}</div>
      </div>
    );

  const empty = toPrepare.length + ready.length + published.length === 0;

  return (
    <div className="pb-24">
      <div className="flex items-center gap-2 mb-4 px-1">
        <Send size={18} className="text-cosmo-alien" />
        <h2 className="text-lg font-bold text-plum-900">Coda di pubblicazione</h2>
      </div>

      {empty ? (
        <div className="flex flex-col items-center p-8 bg-white/70 rounded-3xl border border-dashed border-cream-300 text-center">
          <MascotCosmino mood="happy" size={96} animate={true} />
          <p className="text-sm font-bold text-plum-900 mt-3">La coda è vuota</p>
          <p className="text-xs text-plum-500 mt-1 max-w-xs">
            Qui compaiono articoli, vignette e rubriche con uno stato (da preparare, pronto, pubblicato). Aprine una e scegli lo stato.
          </p>
        </div>
      ) : (
        <>
          {section("Da preparare", toPrepare)}
          {section("Pronti da pubblicare", ready)}
          {section("Pubblicati di recente", published)}
        </>
      )}
    </div>
  );
}
