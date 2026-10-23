"use client";

import React, { useState } from "react";
import { Task } from "@/types";
import { APP_CONFIG } from "@/config/app";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { parseLocalDate, getTodayString } from "@/lib/date-utils";

interface MonthViewProps {
  currentDate: string; // YYYY-MM-DD
  onSelectDateAndSwitchToDay: (date: string) => void;
  tasks: Task[];
}

export function MonthView({
  currentDate,
  onSelectDateAndSwitchToDay,
  tasks,
}: MonthViewProps) {
  const currentD = parseLocalDate(currentDate);
  const [viewYear, setViewYear] = useState(currentD.getFullYear());
  const [viewMonth, setViewMonth] = useState(currentD.getMonth()); // 0-indexed

  const changeMonth = (delta: number) => {
    let newM = viewMonth + delta;
    let newY = viewYear;
    if (newM < 0) {
      newM = 11;
      newY -= 1;
    } else if (newM > 11) {
      newM = 0;
      newY += 1;
    }
    setViewMonth(newM);
    setViewYear(newY);
  };

  // Calcola griglia mese
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

  // In Italia la settimana inizia di Lunedì (0 = Lunedì, 6 = Domenica)
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  const totalDays = lastDayOfMonth.getDate();
  const todayStr = getTodayString();

  // Giorni del mese precedente per riempire l'inizio
  const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
  const prefixDays = Array.from({ length: startDayOfWeek }, (_, i) => {
    const day = prevMonthLastDay - startDayOfWeek + i + 1;
    return { day, isCurrentMonth: false };
  });

  // Giorni del mese corrente
  const currentMonthDays = Array.from({ length: totalDays }, (_, i) => {
    const day = i + 1;
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;

    const dayTasks = tasks.filter((t) => t.date === dateStr);
    const hasTasks = dayTasks.length > 0;
    const allDone = hasTasks && dayTasks.every((t) => t.status === "done");
    const isToday = dateStr === todayStr;

    return {
      day,
      dateStr,
      isCurrentMonth: true,
      tasks: dayTasks,
      hasTasks,
      allDone,
      isToday,
    };
  });

  // Giorni del mese successivo per completare la griglia a multipli di 7
  const totalSlots = prefixDays.length + currentMonthDays.length;
  const suffixCount = (7 - (totalSlots % 7)) % 7;
  const suffixDays = Array.from({ length: suffixCount }, (_, i) => ({
    day: i + 1,
    isCurrentMonth: false,
  }));

  const monthLabel = firstDayOfMonth.toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });

  const weekdays = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

  return (
    <div className="pb-24">
      <div className="bg-white rounded-3xl p-5 border border-cream-300 shadow-soft">
        {/* Intestazione navigazione mese */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            className="p-2 rounded-2xl hover:bg-cream-100 text-plum-600 transition-colors"
            title="Mese precedente"
          >
            <ChevronLeft size={22} className="stroke-[2.5]" />
          </button>

          <h2 className="text-base font-bold text-plum-900 capitalize">
            {monthLabel}
          </h2>

          <button
            type="button"
            onClick={() => changeMonth(1)}
            className="p-2 rounded-2xl hover:bg-cream-100 text-plum-600 transition-colors"
            title="Mese successivo"
          >
            <ChevronRight size={22} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Intestazione giorni della settimana */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {weekdays.map((w) => (
            <span
              key={w}
              className="text-xs uppercase font-extrabold text-plum-400 py-1"
            >
              {w}
            </span>
          ))}
        </div>

        {/* Griglia giorni del mese */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Giorni mese precedente */}
          {prefixDays.map((p, idx) => (
            <div
              key={`prev-${idx}`}
              className="h-12 rounded-2xl flex items-center justify-center text-xs font-medium text-plum-300 bg-cream-50/50"
            >
              {p.day}
            </div>
          ))}

          {/* Giorni mese corrente */}
          {currentMonthDays.map((d) => (
            <button
              key={d.dateStr}
              type="button"
              onClick={() => onSelectDateAndSwitchToDay(d.dateStr)}
              className={`h-12 rounded-2xl flex flex-col items-center justify-center relative transition-all duration-150 border active:scale-95 ${
                d.isToday
                  ? "bg-pastel-sky/60 border-cosmo-accent/50 text-plum-900 font-black shadow-2xs"
                  : d.hasTasks
                  ? "bg-white border-cream-300 text-plum-800 font-bold hover:border-cosmo-accent hover:bg-cream-50"
                  : "bg-white/70 border-cream-200 text-plum-700 hover:bg-cream-50 font-medium"
              }`}
            >
              <span className="text-xs leading-none">{d.day}</span>

              {/* Puntini colorati per le attività */}
              {d.hasTasks && (
                <div className="flex items-center gap-0.5 mt-1">
                  {d.tasks.slice(0, 3).map((t, idx) => {
                    const kindCfg = APP_CONFIG.kinds.find((k) => k.id === t.kind);
                    const isTaskDone = t.status === "done";
                    return (
                      <span
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full ${
                          isTaskDone ? "opacity-40" : ""
                        }`}
                        style={{
                          backgroundColor: isTaskDone
                            ? "#8CB8A5"
                            : kindCfg?.bgColor || "#4F75FF",
                          border: isTaskDone ? "1px solid #8CB8A5" : "1px solid rgba(0,0,0,0.15)",
                        }}
                      />
                    );
                  })}
                  {d.tasks.length > 3 && (
                    <span className="text-[8px] font-bold text-plum-400 leading-none">
                      +
                    </span>
                  )}
                </div>
              )}
            </button>
          ))}

          {/* Giorni mese successivo */}
          {suffixDays.map((s, idx) => (
            <div
              key={`next-${idx}`}
              className="h-12 rounded-2xl flex items-center justify-center text-xs font-medium text-plum-300 bg-cream-50/50"
            >
              {s.day}
            </div>
          ))}
        </div>

        {/* Legenda puntini */}
        <div className="mt-5 pt-3 border-t border-cream-200 flex items-center justify-between text-xs text-plum-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pastel-pink border border-plum-300" />
            <span>Attività aperte</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8CB8A5]" />
            <span>Completate</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pastel-sky border border-cosmo-accent" />
            <span>Oggi</span>
          </div>
        </div>
      </div>
    </div>
  );
}
