"use client";

import React, { useState } from "react";
import { APP_CONFIG } from "@/config/app";
import { MascotCosmino } from "./MascotCosmino";
import {
  X,
  Copy,
  Check,
  Bot,
  ExternalLink,
  Smartphone,
  Sparkles,
  ShieldCheck,
  Cpu,
} from "lucide-react";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
}

export function InfoModal({ isOpen, onClose, userEmail }: InfoModalProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  if (!isOpen) return null;

  const currentOrigin =
    typeof window !== "undefined" ? window.location.origin : "https://tua-app.vercel.app";
  const mcpToken = process.env.NEXT_PUBLIC_MCP_TOKEN_HINT || "orbita-mcp-secret-2026";
  const mcpUrl = `${currentOrigin}/api/mcp/${mcpToken}`;
  const openApiUrl = `${currentOrigin}/api/openapi.json`;

  const copyToClipboard = (text: string, isUrl: boolean) => {
    navigator.clipboard.writeText(text);
    if (isUrl) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum-900/50 backdrop-blur-xs animate-pop-in">
      <div className="w-full max-w-md bg-cream-50 rounded-4xl border border-cream-300 shadow-floating p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header modale */}
        <div className="flex items-center justify-between pb-3 border-b border-cream-200">
          <div className="flex items-center gap-2">
            <MascotCosmino size={32} animate={false} />
            <h3 className="text-base font-bold text-plum-900">
              Informazioni e Connettori
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-cream-100 text-plum-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Brand info */}
        <div className="py-4 text-center">
          <MascotCosmino mood="happy" size={72} animate={true} />
          <h2 className="text-xl font-black text-plum-900 mt-2">
            {APP_CONFIG.name}
          </h2>
          <p className="text-xs font-bold text-cosmo-alien">
            {APP_CONFIG.brandClaim} • Versione {APP_CONFIG.version}
          </p>
          <p className="text-xs text-plum-600 mt-2 max-w-xs mx-auto">
            {APP_CONFIG.description}. Progettata per essere usata con una sola mano da smartphone o guidata dal tuo assistente IA.
          </p>

          {userEmail && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pastel-mint/50 text-[#1D4E3A] text-xs font-medium border border-pastel-mint">
              <ShieldCheck size={14} /> Connesso come: <b>{userEmail}</b>
            </div>
          )}
        </div>

        {/* Connettore MCP per Claude & Grok */}
        <div className="mt-2 bg-white rounded-3xl p-4 border border-cream-300 shadow-card space-y-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-pastel-lavender text-plum-900">
              <Cpu size={16} />
            </span>
            <div>
              <h4 className="text-sm font-bold text-plum-900 leading-none">
                Connettore MCP per Claude &amp; Grok
              </h4>
              <p className="text-[11px] text-plum-500 mt-0.5">
                Trasporto HTTP Streamable per Claude Custom Connector
              </p>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-plum-500 uppercase">
              URL Connettore Remoto
            </label>
            <div className="flex items-center gap-1.5 mt-1">
              <input
                readOnly
                value={mcpUrl}
                className="flex-1 text-xs font-mono bg-cream-50 text-plum-800 rounded-xl px-2.5 py-2 border border-cream-200 select-all"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(mcpUrl, true)}
                className="p-2 bg-pastel-sky hover:bg-[#B8DCFC] text-cosmo-alien rounded-xl font-bold text-xs flex items-center justify-center transition-all"
                title="Copia URL"
              >
                {copiedUrl ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-plum-600 leading-relaxed">
            Incolla questo URL nelle impostazioni di Claude (<i>Connectors / Strumenti personalizzati</i>).
            Claude potrà aggiungere attività (&quot;add_task&quot;), leggere la settimana (&quot;list_tasks&quot;) e segnare i compiti fatti senza cancellare nulla.
          </p>
        </div>

        {/* API REST & Custom GPTs */}
        <div className="mt-3 bg-white rounded-3xl p-4 border border-cream-300 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-pastel-peach text-[#5C3A20]">
                <Bot size={16} />
              </span>
              <div>
                <h4 className="text-sm font-bold text-plum-900 leading-none">
                  OpenAPI / GPT Personalizzati
                </h4>
                <p className="text-[11px] text-plum-500 mt-0.5">
                  Per Azioni GPT, Comandi Siri e Script
                </p>
              </div>
            </div>
            <a
              href={openApiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cosmo-alien font-bold flex items-center gap-1 hover:underline"
            >
              Schema <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Guida Installazione PWA */}
        <div className="mt-3 bg-white rounded-3xl p-4 border border-cream-300 shadow-card space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-pastel-sky text-cosmo-alien">
              <Smartphone size={16} />
            </span>
            <h4 className="text-sm font-bold text-plum-900">
              Installazione sul telefono (PWA)
            </h4>
          </div>
          <ul className="text-xs text-plum-600 space-y-1 list-disc pl-4">
            <li>
              <b>iPhone (Safari):</b> tocca l&apos;icona <i>Condividi</i> in basso e seleziona <i>Aggiungi alla schermata Home</i>.
            </li>
            <li>
              <b>Android (Chrome):</b> tocca i tre puntini in alto a destra e seleziona <i>Aggiungi a schermata Home</i> o <i>Installa app</i>.
            </li>
          </ul>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-3 bg-plum-800 text-white font-bold text-xs rounded-2xl transition-all hover:bg-plum-900"
        >
          Chiudi
        </button>
      </div>
    </div>
  );
}
