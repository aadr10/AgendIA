"use client";

import { useState } from "react";
import { badgeStyle, STATUT_LABELS } from "@/components/ui";

type Appel = {
  id: string;
  patientNom: string;
  numero: string;
  debut: string;
  dureeSecondes: number;
  resultat: string;
  transcription: { qui: string; texte: string }[];
};

function formatDuree(s: number) {
  if (s < 60) return `${s} s`;
  const min = Math.floor(s / 60);
  const rest = s % 60;
  return rest ? `${min} min ${rest}` : `${min} min`;
}

function formatHeure(iso: string) {
  const d = new Date(iso);
  const aujourdhui = new Date();
  const memeJour = d.toDateString() === aujourdhui.toDateString();
  const hier = new Date(aujourdhui);
  hier.setDate(hier.getDate() - 1);
  const prefix = memeJour ? "Aujourd'hui" : d.toDateString() === hier.toDateString() ? "Hier" : d.toLocaleDateString("fr-BE");
  return `${prefix} · ${d.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function AppelsClient({ appels }: { appels: Appel[] }) {
  const [open, setOpen] = useState<string | null>(appels[0]?.id ?? null);

  if (appels.length === 0) {
    return <p className="rounded-xl border border-slate-200 bg-white px-5 py-6 text-sm text-slate-400">Aucun appel pour le moment.</p>;
  }

  return (
    <div className="space-y-3">
      {appels.map((a) => (
        <div key={a.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <button
            onClick={() => setOpen(open === a.id ? null : a.id)}
            className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 text-left"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-800">
                {a.patientNom} <span className="font-normal text-slate-400">· {a.numero}</span>
              </div>
            </div>
            <span className="text-xs text-slate-400">
              {formatHeure(a.debut)} · {formatDuree(a.dureeSecondes)}
            </span>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={badgeStyle(a.resultat)}>
              {STATUT_LABELS[a.resultat] ?? a.resultat}
            </span>
            <span className="text-slate-400">{open === a.id ? "▾" : "▸"}</span>
          </button>
          {open === a.id && (
            <div className="space-y-2 border-t border-slate-100 px-5 py-4" style={{ background: "#F7F9F8" }}>
              <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Transcription</div>
              {a.transcription.map((t, i) => (
                <div key={i} className={`flex ${t.qui === "Sofia" ? "" : "justify-end"}`}>
                  <div
                    className="max-w-[85%] rounded-xl px-3 py-2 text-sm"
                    style={
                      t.qui === "Sofia"
                        ? { background: "#E3F2EC", color: "#16232A" }
                        : { background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#16232A" }
                    }
                  >
                    <span className="mr-1 text-xs font-semibold" style={{ color: t.qui === "Sofia" ? "#0E5E63" : "#64748B" }}>
                      {t.qui} —
                    </span>
                    {t.texte}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
