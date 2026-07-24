"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { basculerStatutCabinet } from "./actions";

type Ligne = {
  id: string;
  slug: string;
  nom: string;
  metier: string;
  ville: string;
  offre: string;
  statut: string;
  creeLe: string;
};

const STATUT_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  essai: { bg: "#FBF0DF", fg: "#8A5A16", label: "Essai" },
  actif: { bg: "#E3F2EC", fg: "#0E5E63", label: "Actif" },
  suspendu: { bg: "#FBE7E4", fg: "#9C3325", label: "Suspendu" },
};

export default function AdminCabinetsClient({ lignes }: { lignes: Ligne[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  function changerStatut(id: string, statut: "essai" | "actif" | "suspendu") {
    setErreur(null);
    startTransition(async () => {
      const res = await basculerStatutCabinet(id, statut);
      if (res.error) setErreur(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {erreur && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{erreur}</div>}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3 font-medium">Cabinet</th>
              <th className="px-5 py-3 font-medium">Métier</th>
              <th className="px-5 py-3 font-medium">Ville</th>
              <th className="px-5 py-3 font-medium">Offre</th>
              <th className="px-5 py-3 font-medium">Statut</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lignes.map((l) => {
              const s = STATUT_STYLE[l.statut] ?? STATUT_STYLE.essai;
              return (
                <tr key={l.id}>
                  <td className="px-5 py-3 font-medium text-slate-800">
                    <a href={`/${l.slug}`} target="_blank" rel="noreferrer" className="hover:underline">
                      {l.nom}
                    </a>
                    <div className="text-xs font-normal text-slate-400">/{l.slug}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{l.metier}</td>
                  <td className="px-5 py-3 text-slate-600">{l.ville}</td>
                  <td className="px-5 py-3 text-slate-600">{l.offre}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: s.bg, color: s.fg }}>
                      {s.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <select
                      value={l.statut}
                      onChange={(e) => changerStatut(l.id, e.target.value as "essai" | "actif" | "suspendu")}
                      disabled={isPending}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                    >
                      <option value="essai">Essai</option>
                      <option value="actif">Actif</option>
                      <option value="suspendu">Suspendu</option>
                    </select>
                  </td>
                </tr>
              );
            })}
            {lignes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                  Aucun cabinet pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
