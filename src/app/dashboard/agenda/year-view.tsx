"use client";

import { useRouter } from "next/navigation";
import { toLocalISODate } from "@/lib/dates";

const MOIS_NOMS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function MiniMois({ annee, mois, aujourdhuiISO }: { annee: number; mois: number; aujourdhuiISO: string }) {
  const router = useRouter();
  const premierJour = new Date(annee, mois, 1);
  const jourSemaineDuPremier = (premierJour.getDay() + 6) % 7;
  const nbJoursMois = new Date(annee, mois + 1, 0).getDate();
  const nbTotal = Math.ceil((jourSemaineDuPremier + nbJoursMois) / 7) * 7;

  const cellules = Array.from({ length: nbTotal }, (_, i) => {
    const jourDuMois = i - jourSemaineDuPremier + 1;
    if (jourDuMois < 1 || jourDuMois > nbJoursMois) return null;
    return new Date(annee, mois, jourDuMois);
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <button
        onClick={() => router.push(`/dashboard/agenda?vue=mois&date=${toLocalISODate(premierJour)}`)}
        className="mb-2 text-sm font-semibold text-slate-800 hover:underline"
      >
        {MOIS_NOMS[mois]}
      </button>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {cellules.map((date, i) => {
          if (!date) return <span key={i} />;
          const iso = toLocalISODate(date);
          const isToday = iso === aujourdhuiISO;
          return (
            <button
              key={i}
              onClick={() => router.push(`/dashboard/agenda?vue=jour&date=${iso}`)}
              className="mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[11px] hover:bg-slate-100"
              style={isToday ? { background: "#0E5E63", color: "#fff" } : { color: "#475569" }}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function YearView({ annee }: { annee: number }) {
  const aujourdhuiISO = toLocalISODate(new Date());
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 12 }, (_, mois) => (
        <MiniMois key={mois} annee={annee} mois={mois} aujourdhuiISO={aujourdhuiISO} />
      ))}
    </div>
  );
}
