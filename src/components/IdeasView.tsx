"use client";

import React, { useState, useMemo } from "react";
import { Idea, IdeaProject, IdeaStatus, Task } from "@/types";
import { APP_CONFIG } from "@/config/app";
import { createClient } from "@/lib/supabase/client";
import { MascotCosmino } from "./MascotCosmino";
import {
  Link2,
  ExternalLink,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  FileText,
  CalendarPlus,
  Loader2,
  X,
  Edit3,
} from "lucide-react";

interface IdeasViewProps {
  ideas: Idea[];
  tasks: Task[];
  onRefreshIdeas: () => Promise<void>;
  onCreateTaskFromIdea: (idea: Idea) => Promise<void>;
}

export function IdeasView({
  ideas,
  tasks,
  onRefreshIdeas,
  onCreateTaskFromIdea,
}: IdeasViewProps) {
  const supabase = createClient();

  // Inserimento nuovi link
  const [urlsInput, setUrlsInput] = useState("");
  const [selectedProject, setSelectedProject] = useState<IdeaProject>("articolo-cosmonet");
  const [initialNote, setInitialNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtro stato
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | "tutte">("tutte");

  // Dettaglio idea selezionata
  const [activeIdea, setActiveIdea] = useState<Idea | null>(null);
  const [activeNote, setActiveNote] = useState("");
  const [activeStatus, setActiveStatus] = useState<IdeaStatus>("nuova");
  const [isUpdatingActive, setIsUpdatingActive] = useState(false);

  // Filtra idee
  const filteredIdeas = useMemo(() => {
    return ideas.filter((item) => {
      if (statusFilter !== "tutte" && item.status !== statusFilter) return false;
      return true;
    });
  }, [ideas, statusFilter]);

  // Invio link (supporta link singoli o multipli, uno per riga)
  const handleAddLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    setWarningMsg(null);
    setSuccessMsg(null);

    const rawLines = urlsInput
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (rawLines.length === 0) return;

    setIsSubmitting(true);
    let addedCount = 0;
    const duplicates: string[] = [];

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert("Sessione non valida, accedi nuovamente.");
      setIsSubmitting(false);
      return;
    }

    for (const rawLine of rawLines) {
      // Normalizzazione URL
      let validUrl = rawLine;
      if (!/^https?:\/\//i.test(validUrl)) {
        validUrl = `https://${validUrl}`;
      }

      // Controllo duplicato locale tra le idee già caricate
      const isDuplicate = ideas.some(
        (i) => i.url.toLowerCase() === validUrl.toLowerCase()
      );

      if (isDuplicate) {
        duplicates.push(validUrl);
        continue;
      }

      // Recupero titolo pagina dal server
      let title: string | null = null;
      try {
        const scrapeRes = await fetch(
          `/api/ideas/scrape-title?url=${encodeURIComponent(validUrl)}`
        );
        if (scrapeRes.ok) {
          const scrapeData = await scrapeRes.json();
          title = scrapeData.title || null;
        }
      } catch {
        // Fallback al dominio
      }

      // Inserimento su Supabase
      const { error } = await supabase.from("ideas").insert({
        user_id: session.user.id,
        url: validUrl,
        title,
        note: initialNote.trim() ? initialNote.trim() : null,
        project: selectedProject,
        status: "nuova",
        created_by: "user",
      });

      if (!error) {
        addedCount++;
      } else if (error.code === "23505" || error.message.includes("duplicate")) {
        duplicates.push(validUrl);
      }
    }

    if (duplicates.length > 0) {
      setWarningMsg(
        duplicates.length === 1
          ? `Questo link era già presente ed è stato ignorato: ${duplicates[0]}`
          : `${duplicates.length} link erano già presenti e sono stati ignorati.`
      );
    }

    if (addedCount > 0) {
      setSuccessMsg(
        addedCount === 1
          ? "Idea aggiunta con successo!"
          : `${addedCount} idee aggiunte con successo!`
      );
      setUrlsInput("");
      setInitialNote("");
      await onRefreshIdeas();
    }

    setIsSubmitting(false);
  };

  // Apertura modale dettaglio idea
  const handleOpenDetail = (idea: Idea) => {
    setActiveIdea(idea);
    setActiveNote(idea.note || "");
    setActiveStatus(idea.status);
  };

  // Salvataggio modifiche idea
  const handleSaveActiveIdea = async () => {
    if (!activeIdea) return;
    setIsUpdatingActive(true);
    try {
      const { error } = await supabase
        .from("ideas")
        .update({
          status: activeStatus,
          note: activeNote.trim() ? activeNote.trim() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeIdea.id);

      if (!error) {
        await onRefreshIdeas();
        setActiveIdea(null);
      }
    } finally {
      setIsUpdatingActive(false);
    }
  };

  // Creazione attività in agenda dall'idea
  const handleCreateTask = async () => {
    if (!activeIdea) return;
    try {
      await onCreateTaskFromIdea(activeIdea);
      setActiveIdea(null);
      await onRefreshIdeas();
    } catch (e: any) {
      alert("Errore creazione attività: " + e.message);
    }
  };

  return (
    <div className="pb-24 space-y-4 animate-pop-in">
      {/* Box Aggiunta Link in alto */}
      <div className="bg-white rounded-3xl p-5 border border-cream-300 shadow-soft">
        <div className="flex items-center gap-2 mb-3">
          <span className="p-2 rounded-2xl bg-pastel-pink text-[#5A2838]">
            <Link2 size={18} />
          </span>
          <div>
            <h3 className="text-base font-bold text-plum-900 leading-tight">
              Aggiungi Idee e Link
            </h3>
            <p className="text-[11px] text-plum-500">
              Incolla uno o più link (uno per riga). Il titolo verrà letto automaticamente.
            </p>
          </div>
        </div>

        <form onSubmit={handleAddLinks} className="space-y-3">
          <textarea
            rows={2}
            required
            placeholder="Incolla qui i link (es. https://...)..."
            value={urlsInput}
            onChange={(e) => setUrlsInput(e.target.value)}
            className="w-full text-xs font-mono text-plum-900 bg-cream-50 rounded-2xl p-3 border border-cream-300 focus:outline-none focus:ring-2 focus:ring-cosmo-alien/30 shadow-2xs resize-none"
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-plum-500 uppercase">
                Progetto
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value as IdeaProject)}
                className="w-full text-xs font-semibold text-plum-900 bg-cream-50 rounded-xl px-2.5 py-2 border border-cream-300"
              >
                {APP_CONFIG.ideaProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-plum-500 uppercase">
                Nota opzionale
              </label>
              <input
                type="text"
                placeholder="Spunto o appunto..."
                value={initialNote}
                onChange={(e) => setInitialNote(e.target.value)}
                className="w-full text-xs font-medium text-plum-900 bg-cream-50 rounded-xl px-2.5 py-2 border border-cream-300"
              />
            </div>
          </div>

          {warningMsg && (
            <div className="p-2.5 rounded-xl bg-[#FFF3C4] text-[#554316] text-xs font-medium border border-[#F3E19C] flex items-center gap-1.5">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{warningMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-xl bg-pastel-mint text-[#1D4E3A] text-xs font-medium border border-[#B4E4CE] flex items-center gap-1.5">
              <CheckCircle2 size={14} className="flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !urlsInput.trim()}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-cosmo-alien to-[#2563EB] hover:opacity-95 text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Salvataggio e lettura titolo...
              </>
            ) : (
              <>
                <Plus size={16} /> Salva idee
              </>
            )}
          </button>
        </form>
      </div>

      {/* Barra filtri per stato */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setStatusFilter("tutte")}
          className={`text-xs px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all border ${
            statusFilter === "tutte"
              ? "bg-plum-800 text-white border-plum-800 shadow-2xs"
              : "bg-white text-plum-600 border-cream-300"
          }`}
        >
          Tutte ({ideas.length})
        </button>
        {APP_CONFIG.ideaStatuses.map((st) => {
          const count = ideas.filter((i) => i.status === st.id).length;
          const isSelected = statusFilter === st.id;
          return (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`text-xs px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all border ${
                isSelected
                  ? "shadow-sm scale-105"
                  : "opacity-75 hover:opacity-100"
              }`}
              style={{
                backgroundColor: st.bgColor,
                color: st.textColor,
                borderColor: isSelected ? st.textColor : st.borderColor,
                borderWidth: isSelected ? "2px" : "1px",
              }}
            >
              {st.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Elenco Carte Idee */}
      {filteredIdeas.length > 0 ? (
        <div className="space-y-2.5">
          {filteredIdeas.map((idea) => {
            const projectCfg =
              APP_CONFIG.ideaProjects.find((p) => p.id === idea.project) ||
              APP_CONFIG.ideaProjects[0];
            const statusCfg =
              APP_CONFIG.ideaStatuses.find((s) => s.id === idea.status) ||
              APP_CONFIG.ideaStatuses[0];

            let domain = "";
            try {
              domain = new URL(idea.url).hostname.replace(/^www\./, "");
            } catch {
              domain = idea.url;
            }

            const connectedTask = idea.task_id
              ? tasks.find((t) => t.id === idea.task_id)
              : null;

            return (
              <div
                key={idea.id}
                onClick={() => handleOpenDetail(idea)}
                className="bg-white rounded-3xl p-4 border border-cream-300 shadow-soft hover:shadow-card transition-all cursor-pointer select-none space-y-2 active:scale-[0.99]"
              >
                {/* Riga Badge: Progetto & Stato */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs"
                      style={{
                        backgroundColor: projectCfg.bgColor,
                        color: projectCfg.textColor,
                      }}
                    >
                      {projectCfg.label}
                    </span>

                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: statusCfg.bgColor,
                        color: statusCfg.textColor,
                        borderColor: statusCfg.borderColor,
                      }}
                    >
                      {statusCfg.label}
                    </span>
                  </div>

                  <a
                    href={idea.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-xl bg-cream-100 hover:bg-pastel-sky text-plum-600 hover:text-cosmo-alien transition-colors"
                    title="Apri link"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>

                {/* Titolo o Dominio */}
                <h4 className="text-sm font-bold text-plum-900 leading-snug">
                  {idea.title || domain}
                </h4>

                {/* URL visibile accorciato */}
                <p className="text-[11px] font-mono text-plum-500 truncate">
                  {idea.url}
                </p>

                {/* Nota */}
                {idea.note && (
                  <p className="text-xs text-plum-700 bg-cream-50 p-2 rounded-xl border border-cream-200">
                    {idea.note}
                  </p>
                )}

                {/* Badge se collegata ad attività in agenda */}
                {connectedTask && (
                  <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-cosmo-alien bg-pastel-sky/50 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 size={12} />
                    <span>In agenda: {connectedTask.date}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 bg-white/70 backdrop-blur-xs rounded-3xl border border-dashed border-cream-300 text-center my-6">
          <MascotCosmino mood="happy" size={90} animate={true} />
          <h3 className="text-base font-bold text-plum-900 mt-2">
            Nessuna idea in questo stato
          </h3>
          <p className="text-xs text-plum-500 max-w-xs mt-1">
            Incolla un link qui sopra per salvare articoli, video o spunti per i tuoi progetti!
          </p>
        </div>
      )}

      {/* Modale Dettaglio Idea */}
      {activeIdea && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-plum-900/40 backdrop-blur-xs animate-pop-in">
          <div className="w-full max-w-md bg-cream-50 rounded-t-4xl sm:rounded-3xl border border-cream-300 shadow-floating p-5 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-cream-200">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-pastel-sky text-cosmo-alien">
                  <Sparkles size={16} />
                </span>
                <h3 className="text-base font-bold text-plum-900">Dettaglio Idea</h3>
              </div>
              <button
                onClick={() => setActiveIdea(null)}
                className="p-1 rounded-full hover:bg-cream-100 text-plum-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Titolo e link */}
            <div>
              <h4 className="text-base font-bold text-plum-900">
                {activeIdea.title || activeIdea.url}
              </h4>
              <a
                href={activeIdea.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-cosmo-alien hover:underline flex items-center gap-1 mt-1 break-all"
              >
                {activeIdea.url} <ExternalLink size={12} className="flex-shrink-0" />
              </a>
            </div>

            {/* Stato */}
            <div>
              <label className="text-[10px] font-bold text-plum-500 uppercase">
                Stato
              </label>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {APP_CONFIG.ideaStatuses.map((st) => {
                  const isSelected = activeStatus === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setActiveStatus(st.id)}
                      className={`text-xs font-bold py-2 rounded-xl transition-all border ${
                        isSelected ? "shadow-2xs scale-105" : "opacity-60"
                      }`}
                      style={{
                        backgroundColor: st.bgColor,
                        color: st.textColor,
                        borderColor: isSelected ? st.textColor : st.borderColor,
                        borderWidth: isSelected ? "2px" : "1px",
                      }}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-[10px] font-bold text-plum-500 uppercase">
                Note e appunti
              </label>
              <textarea
                rows={3}
                placeholder="Aggiungi appunti su quest'idea..."
                value={activeNote}
                onChange={(e) => setActiveNote(e.target.value)}
                className="w-full text-xs text-plum-900 bg-white rounded-2xl p-3 border border-cream-300 focus:outline-none focus:ring-2 focus:ring-cosmo-alien/30 shadow-2xs resize-none mt-1"
              />
            </div>

            {/* Azione: Crea attività in agenda */}
            {!activeIdea.task_id && (
              <button
                type="button"
                onClick={handleCreateTask}
                className="w-full py-2.5 rounded-2xl bg-pastel-peach hover:bg-[#FFD7BC] text-[#5C3A20] font-bold text-xs flex items-center justify-center gap-1.5 border border-pastel-peach transition-all shadow-2xs"
              >
                <CalendarPlus size={15} /> Crea attività in agenda
              </button>
            )}

            {/* Bottoni salva */}
            <div className="flex gap-2 pt-2 border-t border-cream-200">
              <button
                type="button"
                onClick={() => setActiveIdea(null)}
                className="flex-1 py-2.5 rounded-2xl bg-white text-plum-700 font-bold text-xs border border-cream-300"
              >
                Chiudi
              </button>
              <button
                type="button"
                disabled={isUpdatingActive}
                onClick={handleSaveActiveIdea}
                className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-cosmo-alien to-[#2563EB] text-white font-bold text-xs shadow-soft"
              >
                {isUpdatingActive ? "Salvataggio..." : "Salva modifiche"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
