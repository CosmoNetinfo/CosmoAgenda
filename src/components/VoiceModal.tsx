"use client";

import React, { useState, useRef } from "react";
import { CreateTaskInput } from "@/types";
import { APP_CONFIG, TaskKindId, TaskPriorityId } from "@/config/app";
import { MascotCosmino } from "./MascotCosmino";
import {
  Mic,
  Square,
  Sparkles,
  X,
  Check,
  AlertCircle,
  Calendar,
  Clock,
  Folder,
  Tag,
  Loader2,
} from "lucide-react";

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmTask: (task: CreateTaskInput) => Promise<void>;
}

export function VoiceModal({ isOpen, onClose, onConfirmTask }: VoiceModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewTask, setPreviewTask] = useState<CreateTaskInput | null>(null);
  const [transcribedText, setTranscribedText] = useState("");
  const [manualText, setManualText] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  if (!isOpen) return null;

  const startRecording = async () => {
    setErrorMsg(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Errore accesso microfono:", err);
      setErrorMsg(
        "Impossibile accedere al microfono. Assicurati di aver concesso i permessi nel browser o inserisci la frase a mano qui sotto."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      const res = await fetch("/api/voice", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Errore elaborazione vocale");
      }

      const result = await res.json();
      setTranscribedText(result.transcription || "");
      setPreviewTask({
        title: result.extracted.title || "Attività senza titolo",
        date: result.extracted.date || new Date().toISOString().slice(0, 10),
        time: result.extracted.time || null,
        kind: (result.extracted.kind as TaskKindId) || "altro",
        project: result.extracted.project || null,
        priority: (result.extracted.priority as TaskPriorityId) || "normale",
        notes: result.extracted.notes || null,
        created_by: "assistant",
      });
    } catch (err: any) {
      console.error("Errore vocale:", err);
      setErrorMsg(err.message || "Errore nella trascrizione o estrazione.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessManualText = async () => {
    if (!manualText.trim() || isProcessing) return;
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: manualText.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Errore elaborazione testo");
      }

      const result = await res.json();
      setTranscribedText(manualText.trim());
      setPreviewTask({
        title: result.extracted.title || manualText.trim(),
        date: result.extracted.date || new Date().toISOString().slice(0, 10),
        time: result.extracted.time || null,
        kind: (result.extracted.kind as TaskKindId) || "altro",
        project: result.extracted.project || null,
        priority: (result.extracted.priority as TaskPriorityId) || "normale",
        notes: result.extracted.notes || null,
        created_by: "assistant",
      });
    } catch (err: any) {
      console.error("Errore manuale:", err);
      setErrorMsg(err.message || "Errore durante l'elaborazione.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (!previewTask) return;
    try {
      await onConfirmTask(previewTask);
      onClose();
    } catch (err) {
      alert("Errore durante il salvataggio.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-plum-900/50 backdrop-blur-xs animate-pop-in">
      <div className="w-full max-w-md bg-cream-50 rounded-t-4xl sm:rounded-3xl border border-cream-300 shadow-floating p-6 overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Header modale */}
        <div className="flex items-center justify-between pb-3 border-b border-cream-200">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-gradient-to-tr from-pastel-pink to-pastel-peach text-plum-900">
              <Sparkles size={18} />
            </span>
            <h3 className="text-base font-bold text-plum-900">Dettatura Vocale IA</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-cream-100 text-plum-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mascotte e stato microfono */}
        <div className="flex flex-col items-center justify-center text-center py-6">
          <MascotCosmino
            mood={isProcessing ? "thinking" : isRecording ? "happy" : "happy"}
            size={90}
            animate={isRecording || isProcessing}
          />

          {!previewTask ? (
            <>
              <p className="text-sm font-semibold text-plum-800 mt-3">
                {isRecording
                  ? "Ti sto ascoltando... Parla liberamente!"
                  : isProcessing
                  ? "Cosmino sta elaborando con Whisper & Llama..."
                  : "Premi il microfono e dì cosa devi fare"}
              </p>
              <p className="text-xs text-plum-500 mt-1 max-w-xs">
                Es: &quot;Domani alle 15 call con Daniele per Cosmonet, priorità alta&quot;
              </p>

              {/* Tasto Microfono Principale */}
              <div className="mt-5">
                {isRecording ? (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="w-18 h-18 rounded-full bg-[#FF4D4D] text-white shadow-floating hover:scale-105 active:scale-95 transition-all flex items-center justify-center animate-pulse border-4 border-white"
                  >
                    <Square size={26} className="fill-white" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={startRecording}
                    className="w-18 h-18 rounded-full bg-gradient-to-tr from-cosmo-alien to-[#6B8CFF] text-white shadow-floating hover:scale-105 active:scale-95 transition-all flex items-center justify-center border-4 border-white disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 size={28} className="animate-spin" />
                    ) : (
                      <Mic size={30} className="stroke-[2.2]" />
                    )}
                  </button>
                )}
              </div>

              {/* Inserimento testo alternativo (se microfono bloccato o dettatura da tastiera) */}
              <div className="w-full mt-6 pt-4 border-t border-cream-200">
                <p className="text-[11px] font-bold text-plum-500 uppercase tracking-wider mb-2">
                  Oppure scrivi la frase
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Es. Articolo Cosmonet venerdì alle 10..."
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleProcessManualText();
                    }}
                    className="flex-1 text-xs text-plum-900 bg-white rounded-2xl px-3.5 py-2.5 border border-cream-300 focus:outline-none focus:ring-2 focus:ring-cosmo-alien/30 shadow-2xs"
                  />
                  <button
                    type="button"
                    disabled={!manualText.trim() || isProcessing}
                    onClick={handleProcessManualText}
                    className="px-3 py-2.5 bg-pastel-lavender hover:bg-[#D0C0FA] text-plum-900 font-bold text-xs rounded-2xl transition-all disabled:opacity-50"
                  >
                    Analizza
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* ANTEPRIMA DELL'ATTIVITÀ ESTRATTA PRIMA DELLA CONFERMA */
            <div className="w-full mt-2 text-left animate-pop-in">
              <div className="p-3 bg-pastel-mint/30 rounded-2xl border border-pastel-mint text-xs text-[#1D4E3A] mb-3 flex items-start gap-2">
                <Sparkles size={16} className="flex-shrink-0 mt-0.5 text-cosmo-alien" />
                <span>
                  Ho compreso questo compito. Modifica se vuoi e tocca <b>Conferma</b> per salvare:
                </span>
              </div>

              <div className="bg-white rounded-3xl p-4 border border-cream-300 shadow-soft space-y-3">
                {/* Titolo */}
                <div>
                  <label className="text-[10px] font-bold text-plum-500 uppercase">Titolo</label>
                  <input
                    type="text"
                    value={previewTask.title}
                    onChange={(e) =>
                      setPreviewTask({ ...previewTask, title: e.target.value })
                    }
                    className="w-full font-bold text-sm text-plum-900 bg-cream-50 rounded-xl px-3 py-2 border border-cream-200"
                  />
                </div>

                {/* Data e Ora */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-plum-500 uppercase flex items-center gap-1">
                      <Calendar size={11} /> Data
                    </label>
                    <input
                      type="date"
                      value={previewTask.date}
                      onChange={(e) =>
                        setPreviewTask({ ...previewTask, date: e.target.value })
                      }
                      className="w-full text-xs font-semibold text-plum-900 bg-cream-50 rounded-xl px-2.5 py-1.5 border border-cream-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-plum-500 uppercase flex items-center gap-1">
                      <Clock size={11} /> Ora
                    </label>
                    <input
                      type="time"
                      value={previewTask.time || ""}
                      onChange={(e) =>
                        setPreviewTask({
                          ...previewTask,
                          time: e.target.value || null,
                        })
                      }
                      className="w-full text-xs font-semibold text-plum-900 bg-cream-50 rounded-xl px-2.5 py-1.5 border border-cream-200"
                    />
                  </div>
                </div>

                {/* Tipo e Progetto */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-plum-500 uppercase flex items-center gap-1">
                      <Tag size={11} /> Tipo
                    </label>
                    <select
                      value={previewTask.kind}
                      onChange={(e) =>
                        setPreviewTask({
                          ...previewTask,
                          kind: e.target.value as TaskKindId,
                        })
                      }
                      className="w-full text-xs font-semibold text-plum-900 bg-cream-50 rounded-xl px-2.5 py-1.5 border border-cream-200"
                    >
                      {APP_CONFIG.kinds.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-plum-500 uppercase flex items-center gap-1">
                      <Folder size={11} /> Progetto
                    </label>
                    <input
                      type="text"
                      value={previewTask.project || ""}
                      placeholder="Nessuno"
                      onChange={(e) =>
                        setPreviewTask({
                          ...previewTask,
                          project: e.target.value || null,
                        })
                      }
                      className="w-full text-xs font-semibold text-plum-900 bg-cream-50 rounded-xl px-2.5 py-1.5 border border-cream-200"
                    />
                  </div>
                </div>
              </div>

              {/* Bottoni Conferma o Riprova */}
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setPreviewTask(null)}
                  className="flex-1 py-3 bg-white hover:bg-cream-100 text-plum-700 font-bold text-xs rounded-2xl border border-cream-300 transition-all"
                >
                  Riprova
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 py-3 bg-gradient-to-r from-cosmo-alien to-[#2563EB] text-white font-bold text-xs rounded-2xl shadow-soft hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Check size={16} /> Conferma e Salva
                </button>
              </div>
            </div>
          )}

          {/* Messaggi di errore */}
          {errorMsg && (
            <div className="mt-4 p-3 rounded-2xl bg-[#FFE5E5] text-[#D32F2F] text-xs font-medium border border-[#FFCDD2] flex items-center gap-2 text-left">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
