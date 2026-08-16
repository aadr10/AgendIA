"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { basculerStatutCabinet } from "./actions";
import { OFFRE_BADGE, type Offre } from "@/lib/offres";

type Ligne = {
  id: string;
  slug: string;
  nom: string;
  metier: string;
  metierCouleur: string;
  ville: string;
  offre: Offre;
  statut: string;
  creeLe: string;
};

const STATUT_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  essai: { bg: "#FBF0DF", fg: "#8A5A16", label: "Essai" },
  actif: { bg: "#E3F2EC", fg: "#0E5E63", label: "Actif" },
  suspendu: { bg: "#FBE7E4", fg: "#9C3325", label: "Suspendu" },
  impaye: { bg: "#FBE7E4", fg: "#9C3325", label: "⚠ Impayé" },
};

export default function AdminCabinetsClient({ lignes }: { lignes: Ligne[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  function changerStatut(id: string, statut: "essai" | "actif" | "suspendu" | "impaye") {
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

      {lignes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-slate-400">
          Aucun cabinet pour le moment.
        </div>
      )}

      <div className="space-y-2.5">
        {lignes.map((l) => {
          const s = STATUT_STYLE[l.statut] ?? STATUT_STYLE.essai;
          return (
            <div
              key={l.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:shadow-md sm:flex-nowrap"
              style={{ borderLeft: `4px solid ${l.metierCouleur}` }}
            >
              <div className="min-w-[10rem] flex-1">
                <a href={`/admin/cabinets/${l.id}`} className="truncate text-sm font-semibold text-slate-800 hover:underline">
                  {l.nom}
                </a>
                <div className="truncate text-xs text-slate-400">
                  <a href={`/${l.slug}`} className="hover:underline">/{l.slug}</a>
                  {l.ville ? ` · ${l.ville}` : ""}
                </div>
              </div>

              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ background: `${l.metierCouleur}1A`, color: l.metierCouleur }}
              >
                {l.metier}
              </span>

              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: OFFRE_BADGE[l.offre].bg, color: OFFRE_BADGE[l.offre].fg }}>
                {OFFRE_BADGE[l.offre].label}
              </span>

              <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: s.bg, color: s.fg }}>
                {s.label}
              </span>

              <span className="hidden text-[11px] text-slate-400 md:block">
                Créé le {new Date(l.creeLe).toLocaleDateString("fr-BE")}
              </span>

              <select
                value={l.statut}
                onChange={(e) => changerStatut(l.id, e.target.value as "essai" | "actif" | "suspendu" | "impaye")}
                disabled={isPending}
                className="ml-auto rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
              >
                <option value="essai">Essai</option>
                <option value="actif">Actif</option>
                <option value="impaye">Impayé</option>
                <option value="suspendu">Suspendu</option>
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
