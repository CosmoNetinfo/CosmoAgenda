/**
 * Utility per la gestione coerente e accurata delle date in formato locale YYYY-MM-DD.
 * Risolve il problema del fuso orario in cui new Date().toISOString() restituisce
 * il giorno precedente prima delle ore 01:00/02:00 in Italia (+01:00/+02:00 UTC).
 */

// Restituisce una data (o adesso) in formato locale "YYYY-MM-DD"
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Restituisce la data odierna locale "YYYY-MM-DD"
export function getTodayString(): string {
  return getLocalDateString(new Date());
}

// Effettua il parsing sicuro di una stringa "YYYY-MM-DD" come mezzanotte locale
export function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split("-").map(Number);
  const year = parts[0] || new Date().getFullYear();
  const month = (parts[1] || 1) - 1;
  const day = parts[2] || 1;
  return new Date(year, month, day);
}

// Aggiunge o sottrae giorni a una data "YYYY-MM-DD"
export function addDays(dateStr: string, days: number): string {
  const parts = dateStr.split("-").map(Number);
  const year = parts[0] || new Date().getFullYear();
  const month = (parts[1] || 1) - 1;
  const day = (parts[2] || 1) + days;
  const d = new Date(year, month, day);
  return getLocalDateString(d);
}

// Verifica se una stringa data è oggi
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayString();
}

// Calcola l'inizio della settimana (Lunedì) per una data locale
export function getMonday(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay();
  // 0 è Domenica, quindi diff è -6; 1 è Lunedì -> diff 0, ecc.
  const diff = date.getDate() - (day === 0 ? 6 : day - 1);
  return new Date(date.getFullYear(), date.getMonth(), diff);
}

// Formatta la data per l'intestazione italiana (es. "Oggi, Venerdì" e "23 Ottobre")
export function formatItalianDate(dateStr: string) {
  const d = parseLocalDate(dateStr);
  const currentToday = getTodayString();
  const isCurrentDayToday = dateStr === currentToday;

  const weekday = d.toLocaleDateString("it-IT", { weekday: "long" });
  const dayMonth = d.toLocaleDateString("it-IT", { day: "numeric", month: "long" });
  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);

  return {
    title: isCurrentDayToday ? `Oggi, ${capitalizedWeekday}` : capitalizedWeekday,
    subtitle: dayMonth,
    isToday: isCurrentDayToday,
  };
}
