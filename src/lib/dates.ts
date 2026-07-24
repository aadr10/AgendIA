/** Formate une date en YYYY-MM-DD en utilisant ses composants LOCAUX,
 * contrairement à toISOString() qui convertit en UTC (source de bugs de
 * décalage d'un jour selon le fuseau horaire du serveur). */
export function toLocalISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseLocalISODate(iso: string) {
  return new Date(iso + "T00:00:00");
}

export function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function addMonths(d: Date, n: number) {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

export function addYears(d: Date, n: number) {
  const r = new Date(d);
  r.setFullYear(r.getFullYear() + n);
  return r;
}

/** Lundi de la semaine contenant d (0=dimanche..6=samedi en JS). */
export function lundiDeLaSemaine(d: Date) {
  const date = new Date(d);
  const jour = date.getDay();
  const diff = jour === 0 ? -6 : 1 - jour;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function debutDuMois(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function debutDeLannee(d: Date) {
  return new Date(d.getFullYear(), 0, 1);
}
