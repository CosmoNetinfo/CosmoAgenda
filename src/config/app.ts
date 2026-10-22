// Configurazione centrale del marchio e dell'applicazione Orbita Agent
// Tutte le impostazioni di brand, colori, tipi e preferenze sono centralizzate qui.

export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "Orbita Agent",
  shortName: "Orbita",
  brandClaim: process.env.NEXT_PUBLIC_BRAND_CLAIM || "by Cosmonet",
  description: "L'agenda spaziale, pucciosa e intelligente per le tue giornate",
  version: "1.0.0",

  // Tema colori pastello e sfondi
  theme: {
    bgCream: "#FFF8F3", // Sfondo principale da brief
    textPlum: "#4A4458", // Testo scuro ad alta leggibilità
    textMuted: "#7A7289",
    borderLight: "#F0E7DE",
    mascotBlue: "#4F75FF",
    mascotLight: "#D6ECFF",
  },

  // Categorie / Tipi di attivita con colori pastello dedicati
  kinds: [
    {
      id: "articolo",
      label: "Articolo",
      bgColor: "#FFD6E0", // Rosa pastello
      textColor: "#5A2838",
      borderColor: "#F7B8C9",
      icon: "FileText",
    },
    {
      id: "vignetta",
      label: "Vignetta",
      bgColor: "#FFE5D0", // Pesca pastello
      textColor: "#5C3A20",
      borderColor: "#FAD0AF",
      icon: "Smile",
    },
    {
      id: "lo-sapevi-che",
      label: "Lo sapevi che",
      bgColor: "#FFF3C4", // Giallo burro
      textColor: "#554316",
      borderColor: "#F3E19C",
      icon: "Lightbulb",
    },
    {
      id: "consiglio-rapido",
      label: "Consiglio rapido",
      bgColor: "#D4F1E4", // Menta pastello
      textColor: "#1D4E3A",
      borderColor: "#B4E4CE",
      icon: "Sparkles",
    },
    {
      id: "flash-news",
      label: "Flash News",
      bgColor: "#FFE0B2", // Arancio chiaro pastello
      textColor: "#5A3010",
      borderColor: "#F5C78E",
      icon: "Zap",
    },
    {
      id: "call",
      label: "Call",
      bgColor: "#E4DAFF", // Lavanda pastello
      textColor: "#3A2966",
      borderColor: "#D0C0FA",
      icon: "PhoneCall",
    },
    {
      id: "app",
      label: "App",
      bgColor: "#D6ECFF", // Celeste pastello
      textColor: "#1E3E66",
      borderColor: "#B8DCFC",
      icon: "Smartphone",
    },
    {
      id: "sito",
      label: "Sito",
      bgColor: "#E0F2FE", // Azzurro ghiaccio
      textColor: "#154261",
      borderColor: "#BAE6FD",
      icon: "Globe",
    },
    {
      id: "social",
      label: "Social",
      bgColor: "#FCE7F3", // Rosa cipria
      textColor: "#5C2044",
      borderColor: "#FBCFE8",
      icon: "Share2",
    },
    {
      id: "altro",
      label: "Altro",
      bgColor: "#ECE8E1", // Grigio caldo pastello
      textColor: "#433E47",
      borderColor: "#DCD5CC",
      icon: "CheckSquare",
    },
  ] as const,

  // Priorità delle attività
  priorities: [
    { id: "bassa", label: "Bassa", color: "#8CB8A5", dotClass: "bg-[#8CB8A5]" },
    { id: "normale", label: "Normale", color: "#6B9AC4", dotClass: "bg-[#6B9AC4]" },
    { id: "alta", label: "Alta", color: "#FF7B72", dotClass: "bg-[#FF7B72]" },
  ] as const,

  // Progetti predefiniti suggeriti (l'utente può comunque inserire liberamente qualsiasi nome)
  defaultProjects: ["Cosmonet", "Solfège", "Personale", "Studio"],

  // Configurazione per la sezione "Idee e link"
  ideaProjects: [
    { id: "articolo-cosmonet", label: "Articolo Cosmonet", bgColor: "#FFD6E0", textColor: "#5A2838" },
    { id: "vignetta", label: "Vignetta", bgColor: "#FFE5D0", textColor: "#5C3A20" },
    { id: "lo-sapevi-che", label: "Lo sapevi che", bgColor: "#FFF3C4", textColor: "#554316" },
    { id: "altro", label: "Altro", bgColor: "#ECE8E1", textColor: "#433E47" },
  ] as const,

  ideaStatuses: [
    { id: "nuova", label: "Nuova", bgColor: "#E9EEFF", textColor: "#2F55E6", borderColor: "#BED6FF" },
    { id: "in_lavorazione", label: "In lavorazione", bgColor: "#FFF3C4", textColor: "#554316", borderColor: "#F3E19C" },
    { id: "pronta", label: "Pronta", bgColor: "#D4F1E4", textColor: "#1D4E3A", borderColor: "#B4E4CE" },
    { id: "scartata", label: "Scartata", bgColor: "#F2F0F6", textColor: "#756D89", borderColor: "#E2DEE9" },
  ] as const,
};

export type TaskKindId = (typeof APP_CONFIG.kinds)[number]["id"];
export type TaskPriorityId = (typeof APP_CONFIG.priorities)[number]["id"];
export type TaskStatusId = "todo" | "done" | "skipped";
