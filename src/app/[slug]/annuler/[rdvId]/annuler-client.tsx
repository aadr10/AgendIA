"use client";

import { useState, useTransition } from "react";
import { annulerRdvPatient } from "./actions";

export default function AnnulerClient({
  cabinet,
  rdv,
}: {
  cabinet: { id: string; slug: string; nom: string; couleurPrimaire: string };
  rdv: { id: string; debut: string; statut: string; prestationNom: string; praticienNom: string };
}) {
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [annule, setAnnule] = useState(rdv.statut === "annule");

  const dateHeure = new Date(rdv.debut).toLocaleString("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  function confirmerAnnulation() {
    setErreur(null);
    startTransition(async () => {
      const res = await annulerRdvPatient(cabinet.id, rdv.id);
      if (res.error) setErreur(res.error);
      else setAnnule(true);
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 text-center">
        <div className="mb-3 text-lg font-semibold text-slate-800">{cabinet.nom}</div>

        {annule ? (
          <>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#E3F2EC] text-xl">✓</div>
            <p className="text-sm text-slate-600">Votre rendez-vous a bien été annulé.</p>
            <a href={`/${cabinet.slug}`} className="mt-4 inline-block text-sm font-medium underline" style={{ color: cabinet.couleurPrimaire }}>
              Réserver un nouveau créneau
            </a>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-600">
              Vous avez rendez-vous pour <strong>{rdv.prestationNom}</strong>
              <br />
              {dateHeure}{rdv.praticienNom ? ` · ${rdv.praticienNom}` : ""}
            </p>
            {erreur && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{erreur}</div>}
            <button
              onClick={confirmerAnnulation}
              disabled={isPending}
              className="mt-5 w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: "#9C3325" }}
            >
              {isPending ? "Annulation…" : "Annuler ce rendez-vous"}
            </button>
            <a href={`/${cabinet.slug}`} className="mt-3 inline-block text-xs text-slate-400 underline">
              Retour au site
            </a>
          </>
        )}
      </div>
    </div>
  );
}
