"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ajouterPraticien, renommerPraticien, desactiverPraticien } from "./actions";

type Praticien = {
  id: string;
  nom: string;
  role: string;
  couleurAgenda: string;
  horaires: string[];
};

function initiales(nom: string) {
  return nom.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

export default function PraticiensClient({ praticiens }: { praticiens: Praticien[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [ajout, setAjout] = useState<{ nom: string; role: string } | null>(null);
  const [renomme, setRenomme] = useState<{ id: string; nom: string } | null>(null);

  function creer() {
    if (!ajout?.nom.trim()) return;
    setErreur(null);
    startTransition(async () => {
      const res = await ajouterPraticien({ nom: ajout.nom.trim(), role: ajout.role.trim() || "Praticien" });
      if (res.error) setErreur(res.error);
      else {
        setAjout(null);
        router.refresh();
      }
    });
  }

  function renommer() {
    if (!renomme?.nom.trim()) return;
    setErreur(null);
    startTransition(async () => {
      const res = await renommerPraticien(renomme.id, renomme.nom.trim());
      if (res.error) setErreur(res.error);
      else {
        setRenomme(null);
        router.refresh();
      }
    });
  }

  function desactiver(id: string) {
    setErreur(null);
    startTransition(async () => {
      const res = await desactiverPraticien(id);
      if (res.error) setErreur(res.error);
      else router.refresh();
    });
  }

  return (
    <div>
      {erreur && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{erreur}</div>}
      <div className="grid gap-4 sm:grid-cols-2">
        {praticiens.map((p) => (
          <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ background: p.couleurAgenda }}
              >
                {initiales(p.nom)}
              </span>
              <div className="flex-1">
                {renomme?.id === p.id ? (
                  <div className="flex gap-2">
                    <input
                      value={renomme.nom}
                      onChange={(e) => setRenomme({ id: p.id, nom: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                      autoFocus
                    />
                    <button onClick={renommer} disabled={isPending} className="text-xs font-medium" style={{ color: "#0E5E63" }}>
                      OK
                    </button>
                  </div>
                ) : (
                  <div className="font-medium text-slate-800">{p.nom}</div>
                )}
                <div className="text-xs text-slate-500">{p.role}</div>
              </div>
            </div>
            <div className="mt-4 space-y-0.5 text-sm text-slate-600">
              {p.horaires.length > 0 ? p.horaires.map((h) => <div key={h}>{h}</div>) : <div className="text-slate-400">Horaires non définis</div>}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Couleur agenda : <span className="ml-1 inline-block h-3 w-3 rounded-sm align-middle" style={{ background: p.couleurAgenda }} />
              </div>
              <div className="flex gap-3 text-xs">
                {renomme?.id !== p.id && (
                  <button onClick={() => setRenomme({ id: p.id, nom: p.nom })} className="text-slate-500 hover:text-slate-800">
                    Renommer
                  </button>
                )}
                <button onClick={() => desactiver(p.id)} disabled={isPending} className="text-slate-500 hover:text-red-600">
                  Désactiver
                </button>
              </div>
            </div>
          </div>
        ))}

        {ajout ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 p-5">
            <input
              placeholder="Nom complet"
              value={ajout.nom}
              onChange={(e) => setAjout({ ...ajout, nom: e.target.value })}
              className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              autoFocus
            />
            <input
              placeholder="Rôle (ex : Kinésithérapeute)"
              value={ajout.role}
              onChange={(e) => setAjout({ ...ajout, role: e.target.value })}
              className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={creer}
                disabled={isPending || !ajout.nom.trim()}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                style={{ background: "#0E5E63" }}
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
            onClick={() => setAjout({ nom: "", role: "" })}
            className="flex min-h-32 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400 hover:border-slate-300"
          >
            + Ajouter un praticien
          </button>
        )}
      </div>
    </div>
  );
}
