"use client";

import React from "react";
import { ViewMode } from "@/types";
import { CalendarCheck, CalendarDays, CalendarRange, Lightbulb } from "lucide-react";

interface BottomNavProps {
  currentView: ViewMode;
  onChangeView: (view: ViewMode) => void;
  todayCount?: number;
  ideasCount?: number;
}

export function BottomNav({
  currentView,
  onChangeView,
  todayCount,
  ideasCount,
}: BottomNavProps) {
  const tabs = [
    {
      id: "day" as ViewMode,
      label: "Oggi",
      icon: CalendarCheck,
      badge: todayCount,
    },
    {
      id: "week" as ViewMode,
      label: "Settimana",
      icon: CalendarDays,
    },
    {
      id: "month" as ViewMode,
      label: "Mese",
      icon: CalendarRange,
    },
    {
      id: "ideas" as ViewMode,
      label: "Idee",
      icon: Lightbulb,
      badge: ideasCount,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-cream-300/80 px-2 py-2 pb-safe shadow-soft">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentView === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeView(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3.5 sm:px-5 rounded-3xl transition-all duration-200 select-none ${
                isActive
                  ? "bg-pastel-sky/60 text-cosmo-alien font-bold scale-105 shadow-2xs"
                  : "text-plum-500 hover:text-plum-800 font-medium"
              }`}
            >
              <div className="relative">
                <Icon
                  size={20}
                  className={`transition-transform duration-200 ${
                    isActive ? "stroke-[2.5]" : "stroke-[1.8]"
                  }`}
                />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 min-w-[15px] h-3.5 text-[9px] font-bold rounded-full bg-pastel-pink text-plum-900 border border-white flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
