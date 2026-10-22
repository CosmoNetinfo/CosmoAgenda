// Gestione della cache locale offline per consentire la consultazione
// delle attivita anche con connessione debole o assente (Fase 3 - PWA)

import { Task } from "@/types";

const TASKS_CACHE_KEY = "orbita_tasks_cache_v1";
const LAST_SYNC_KEY = "orbita_last_sync_v1";

export const offlineStorage = {
  saveTasks(tasks: Task[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(tasks));
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (e) {
      console.warn("Impossibile salvare la cache offline:", e);
    }
  },

  getTasks(): Task[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(TASKS_CACHE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      console.warn("Errore lettura cache offline:", e);
      return [];
    }
  },

  getLastSync(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(LAST_SYNC_KEY);
  },

  clearCache(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TASKS_CACHE_KEY);
    localStorage.removeItem(LAST_SYNC_KEY);
  },
};
