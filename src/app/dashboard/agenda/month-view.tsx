"use client";

import { useRouter } from "next/navigation";
import { toLocalISODate } from "@/lib/dates";

type Praticien = { id: string; nom: string; couleur_agenda: string };
type RdvLeger = { debut: string; praticienId: string };

const JOURS_ENTETE = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function MonthView({
  moisISO,
  praticiens,
  rdvs,
}: {
  moisISO: string; // YYYY-MM-01
  praticiens: Praticien[];
  rdvs: RdvLeger[];
}) {
  const router = useRouter();
  const premierJourMois = new Date(moisISO + "T00:00:00");
  const annee = premierJourMois.getFullYear();
  const mois = premierJourMois.getMonth();

  const jourSemaineDuPremier = (premierJourMois.getDay() + 6) % 7; // 0=lundi
  const nbJoursMois = new Date(annee, mois + 1, 0).getDate();
  const nbCellulesDebut = jourSemaineDuPremier;
  const nbTotal = Math.ceil((nbCellulesDebut + nbJoursMois) / 7) * 7;

  const aujourdhui = toLocalISODate(new Date());

  const cellules = Array.from({ length: nbTotal }, (_, i) => {
    const jourDuMois = i - nbCellulesDebut + 1;
    const date = new Date(annee, mois, jourDuMois);
    return { date, dansLeMois: jourDuMois >= 1 && jourDuMois <= nbJoursMois };
  });

  function rdvsDuJour(iso: string) {
    return rdvs.filter((r) => toLocalISODate(new Date(r.debut)) === iso);
  }

  function ouvrirJour(date: Date) {
    router.push(`/dashboard/agenda?vue=jour&date=${toLocalISODate(date)}`);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="grid grid-cols-7 border-b border-slate-100">
        {JOURS_ENTETE.map((j) => (
          <div key={j} className="px-2 py-2 text-center text-xs font-medium text-slate-500">
            {j}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cellules.map(({ date, dansLeMois }, i) => {
          const iso = toLocalISODate(date);
          const rdvsJour = rdvsDuJour(iso);
          const isToday = iso === aujourdhui;
          const dots = rdvsJour.slice(0, 4).map((r, idx) => {
            const p = praticiens.find((p) => p.id === r.praticienId);
            return <span key={idx} className="h-1.5 w-1.5 rounded-full" style={{ background: p?.couleur_agenda ?? "#94A3B8" }} />;
          });

          return (
            <button
              key={i}
              onClick={() => ouvrirJour(date)}
              className="flex min-h-20 flex-col items-start gap-1 border-b border-r border-slate-100 p-2 text-left hover:bg-slate-50"
              style={{ opacity: dansLeMois ? 1 : 0.35 }}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium"
                style={isToday ? { background: "#0E5E63", color: "#fff" } : { color: "#334155" }}
              >
                {date.getDate()}
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {dots}
                {rdvsJour.length > 4 && <span className="text-[10px] text-slate-400">+{rdvsJour.length - 4}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
