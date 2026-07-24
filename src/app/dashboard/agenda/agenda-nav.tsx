"use client";

import { useRouter } from "next/navigation";
import { addDays, addMonths, addYears, toLocalISODate, parseLocalISODate } from "@/lib/dates";

type Vue = "jour" | "semaine" | "mois" | "annee";

const VUES: { valeur: Vue; label: string }[] = [
  { valeur: "jour", label: "Jour" },
  { valeur: "semaine", label: "Semaine" },
  { valeur: "mois", label: "Mois" },
  { valeur: "annee", label: "Année" },
];

export default function AgendaNav({ vue, dateISO }: { vue: Vue; dateISO: string }) {
  const router = useRouter();
  const date = parseLocalISODate(dateISO);

  function aller(vue: Vue, d: Date) {
    router.push(`/dashboard/agenda?vue=${vue}&date=${toLocalISODate(d)}`);
  }

  function precedent() {
    if (vue === "jour") aller(vue, addDays(date, -1));
    else if (vue === "semaine") aller(vue, addDays(date, -7));
    else if (vue === "mois") aller(vue, addMonths(date, -1));
    else aller(vue, addYears(date, -1));
  }

  function suivant() {
    if (vue === "jour") aller(vue, addDays(date, 1));
    else if (vue === "semaine") aller(vue, addDays(date, 7));
    else if (vue === "mois") aller(vue, addMonths(date, 1));
    else aller(vue, addYears(date, 1));
  }

  const label =
    vue === "jour"
      ? date.toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" })
      : vue === "semaine"
      ? `Semaine du ${date.toLocaleDateString("fr-BE", { day: "numeric", month: "long" })}`
      : vue === "mois"
      ? date.toLocaleDateString("fr-BE", { month: "long", year: "numeric" })
      : String(date.getFullYear());

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button onClick={precedent} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-500">
          ‹
        </button>
        <div className="min-w-40 font-medium capitalize text-slate-800">{label}</div>
        <button onClick={suivant} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-500">
          ›
        </button>
        <button
          onClick={() => aller(vue, new Date())}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 hover:border-slate-400"
        >
          Aujourd&apos;hui
        </button>
      </div>
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 text-xs">
        {VUES.map((v) => (
          <button
            key={v.valeur}
            onClick={() => aller(v.valeur, date)}
            className="rounded-md px-3 py-1 font-medium"
            style={v.valeur === vue ? { background: "#0E5E63", color: "#fff" } : { color: "#94A3B8" }}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}
