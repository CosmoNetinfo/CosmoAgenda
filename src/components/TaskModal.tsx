"use client";

import React, { useState, useEffect, useRef } from "react";
import { Task, CreateTaskInput, UpdateTaskInput, Subtask, TaskFile } from "@/types";
import { APP_CONFIG, TaskKindId, TaskPriorityId, TaskStatusId } from "@/config/app";
import { createClient } from "@/lib/supabase/client";
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Tag,
  Folder,
  AlertCircle,
  FileText,
  ListTodo,
  CheckCircle2,
  Circle,
  Sparkles,
  FileCode,
  Copy,
  Check,
  Download,
  Edit3,
  Upload,
  Bot,
  User,
} from "lucide-react";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateTaskInput | UpdateTaskInput) => Promise<Task | void>;
  onDelete?: (id: string) => Promise<void>;
  initialTask?: Task | null;
  defaultDate: string;
  onRefreshTasks?: () => Promise<void>;
}

export function TaskModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialTask,
  defaultDate,
  onRefreshTasks,
}: TaskModalProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("");
  const [kind, setKind] = useState<TaskKindId>("altro");
  const [project, setProject] = useState("");
  const [priority, setPriority] = useState<TaskPriorityId>("normale");
  const [notes, setNotes] = useState("");
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [status, setStatus] = useState<TaskStatusId>("todo");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // File Markdown (.md)
  const [files, setFiles] = useState<TaskFile[]>([]);
  const [copiedFileId, setCopiedFileId] = useState<string | null>(null);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingFileContent, setEditingFileContent] = useState("");
  const [editingFileName, setEditingFileName] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pastedName, setPastedName] = useState("");
  const [pastedContent, setPastedContent] = useState("");

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDate(initialTask.date);
      setTime(initialTask.time || "");
      setKind(initialTask.kind);
      setProject(initialTask.project || "");
      setPriority(initialTask.priority);
      setNotes(initialTask.notes || "");
      setSubtasks(initialTask.subtasks || []);
      setStatus(initialTask.status);
      setFiles(initialTask.task_files || []);

      // Ricarica i file da Supabase per sicurezza
      supabase
        .from("task_files")
        .select("*")
        .eq("task_id", initialTask.id)
        .order("created_at", { ascending: true })
        .then(({ data }) => {
          if (data) setFiles(data as TaskFile[]);
        });
    } else {
      setTitle("");
      setDate(defaultDate);
      setTime("");
      setKind("altro");
      setProject("");
      setPriority("normale");
      setNotes("");
      setSubtasks([]);
      setStatus("todo");
      setFiles([]);
    }
    setFileError(null);
    setShowPasteBox(false);
    setEditingFileId(null);
  }, [initialTask, defaultDate, isOpen, supabase]);

  if (!isOpen) return null;

  const handleAddSubtask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const newSub: Subtask = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      title: newSubtaskTitle.trim(),
      done: false,
    };
    setSubtasks([...subtasks, newSub]);
    setNewSubtaskTitle("");
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    );
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  // COPIA TESTO NEGLI APPUNTI (Requisito 2)
  const handleCopyText = (file: TaskFile) => {
    navigator.clipboard.writeText(file.content_md);
    setCopiedFileId(file.id);
    setTimeout(() => setCopiedFileId(null), 2000);
  };

  // SCARICA .MD (Requisito 2)
  const handleDownloadFile = (file: TaskFile) => {
    const blob = new Blob([file.content_md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name.endsWith(".md") ? file.name : `${file.name}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ALLEGA FILE DA INPUT FILE (Requisito 2)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFileError(null);

    // Controllo limite 200 KB (204.800 byte)
    if (uploadedFile.size > 204800) {
      setFileError("Il file supera il limite massimo di 200 KB.");
      e.target.value = "";
      return;
    }

    let fileName = uploadedFile.name;
    if (!fileName.endsWith(".md")) {
      fileName = `${fileName}.md`;
    }

    try {
      const text = await uploadedFile.text();
      await saveNewFile(fileName, text);
    } catch (err: any) {
      setFileError("Errore durante la lettura del file.");
    } finally {
      e.target.value = "";
    }
  };

  // SALVA NUOVO FILE (da file picker o testo incollato)
  const saveNewFile = async (name: string, content: string) => {
    setFileError(null);

    let cleanName = name.trim();
    if (!cleanName.endsWith(".md")) {
      cleanName = `${cleanName}.md`;
    }

    // Controllo dimensione testo UTF-8
    const byteLength = new TextEncoder().encode(content).length;
    if (byteLength > 204800) {
      setFileError("Il testo supera il limite di 200 KB.");
      return;
    }

    if (!initialTask) {
      // Se l'attività non è ancora salvata nel database, la salviamo prima
      setIsSaving(true);
      try {
        const savedTask = await onSave({
          title: title.trim() || "Nuova Attività",
          date,
          time: time.trim() ? time : null,
          kind,
          project: project.trim() ? project.trim() : null,
          priority,
          notes: notes.trim() ? notes.trim() : null,
          subtasks,
          status,
        });

        if (savedTask && savedTask.id) {
          const { data, error } = await supabase
            .from("task_files")
            .insert({
              task_id: savedTask.id,
              name: cleanName,
              content_md: content,
              created_by: "user",
            })
            .select()
            .single();

          if (error) throw error;
          if (data) {
            setFiles((prev) => [...prev, data as TaskFile]);
            onRefreshTasks?.();
          }
        }
      } catch (err: any) {
        setFileError(err.message || "Errore nel salvataggio dell'allegato.");
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Attività già esistente
    try {
      const { data, error } = await supabase
        .from("task_files")
        .insert({
          task_id: initialTask.id,
          name: cleanName,
          content_md: content,
          created_by: "user",
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setFiles((prev) => [...prev, data as TaskFile]);
        setShowPasteBox(false);
        setPastedName("");
        setPastedContent("");
        onRefreshTasks?.();
      }
    } catch (err: any) {
      setFileError(err.message || "Errore nel salvataggio dell'allegato.");
    }
  };

  // MODIFICA TESTO FILE ESISTENTE DIRETTAMENTE NELL'APP (Requisito 2)
  const handleStartEditingFile = (file: TaskFile) => {
    setEditingFileId(file.id);
    setEditingFileName(file.name);
    setEditingFileContent(file.content_md);
  };

  const handleSaveEditedFile = async () => {
    if (!editingFileId) return;
    setFileError(null);

    let cleanName = editingFileName.trim();
    if (!cleanName.endsWith(".md")) {
      cleanName = `${cleanName}.md`;
    }

    const byteLength = new TextEncoder().encode(editingFileContent).length;
    if (byteLength > 204800) {
      setFileError("Il contenuto supera il limite consentito di 200 KB.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("task_files")
        .update({
          name: cleanName,
          content_md: editingFileContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingFileId)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setFiles((prev) =>
          prev.map((f) => (f.id === editingFileId ? (data as TaskFile) : f))
        );
        setEditingFileId(null);
        onRefreshTasks?.();
      }
    } catch (err: any) {
      setFileError(err.message || "Errore durante l'aggiornamento del file.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSaving) return;

    try {
      setIsSaving(true);
      await onSave({
        title: title.trim(),
        date,
        time: time.trim() ? time : null,
        kind,
        project: project.trim() ? project.trim() : null,
        priority,
        notes: notes.trim() ? notes.trim() : null,
        subtasks,
        status,
      });
      onClose();
    } catch (err) {
      console.error("Errore salvataggio attività:", err);
      alert("Si è verificato un errore durante il salvataggio.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialTask || !onDelete || isDeleting) return;
    if (!confirm("Sei sicuro di voler eliminare questa attività?")) return;

    try {
      setIsDeleting(true);
      await onDelete(initialTask.id);
      onClose();
    } catch (err) {
      console.error("Errore eliminazione:", err);
      alert("Errore durante l'eliminazione.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-plum-900/40 backdrop-blur-xs animate-pop-in">
      <div className="w-full max-w-lg bg-cream-50 rounded-t-4xl sm:rounded-3xl border border-cream-300 shadow-floating max-h-[92vh] flex flex-col overflow-hidden">
        {/* Intestazione */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 bg-white">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-pastel-pink text-[#5A2838]">
              <Sparkles size={18} />
            </span>
            <h3 className="text-lg font-bold text-plum-900">
              {initialTask ? "Dettaglio Attività" : "Nuova Attività"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-cream-100 text-plum-400 hover:text-plum-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form scorrevole */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Titolo */}
          <div>
            <label className="block text-xs font-bold text-plum-700 mb-1.5 uppercase tracking-wider">
              Cosa c&apos;è da fare? *
            </label>
            <input
              type="text"
              required
              placeholder="Es. Scrivere bozza articolo, Call con Daniele..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-base font-semibold text-plum-900 bg-white rounded-2xl px-4 py-3 border border-cream-300 focus:outline-none focus:ring-2 focus:ring-cosmo-alien/30 focus:border-cosmo-alien shadow-card"
            />
          </div>

          {/* Data e Ora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-plum-700 mb-1.5 flex items-center gap-1">
                <Calendar size={13} className="text-cosmo-alien" /> Data *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm font-medium text-plum-900 bg-white rounded-2xl px-3.5 py-2.5 border border-cream-300 focus:outline-none focus:ring-2 focus:ring-cosmo-alien/30 shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-plum-700 mb-1.5 flex items-center gap-1">
                <Clock size={13} className="text-cosmo-alien" /> Ora (facoltativa)
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-sm font-medium text-plum-900 bg-white rounded-2xl px-3.5 py-2.5 border border-cream-300 focus:outline-none focus:ring-2 focus:ring-cosmo-alien/30 shadow-2xs"
              />
            </div>
          </div>

          {/* Tipo di Attività (Pastel Pills) */}
          <div>
            <label className="block text-xs font-bold text-plum-700 mb-1.5 flex items-center gap-1">
              <Tag size={13} className="text-cosmo-alien" /> Tipo
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-white rounded-2xl border border-cream-200">
              {APP_CONFIG.kinds.map((k) => {
                const isSelected = kind === k.id;
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setKind(k.id)}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all border ${
                      isSelected
                        ? "shadow-sm scale-105"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    style={{
                      backgroundColor: k.bgColor,
                      color: k.textColor,
                      borderColor: isSelected ? k.textColor : k.borderColor,
                      borderWidth: isSelected ? "2px" : "1px",
                    }}
                  >
                    {k.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progetto e Priorità */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-plum-700 mb-1.5 flex items-center gap-1">
                <Folder size={13} className="text-cosmo-alien" /> Progetto
              </label>
              <input
                type="text"
                list="projects-list"
                placeholder="Es. Cosmonet, Solfège..."
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full text-sm text-plum-900 bg-white rounded-2xl px-3.5 py-2.5 border border-cream-300 focus:outline-none focus:ring-2 focus:ring-cosmo-alien/30 shadow-2xs"
              />
              <datalist id="projects-list">
                {APP_CONFIG.defaultProjects.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-plum-700 mb-1.5 flex items-center gap-1">
                <AlertCircle size={13} className="text-cosmo-alien" /> Priorità
              </label>
              <div className="flex rounded-2xl bg-white border border-cream-300 p-1">
                {APP_CONFIG.priorities.map((p) => {
                  const isSelected = priority === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                        isSelected
                          ? "bg-plum-800 text-white shadow-2xs"
                          : "text-plum-600 hover:text-plum-900"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-plum-700 mb-1.5 flex items-center gap-1">
              <FileText size={13} className="text-cosmo-alien" /> Note o link
            </label>
            <textarea
              rows={2}
              placeholder="Dettagli, appunti o promemoria..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs font-medium text-plum-900 bg-white rounded-2xl p-3 border border-cream-300 focus:outline-none focus:ring-2 focus:ring-cosmo-alien/30 shadow-2xs resize-none"
            />
          </div>

          {/* SEZIONE FILE MARKDOWN (.MD) ALLEGATI (Requisito 2) */}
          <div className="p-4 rounded-3xl bg-white border border-cream-300 shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-pastel-mint text-[#1D4E3A]">
                  <FileCode size={16} />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-plum-900 leading-tight">
                    File Markdown allegati (.md)
                  </h4>
                  <p className="text-[10px] text-plum-500">
                    Solo testo • Max 200 KB per file
                  </p>
                </div>
              </div>

              {/* Pulsante Allega un .md */}
              <div className="flex items-center gap-1.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".md,text/markdown,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-xl bg-pastel-sky hover:bg-[#B8DCFC] text-cosmo-alien font-bold text-xs flex items-center gap-1 transition-all shadow-2xs"
                  title="Carica un file .md dal telefono o computer"
                >
                  <Upload size={13} /> Sfoglia
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasteBox(!showPasteBox)}
                  className="px-2.5 py-1.5 rounded-xl bg-pastel-peach hover:bg-[#FFD7BC] text-[#5C3A20] font-bold text-xs flex items-center gap-1 transition-all shadow-2xs"
                  title="Incolla testo Markdown"
                >
                  <Plus size={13} /> Incolla
                </button>
              </div>
            </div>

            {/* Messaggio errore file */}
            {fileError && (
              <div className="p-2.5 rounded-xl bg-[#FFE5E5] text-[#D32F2F] text-xs font-medium border border-[#FFCDD2] flex items-center gap-1.5">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            {/* Box per incollare testo Markdown */}
            {showPasteBox && (
              <div className="p-3 bg-cream-50 rounded-2xl border border-cream-300 space-y-2 animate-pop-in">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-plum-700">Nuovo file .md</span>
                  <button
                    type="button"
                    onClick={() => setShowPasteBox(false)}
                    className="text-plum-400 hover:text-plum-700"
                  >
                    <X size={14} />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Nome file (es. bozza.md)"
                  value={pastedName}
                  onChange={(e) => setPastedName(e.target.value)}
                  className="w-full text-xs font-mono bg-white rounded-xl px-3 py-2 border border-cream-300 focus:outline-none focus:ring-1 focus:ring-cosmo-alien"
                />
                <textarea
                  rows={4}
                  placeholder="Incolla o scrivi qui il testo Markdown..."
                  value={pastedContent}
                  onChange={(e) => setPastedContent(e.target.value)}
                  className="w-full text-xs font-mono bg-white rounded-xl p-3 border border-cream-300 focus:outline-none focus:ring-1 focus:ring-cosmo-alien resize-y"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPasteBox(false)}
                    className="px-3 py-1.5 rounded-xl bg-white text-plum-600 text-xs font-semibold border border-cream-300"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!pastedContent.trim()) {
                        setFileError("Inserisci del testo.");
                        return;
                      }
                      const name = pastedName.trim() || `allegato-${Date.now()}.md`;
                      saveNewFile(name, pastedContent);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cosmo-alien hover:bg-[#2563EB] text-white text-xs font-bold transition-all"
                  >
                    Allega file .md
                  </button>
                </div>
              </div>
            )}

            {/* Elenco file allegati */}
            {files.length > 0 ? (
              <div className="space-y-3 pt-1">
                {files.map((file) => {
                  const isEditingThis = editingFileId === file.id;
                  const isCopied = copiedFileId === file.id;

                  return (
                    <div
                      key={file.id}
                      className="p-3 bg-cream-50 rounded-2xl border border-cream-200 space-y-2"
                    >
                      {/* Riga intestazione file */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileCode size={16} className="text-cosmo-alien flex-shrink-0" />
                          <span className="text-xs font-bold font-mono text-plum-900 truncate">
                            {file.name}
                          </span>
                          <span
                            className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-white border border-cream-300 text-plum-500"
                            title={`Creato da ${file.created_by}`}
                          >
                            {file.created_by === "claude" ? (
                              <>
                                <Bot size={10} className="mr-0.5 text-cosmo-alien" /> claude
                              </>
                            ) : (
                              <>
                                <User size={10} className="mr-0.5 text-plum-500" /> user
                              </>
                            )}
                          </span>
                        </div>

                        {/* Bottoni Copia testo e Scarica .md (Requisito 2) */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopyText(file)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs ${
                              isCopied
                                ? "bg-pastel-mint text-[#1D4E3A]"
                                : "bg-white hover:bg-cream-100 text-plum-700 border border-cream-300"
                            }`}
                            title="Copia negli appunti"
                          >
                            {isCopied ? (
                              <>
                                <Check size={13} className="text-[#1D4E3A]" /> Copiato!
                              </>
                            ) : (
                              <>
                                <Copy size={13} /> Copia testo
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadFile(file)}
                            className="px-2.5 py-1 rounded-xl bg-white hover:bg-cream-100 text-plum-700 border border-cream-300 text-xs font-bold flex items-center gap-1 transition-all shadow-2xs"
                            title="Scarica il file .md sul dispositivo"
                          >
                            <Download size={13} /> Scarica .md
                          </button>

                          {!isEditingThis && (
                            <button
                              type="button"
                              onClick={() => handleStartEditingFile(file)}
                              className="p-1 rounded-xl bg-white hover:bg-pastel-sky text-plum-500 hover:text-cosmo-alien border border-cream-300"
                              title="Modifica testo"
                            >
                              <Edit3 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Anteprima testo in carattere a spaziatura fissa o Editor inline (Requisito 2) */}
                      {isEditingThis ? (
                        <div className="space-y-2 pt-1 animate-pop-in">
                          <input
                            type="text"
                            value={editingFileName}
                            onChange={(e) => setEditingFileName(e.target.value)}
                            className="w-full text-xs font-mono bg-white rounded-xl px-2.5 py-1.5 border border-cream-300"
                          />
                          <textarea
                            rows={6}
                            value={editingFileContent}
                            onChange={(e) => setEditingFileContent(e.target.value)}
                            className="w-full text-xs font-mono bg-white rounded-xl p-2.5 border border-cream-300 focus:outline-none focus:ring-1 focus:ring-cosmo-alien whitespace-pre resize-y"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingFileId(null)}
                              className="px-3 py-1 bg-white text-plum-600 rounded-xl text-xs font-bold border border-cream-300"
                            >
                              Annulla
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveEditedFile}
                              className="px-3 py-1 bg-cosmo-alien hover:bg-[#2563EB] text-white rounded-xl text-xs font-bold"
                            >
                              Salva modifiche
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl p-2.5 border border-cream-200 max-h-36 overflow-y-auto">
                          <pre className="text-[11px] font-mono text-plum-800 whitespace-pre-wrap break-words leading-relaxed">
                            {file.content_md}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-plum-400 font-medium italic pt-1">
                Nessun file Markdown allegato. Tocca &quot;Sfoglia&quot; o &quot;Incolla&quot; per allegarne uno.
              </p>
            )}
          </div>

          {/* Sottoattività (Mini checklist) */}
          <div>
            <label className="block text-xs font-bold text-plum-700 mb-1.5 flex items-center gap-1">
              <ListTodo size={13} className="text-cosmo-alien" /> Sotto-attività (mini checklist)
            </label>

            <div className="space-y-1.5 mb-2">
              {subtasks.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-2 p-2 rounded-xl bg-white border border-cream-200"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleSubtask(sub.id)}
                    className="text-plum-400 hover:text-cosmo-alien"
                  >
                    {sub.done ? (
                      <CheckCircle2 size={18} className="fill-[#D6ECFF] text-cosmo-alien" />
                    ) : (
                      <Circle size={18} />
                    )}
                  </button>
                  <span
                    className={`flex-1 text-xs font-medium ${
                      sub.done ? "line-through text-plum-400" : "text-plum-800"
                    }`}
                  >
                    {sub.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(sub.id)}
                    className="text-plum-300 hover:text-[#D32F2F] p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Aggiungi passo..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 text-xs text-plum-900 bg-white rounded-xl px-3 py-2 border border-cream-300 focus:outline-none focus:ring-2 focus:ring-cosmo-alien/30 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => handleAddSubtask()}
                className="px-3 py-2 bg-pastel-sky hover:bg-[#B8DCFC] text-cosmo-alien rounded-xl font-bold text-xs flex items-center gap-1 transition-all"
              >
                <Plus size={14} /> Aggiungi
              </button>
            </div>
          </div>

          {/* Se in modifica: stato e bottone elimina */}
          {initialTask && (
            <div className="pt-2 border-t border-cream-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-plum-600">Stato:</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatusId)}
                  className="text-xs font-bold bg-white text-plum-800 rounded-xl px-3 py-1.5 border border-cream-300"
                >
                  <option value="todo">Da fare</option>
                  <option value="done">Completato</option>
                  <option value="skipped">Saltato</option>
                </select>
              </div>

              {onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-1 text-xs font-bold text-[#D32F2F] hover:bg-[#FFE5E5] px-3 py-1.5 rounded-xl transition-all"
                >
                  <Trash2 size={14} /> Elimina
                </button>
              )}
            </div>
          )}

          {/* Bottoni azione fondo */}
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-white hover:bg-cream-100 text-plum-700 font-bold text-sm border border-cream-300 transition-all shadow-2xs"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSaving || !title.trim()}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-cosmo-alien to-[#2563EB] hover:opacity-95 active:scale-[0.98] text-white font-bold text-sm transition-all shadow-soft disabled:opacity-50"
            >
              {isSaving ? "Salvataggio..." : initialTask ? "Aggiorna" : "Crea Attività"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
