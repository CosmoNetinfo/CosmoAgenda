"use client";

import React from "react";
import { APP_CONFIG } from "@/config/app";
import { MascotCosmino } from "./MascotCosmino";
import { Mic, Search, Info, LogOut, X, Sparkles, Bell } from "lucide-react";

interface HeaderProps {
  onOpenVoice: () => void;
  onOpenInfo: () => void;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedProject: string | null;
  onSelectProject: (project: string | null) => void;
  availableProjects: string[];
}

export function Header({
  onOpenVoice,
  onOpenInfo,
  onLogout,
  searchQuery,
  onSearchChange,
  selectedProject,
  onSelectProject,
  availableProjects,
}: HeaderProps) {
  const [showSearch, setShowSearch] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 bg-cream-100/90 backdrop-blur-md border-b border-cream-300/80 px-4 py-3">
      <div className="max-w-md mx-auto">
        {/* Riga superiore: Logo, Mascotte e Azioni */}
        <div className="flex items-center justify-between gap-2">
          {/* Logo e Mascotte */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white shadow-soft flex items-center justify-center border border-cream-200">
              <MascotCosmino size={32} animate={false} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-black tracking-tight text-plum-900 leading-none">
                  {APP_CONFIG.name}
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-pastel-mint text-[#1D4E3A] border border-[#B4E4CE]">
                  v{APP_CONFIG.version}
                </span>
              </div>
              <p className="text-[11px] font-medium text-plum-500 tracking-tight leading-tight mt-0.5">
                {APP_CONFIG.brandClaim}
              </p>
            </div>
          </div>

          {/* Azioni rapide */}
          <div className="flex items-center gap-1.5">
            {/* Tasto Vocale (Fase 5) */}
            <button
              onClick={onOpenVoice}
              type="button"
              className="relative p-2.5 rounded-2xl bg-gradient-to-tr from-pastel-pink to-pastel-peach text-plum-800 hover:scale-105 active:scale-95 transition-all shadow-soft border border-pastel-pink/60 flex items-center justify-center group"
              title="Dettatura vocale con IA"
            >
              <Mic size={18} className="stroke-[2.2] text-[#5A2838] group-hover:animate-bounce-gentle" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF8DA1] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E64980]"></span>
              </span>
            </button>

            {/* Tasto Cerca */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              type="button"
              className={`p-2.5 rounded-2xl transition-all shadow-2xs border ${
                showSearch
                  ? "bg-pastel-sky text-cosmo-alien border-pastel-sky"
                  : "bg-white text-plum-600 border-cream-200 hover:bg-cream-50"
              }`}
              title="Cerca tra le attività"
            >
              <Search size={18} className="stroke-[2]" />
            </button>

            {/* Tasto Notifiche e Info */}
            <button
              onClick={onOpenInfo}
              type="button"
              className="p-2.5 rounded-2xl bg-white text-plum-600 border border-cream-200 hover:bg-cream-50 transition-all shadow-2xs hover:text-cosmo-alien"
              title="Notifiche e Connettori"
            >
              <Bell size={18} className="stroke-[2]" />
            </button>

            {/* Tasto Info */}
            <button
              onClick={onOpenInfo}
              type="button"
              className="p-2.5 rounded-2xl bg-white text-plum-600 border border-cream-200 hover:bg-cream-50 transition-all shadow-2xs"
              title="Info e connettore MCP"
            >
              <Info size={18} className="stroke-[2]" />
            </button>

            {/* Tasto Esci */}
            <button
              onClick={onLogout}
              type="button"
              className="p-2.5 rounded-2xl bg-white text-plum-500 border border-cream-200 hover:bg-[#FFE5E5] hover:text-[#D32F2F] hover:border-[#FFCDD2] transition-all shadow-2xs"
              title="Esci dall'account"
            >
              <LogOut size={18} className="stroke-[2]" />
            </button>
          </div>
        </div>

        {/* Barra di ricerca espandibile */}
        {showSearch && (
          <div className="mt-3 relative animate-pop-in">
            <input
              type="text"
              placeholder="Cerca per titolo, note o tipo..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              autoFocus
              className="w-full bg-white text-plum-900 placeholder-plum-400 text-sm rounded-2xl pl-10 pr-9 py-2 border border-cream-300 focus:outline-none focus:ring-2 focus:ring-cosmo-alien/30 focus:border-cosmo-alien shadow-soft"
            />
            <Search size={16} className="absolute left-3.5 top-2.5 text-plum-400 stroke-[2]" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-2.5 text-plum-400 hover:text-plum-700"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Filtri rapidi per progetto */}
        {availableProjects.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mt-2 pt-1 pb-0.5">
            <button
              onClick={() => onSelectProject(null)}
              className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap transition-all border ${
                selectedProject === null
                  ? "bg-plum-800 text-white border-plum-800 shadow-2xs font-semibold"
                  : "bg-white text-plum-600 border-cream-300 hover:border-plum-300"
              }`}
            >
              Tutti i progetti
            </button>
            {availableProjects.map((p) => (
              <button
                key={p}
                onClick={() => onSelectProject(selectedProject === p ? null : p)}
                className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap transition-all border ${
                  selectedProject === p
                    ? "bg-pastel-lavender text-plum-900 border-[#D0C0FA] shadow-2xs font-semibold"
                    : "bg-white text-plum-600 border-cream-300 hover:border-plum-300"
                }`}
              >
                #{p}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
