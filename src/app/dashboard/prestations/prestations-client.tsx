"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ajouterPrestation, desactiverPrestation } from "./actions";

type Prestation = {
  id: string;
  nom: string;
  dureeMinutes: number;
  prix: number;
  praticiens: string[];
};

export default function PrestationsClient({ prestations, couleurPrimaire }: { prestations: Prestation[]; couleurPrimaire: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [ajout, setAjout] = useState<{ nom: string; duree: string; prix: string } | null>(null);

  function creer() {
    if (!ajout?.nom.trim()) return;
    setErreur(null);
    startTransition(async () => {
      const res = await ajouterPrestation({
        nom: ajout.nom.trim(),
        dureeMinutes: Number(ajout.duree) || 30,
        prix: Number(ajout.prix) || 0,
      });
      if (res.error) setErreur(res.error);
      else {
        setAjout(null);
        router.refresh();
      }
    });
  }

  function desactiver(id: string) {
    setErreur(null);
    startTransition(async () => {
      const res = await desactiverPrestation(id);
      if (res.error) setErreur(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {erreur && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{erreur}</div>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3 font-medium">Prestation</th>
              <th className="px-5 py-3 font-medium">Durée</th>
              <th className="px-5 py-3 font-medium">Prix</th>
              <th className="px-5 py-3 font-medium">Praticiens</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {prestations.map((p) => (
              <tr key={p.id}>
                <td className="px-5 py-3 font-medium text-slate-800">{p.nom}</td>
                <td className="px-5 py-3 text-slate-600">{p.dureeMinutes} min</td>
                <td className="px-5 py-3 text-slate-600">{p.prix.toFixed(2)} €</td>
                <td className="px-5 py-3 text-slate-600">{p.praticiens.join(", ") || "—"}</td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => desactiver(p.id)} disabled={isPending} className="text-xs text-slate-400 hover:text-red-600">
                    Désactiver
                  </button>
                </td>
              </tr>
            ))}
            {prestations.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-slate-400">
                  Aucune prestation active.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {ajout ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 p-5">
          <div className="flex flex-wrap gap-2">
            <input
              placeholder="Nom de la prestation"
              value={ajout.nom}
              onChange={(e) => setAjout({ ...ajout, nom: e.target.value })}
              className="min-w-48 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              autoFocus
            />
            <input
              placeholder="Durée (min)"
              type="number"
              value={ajout.duree}
              onChange={(e) => setAjout({ ...ajout, duree: e.target.value })}
              className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              placeholder="Prix (€)"
              type="number"
              value={ajout.prix}
              onChange={(e) => setAjout({ ...ajout, prix: e.target.value })}
              className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={creer}
              disabled={isPending || !ajout.nom.trim()}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              style={{ background: couleurPrimaire }}
            >
              Ajouter
            </button>
            <button onClick={() => setAjout(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600">
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAjout({ nom: "", duree: "30", prix: "" })}
          className="rounded-lg border-2 border-dashed border-slate-200 px-4 py-2 text-sm text-slate-400 hover:border-slate-300"
        >
          + Ajouter une prestation
        </button>
      )}
    </div>
  );
}
