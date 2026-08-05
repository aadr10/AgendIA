"use client";

import { useState, useTransition } from "react";
import { definirMotDePasse } from "./actions";

export default function SetPasswordPage() {
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function valider() {
    setErreur(null);
    if (motDePasse !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }
    startTransition(async () => {
      const res = await definirMotDePasse(motDePasse);
      if (res?.error) setErreur(res.error);
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Mot de passe</h1>
        <p className="mt-1 text-sm text-slate-500">Choisissez le mot de passe de votre compte.</p>

        {erreur && <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</div>}

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Mot de passe</label>
            <input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Confirmer le mot de passe</label>
            <input
              type="password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
            />
          </div>
          <button
            onClick={valider}
            disabled={isPending || !motDePasse || !confirmation}
            className="w-full rounded-lg bg-[#0E5E63] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
