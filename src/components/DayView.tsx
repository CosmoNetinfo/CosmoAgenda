"use client";

import React, { useEffect, useState } from "react";
import { Task } from "@/types";
import { TaskCard } from "./TaskCard";
import { MascotCosmino } from "./MascotCosmino";
import { ChevronLeft, ChevronRight, Plus, Sparkles, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { addDays, getTodayString, formatItalianDate } from "@/lib/date-utils";

interface DayViewProps {
  currentDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  tasks: Task[];
  overdueTasks: Task[];
  onToggleStatus: (task: Task) => void;
  onClickTask: (task: Task) => void;
  onMoveToToday: (task: Task) => void;
  onOpenNewTask: () => void;
}

export function DayView({
  currentDate,
  onDateChange,
  tasks,
  overdueTasks,
  onToggleStatus,
  onClickTask,
  onMoveToToday,
  onOpenNewTask,
}: DayViewProps) {
  const [hasCelebrated, setHasCelebrated] = useState(false);

  // Ordina le attività del giorno: prima quelle con orario cronologico, poi senza orario
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status !== b.status) {
      if (a.status === "done") return 1;
      if (b.status === "done") return -1;
    }
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time) return -1;
    if (b.time) return 1;
    return a.title.localeCompare(b.title);
  });

  const totalCount = tasks.length;
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const isAllDone = totalCount > 0 && doneCount === totalCount;

  // Effetto coriandoli quando tutti i compiti sono finiti
  useEffect(() => {
    if (isAllDone && !hasCelebrated) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#FFD6E0", "#FFE5D0", "#D4F1E4", "#E4DAFF", "#D6ECFF", "#4F75FF"],
      });
      setHasCelebrated(true);
    } else if (!isAllDone) {
      setHasCelebrated(false);
    }
  }, [isAllDone, hasCelebrated]);

  // Navigazione date
  const changeDay = (delta: number) => {
    onDateChange(addDays(currentDate, delta));
  };

  const setToday = () => {
    onDateChange(getTodayString());
  };

  const { title, subtitle, isToday } = formatItalianDate(currentDate);

  return (
    <div className="pb-24">
      {/* Intestazione Giorno e selettore data */}
      <div className="bg-white rounded-3xl p-4 mb-4 border border-cream-300 shadow-soft">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => changeDay(-1)}
            className="p-2 rounded-2xl hover:bg-cream-100 text-plum-600 transition-colors"
            title="Giorno precedente"
          >
            <ChevronLeft size={22} className="stroke-[2.5]" />
          </button>

          <div className="text-center cursor-pointer select-none" onClick={setToday}>
            <h2 className="text-lg font-bold text-plum-900 leading-tight flex items-center justify-center gap-1.5">
              {title}
              {isToday && (
                <span className="w-2 h-2 rounded-full bg-cosmo-alien animate-pulse" />
              )}
            </h2>
            <p className="text-xs font-semibold text-plum-500 capitalize">{subtitle}</p>
          </div>

          <button
            type="button"
            onClick={() => changeDay(1)}
            className="p-2 rounded-2xl hover:bg-cream-100 text-plum-600 transition-colors"
            title="Giorno successivo"
          >
            <ChevronRight size={22} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Barra di avanzamento giornaliera */}
        {totalCount > 0 && (
          <div className="mt-3 pt-3 border-t border-cream-200">
            <div className="flex items-center justify-between text-xs font-bold text-plum-700 mb-1.5">
              <span>Progresso giornata</span>
              <span className="text-cosmo-alien">
                {doneCount}/{totalCount} completati
              </span>
            </div>
            <div className="w-full h-2.5 bg-cream-200 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-cosmo-accent to-cosmo-alien rounded-full transition-all duration-500"
                style={{ width: `${(doneCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Sezione: Da recuperare (giorni passati non completati) */}
      {isToday && overdueTasks.length > 0 && (
        <div className="mb-5 p-4 rounded-3xl bg-gradient-to-br from-[#FFF0EB] to-cream-100 border border-[#FFD5C8] shadow-soft animate-pop-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[#FFE2D6] text-[#D84315]">
                <AlertCircle size={16} className="stroke-[2.5]" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#5C2B1C] leading-none">
                  Da recuperare
                </h3>
                <p className="text-[11px] font-medium text-[#8D4B38] mt-0.5">
                  {overdueTasks.length} {overdueTasks.length === 1 ? "attività rimasta" : "attività rimaste"} indietro
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => overdueTasks.forEach((t) => onMoveToToday(t))}
              className="text-xs font-bold px-3 py-1.5 rounded-2xl bg-white text-[#D84315] hover:bg-[#FFEAE2] border border-[#FFC4B2] shadow-2xs transition-all active:scale-95"
            >
              Sposta tutte a oggi
            </button>
          </div>

          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleStatus={onToggleStatus}
                onClick={onClickTask}
                onMoveToToday={onMoveToToday}
                isOverdue={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Elenco attività del giorno */}
      {sortedTasks.length > 0 ? (
        <div className="space-y-2.5">
          {sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleStatus={onToggleStatus}
              onClick={onClickTask}
            />
          ))}
        </div>
      ) : (
        /* Empty State Puccioso con Mascotte Cosmino */
        <div className="flex flex-col items-center justify-center p-8 bg-white/70 backdrop-blur-xs rounded-3xl border border-dashed border-cream-300 text-center my-6">
          <MascotCosmino
            mood={isAllDone ? "celebrating" : "happy"}
            size={110}
            animate={true}
          />
          <h3 className="text-base font-bold text-plum-900 mt-3">
            {isAllDone ? "Tutto fatto, sei un grande! 🚀" : "Nessuna attività programmata"}
          </h3>
          <p className="text-xs text-plum-500 font-medium max-w-xs mt-1">
            {isAllDone
              ? "Tutte le cose in agenda per oggi sono state completate. Rilassati o goditi la giornata!"
              : "La tua orbita oggi è libera e serena. Tocca il tasto + per aggiungere un compito."}
          </p>

          <button
            type="button"
            onClick={onOpenNewTask}
            className="mt-4 px-4 py-2 rounded-2xl bg-pastel-sky hover:bg-[#B8DCFC] text-cosmo-alien font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <Plus size={16} className="stroke-[2.5]" />
            Aggiungi ora
          </button>
        </div>
      )}

      {/* Bottone galleggiante "+" (Floating Action Button per pollice) */}
      <button
        type="button"
        onClick={onOpenNewTask}
        className="fixed bottom-20 right-5 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-cosmo-alien to-[#6B8CFF] text-white shadow-floating hover:scale-105 active:scale-95 transition-all flex items-center justify-center border-2 border-white"
        title="Aggiungi nuova attività"
      >
        <Plus size={30} className="stroke-[2.5]" />
      </button>
    </div>
  );
}
