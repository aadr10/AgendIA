"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { retirerListeAttente } from "./actions";

type Ligne = {
  id: string;
  patientNom: string;
  patientTelephone: string;
  prestationNom: string;
  praticienNom: string | null;
  disponibilitesSouhaitees: string;
  creeLe: string;
};

export default function ListeAttenteClient({ lignes, couleurPrimaire }: { lignes: Ligne[]; couleurPrimaire: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  function retirer(id: string) {
    setErreur(null);
    startTransition(async () => {
      const res = await retirerListeAttente(id);
      if (res.error) setErreur(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {erreur && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{erreur}</div>}

      <p className="text-sm text-slate-500">
        Patients inscrits automatiquement quand aucun créneau ne leur convenait (par téléphone ou chat).
        Appelez-les dès qu&apos;une place se libère, puis retirez-les de la liste.
      </p>

      {lignes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-slate-400">
          Personne en liste d&apos;attente pour le moment.
        </div>
      )}

      <div className="space-y-2.5">
        {lignes.map((l) => (
          <div key={l.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-800">{l.patientNom}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  {l.patientTelephone && (
                    <a href={`tel:${l.patientTelephone}`} className="font-medium hover:underline" style={{ color: couleurPrimaire }}>
                      📞 {l.patientTelephone}
                    </a>
                  )}
                  <span>{l.prestationNom}</span>
                  {l.praticienNom && <span>avec {l.praticienNom}</span>}
                </div>
              </div>
              <span className="text-[11px] text-slate-400">
                Depuis le {new Date(l.creeLe).toLocaleDateString("fr-BE")}
              </span>
            </div>

            {l.disponibilitesSouhaitees && (
              <p className="mt-2 text-xs italic text-slate-500">« {l.disponibilitesSouhaitees} »</p>
            )}

            <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
              <button
                onClick={() => retirer(l.id)}
                disabled={isPending}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 disabled:opacity-40"
              >
                Retirer de la liste
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
