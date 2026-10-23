"use client";

import React, { useState } from "react";
import { Task } from "@/types";
import { TaskCard } from "./TaskCard";
import { ChevronLeft, ChevronRight, Plus, CheckCircle2, Calendar } from "lucide-react";
import { parseLocalDate, getMonday, getLocalDateString, getTodayString, addDays } from "@/lib/date-utils";

interface WeekViewProps {
  currentDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  tasks: Task[];
  onToggleStatus: (task: Task) => void;
  onClickTask: (task: Task) => void;
  onOpenNewTaskForDate: (date: string) => void;
}

export function WeekView({
  currentDate,
  onSelectDate,
  tasks,
  onToggleStatus,
  onClickTask,
  onOpenNewTaskForDate,
}: WeekViewProps) {
  const selectedD = parseLocalDate(currentDate);
  const monday = getMonday(selectedD);
  const todayStr = getTodayString();

  // Costruisce i 7 giorni (Lunedì -> Domenica)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const dayDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const dateStr = getLocalDateString(dayDate);
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === currentDate;

    const weekdayShort = dayDate.toLocaleDateString("it-IT", { weekday: "short" });
    const dayNumber = dayDate.getDate();

    const dayTasks = tasks.filter((t) => t.date === dateStr);
    const doneTasks = dayTasks.filter((t) => t.status === "done");

    return {
      dateStr,
      weekdayShort: weekdayShort.charAt(0).toUpperCase() + weekdayShort.slice(1, 3),
      dayNumber,
      isToday,
      isSelected,
      tasks: dayTasks,
      totalCount: dayTasks.length,
      doneCount: doneTasks.length,
    };
  });

  const changeWeek = (deltaWeeks: number) => {
    onSelectDate(addDays(currentDate, deltaWeeks * 7));
  };

  // Calcolo totale settimana
  const weekTasks = tasks.filter((t) => weekDays.some((d) => d.dateStr === t.date));
  const weekDone = weekTasks.filter((t) => t.status === "done").length;

  const monthYearLabel = monday.toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="pb-24">
      {/* Navigatore Settimana */}
      <div className="bg-white rounded-3xl p-4 mb-4 border border-cream-300 shadow-soft">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => changeWeek(-1)}
            className="p-2 rounded-2xl hover:bg-cream-100 text-plum-600 transition-colors"
            title="Settimana precedente"
          >
            <ChevronLeft size={22} className="stroke-[2.5]" />
          </button>

          <div className="text-center">
            <h2 className="text-base font-bold text-plum-900 capitalize">
              {monthYearLabel}
            </h2>
            <p className="text-xs font-semibold text-cosmo-alien">
              {weekDone}/{weekTasks.length} attività completate
            </p>
          </div>

          <button
            type="button"
            onClick={() => changeWeek(1)}
            className="p-2 rounded-2xl hover:bg-cream-100 text-plum-600 transition-colors"
            title="Settimana successiva"
          >
            <ChevronRight size={22} className="stroke-[2.5]" />
          </button>
        </div>

        {/* 7 Pulsanti rapidi dei giorni in alto */}
        <div className="grid grid-cols-7 gap-1.5 mt-3 pt-3 border-t border-cream-200">
          {weekDays.map((d) => (
            <button
              key={d.dateStr}
              type="button"
              onClick={() => onSelectDate(d.dateStr)}
              className={`flex flex-col items-center py-2 px-1 rounded-2xl transition-all duration-200 border ${
                d.isSelected
                  ? "bg-cosmo-alien text-white border-cosmo-alien shadow-sm scale-105"
                  : d.isToday
                  ? "bg-pastel-sky/60 text-plum-900 border-cosmo-accent/40 font-bold"
                  : "bg-cream-50 text-plum-700 border-cream-200 hover:bg-cream-100"
              }`}
            >
              <span className={`text-[10px] uppercase font-bold ${d.isSelected ? "text-white/80" : "text-plum-400"}`}>
                {d.weekdayShort}
              </span>
              <span className="text-sm font-black mt-0.5">{d.dayNumber}</span>
              {/* Indicatore puntino o conteggio */}
              <div className="mt-1 flex items-center justify-center h-2">
                {d.totalCount > 0 && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      d.isSelected
                        ? "bg-white"
                        : d.doneCount === d.totalCount
                        ? "bg-pastel-mint"
                        : "bg-pastel-pink"
                    }`}
                  />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Elenco dei 7 giorni con le rispettive attività */}
      <div className="space-y-4">
        {weekDays.map((d) => (
          <div
            key={d.dateStr}
            className={`rounded-3xl border p-4 transition-all ${
              d.isSelected
                ? "bg-white border-cosmo-accent/50 shadow-soft ring-2 ring-cosmo-alien/10"
                : d.isToday
                ? "bg-white/90 border-cream-300 shadow-soft"
                : "bg-white/60 border-cream-200 shadow-2xs"
            }`}
          >
            {/* Intestazione riga giorno */}
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-cream-200/80">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-black px-2.5 py-1 rounded-xl ${
                    d.isToday
                      ? "bg-cosmo-alien text-white"
                      : "bg-cream-200 text-plum-800"
                  }`}
                >
                  {d.weekdayShort} {d.dayNumber}
                </span>

                {d.totalCount > 0 ? (
                  <span className="text-xs font-bold text-plum-500">
                    {d.doneCount}/{d.totalCount} fatti
                  </span>
                ) : (
                  <span className="text-xs text-plum-400 font-medium">Libero</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => onOpenNewTaskForDate(d.dateStr)}
                className="p-1 rounded-xl bg-cream-100 hover:bg-pastel-sky text-plum-600 hover:text-cosmo-alien transition-colors"
                title="Aggiungi per questo giorno"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Attività del giorno */}
            {d.tasks.length > 0 ? (
              <div className="space-y-2">
                {d.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleStatus={onToggleStatus}
                    onClick={onClickTask}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-plum-400 font-medium italic py-1">
                Nessuna attività
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
