"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { basculerStatutDemande } from "../actions";

type Ligne = {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  metier: string;
  metierCouleur: string;
  cabinetNom: string;
  message: string;
  statut: "nouveau" | "contacte" | "traite";
  creeLe: string;
};

const STATUT_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  nouveau: { bg: "#DCE9FB", fg: "#1D4ED8", label: "Nouveau" },
  contacte: { bg: "#FBF0DF", fg: "#8A5A16", label: "Contacté" },
  traite: { bg: "#E3F2EC", fg: "#0E5E63", label: "Traité" },
};

export default function DemandesClient({ lignes }: { lignes: Ligne[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  function changerStatut(id: string, statut: "nouveau" | "contacte" | "traite") {
    setErreur(null);
    startTransition(async () => {
      const res = await basculerStatutDemande(id, statut);
      if (res.error) setErreur(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {erreur && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{erreur}</div>}

      {lignes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-slate-400">
          Aucune demande de démo pour le moment.
        </div>
      )}

      <div className="space-y-2.5">
        {lignes.map((l) => {
          const s = STATUT_STYLE[l.statut] ?? STATUT_STYLE.nouveau;
          return (
            <div
              key={l.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              style={{ borderLeft: `4px solid ${l.metierCouleur}` }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    {l.nom}
                    {l.cabinetNom && <span className="font-normal text-slate-400"> · {l.cabinetNom}</span>}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <a href={`mailto:${l.email}`} className="hover:underline">{l.email}</a>
                    {l.telephone && <a href={`tel:${l.telephone}`} className="hover:underline">{l.telephone}</a>}
                    {l.metier && (
                      <span className="rounded-full px-2 py-0.5 font-medium" style={{ background: `${l.metierCouleur}1A`, color: l.metierCouleur }}>
                        {l.metier}
                      </span>
                    )}
                  </div>
                </div>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: s.bg, color: s.fg }}>
                  {s.label}
                </span>
              </div>

              {l.message && <p className="mt-3 text-sm text-slate-600">{l.message}</p>}

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-[11px] text-slate-400">
                  Reçue le {new Date(l.creeLe).toLocaleDateString("fr-BE")}
                </span>
                <select
                  value={l.statut}
                  onChange={(e) => changerStatut(l.id, e.target.value as "nouveau" | "contacte" | "traite")}
                  disabled={isPending}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                >
                  <option value="nouveau">Nouveau</option>
                  <option value="contacte">Contacté</option>
                  <option value="traite">Traité</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
