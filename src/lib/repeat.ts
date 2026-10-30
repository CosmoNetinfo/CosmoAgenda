import { addDays } from "./date-utils";

// Regole di ripetizione salvate in tasks.repeat_rule:
//   "daily"          -> ogni giorno
//   "weekly:2,5"     -> ogni martedì e venerdì (0 = domenica ... 6 = sabato, come JS)
export const REPEAT_RULE_REGEX = /^(daily|weekly:[0-6](,[0-6])*)$/;

export const WEEKDAYS = [
  { v: 1, label: "Lun" },
  { v: 2, label: "Mar" },
  { v: 3, label: "Mer" },
  { v: 4, label: "Gio" },
  { v: 5, label: "Ven" },
  { v: 6, label: "Sab" },
  { v: 0, label: "Dom" },
];

export function parseRepeatDays(rule?: string | null): number[] {
  if (!rule) return [];
  if (rule === "daily") return [0, 1, 2, 3, 4, 5, 6];
  const m = /^weekly:([0-6](?:,[0-6])*)$/.exec(rule);
  return m ? Array.from(new Set(m[1].split(",").map(Number))) : [];
}

export function buildRepeatRule(days: number[]): string | null {
  const uniq = Array.from(new Set(days)).sort((a, b) => a - b);
  if (uniq.length === 0) return null;
  if (uniq.length === 7) return "daily";
  return `weekly:${uniq.join(",")}`;
}

export function describeRepeat(rule?: string | null): string {
  const days = parseRepeatDays(rule);
  if (days.length === 0) return "";
  if (days.length === 7) return "ogni giorno";
  return WEEKDAYS.filter((d) => days.includes(d.v)).map((d) => d.label).join(", ");
}

// Prossima data utile: dopo la data dell'attività e non prima di oggi
export function nextRepeatDate(fromDate: string, rule: string, today: string): string | null {
  const days = parseRepeatDays(rule);
  if (days.length === 0) return null;
  const yesterday = addDays(today, -1);
  const start = fromDate > yesterday ? fromDate : yesterday;
  for (let i = 1; i <= 14; i++) {
    const d = addDays(start, i);
    const [y, m, day] = d.split("-").map(Number);
    if (days.includes(new Date(y, m - 1, day).getDay())) return d;
  }
  return null;
}

// Tipi che entrano nella coda di pubblicazione
export const CONTENT_KINDS = ["articolo", "vignetta", "lo-sapevi-che", "consiglio-rapido", "flash-news", "social"];

// Dati della prossima occorrenza (senza file, link e testo social)
export function buildNextTask(t: any, nextDate: string) {
  return {
    user_id: t.user_id,
    title: t.title,
    notes: t.notes || null,
    date: nextDate,
    time: t.time || null,
    kind: t.kind,
    project: t.project || null,
    priority: t.priority,
    repeat_rule: t.repeat_rule,
    subtasks: (t.subtasks || []).map((s: any) => ({ ...s, done: false })),
    status: "todo",
    created_by: t.created_by || "user",
    pub_status: t.pub_status ? "da_preparare" : null,
  };
}
