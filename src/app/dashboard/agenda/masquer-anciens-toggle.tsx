"use client";

import { useState, useTransition } from "react";
import { toggleMasquerRdvAnciens } from "./actions";

export default function MasquerAnciensToggle({ actif }: { actif: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  function basculer() {
    setErreur(null);
    startTransition(async () => {
      const res = await toggleMasquerRdvAnciens(!actif);
      if (res?.error) setErreur(res.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-500">
      <label className="flex cursor-pointer items-center gap-2">
        <input type="checkbox" checked={actif} disabled={isPending} onChange={basculer} className="h-4 w-4 rounded" />
        <span>Masquer les rendez-vous des mois précédents</span>
      </label>
      <span className="text-slate-400">
        — rien n&apos;est supprimé, juste caché de l&apos;agenda. Décochez à tout moment pour tout revoir.
      </span>
      {erreur && <span className="text-red-600">{erreur}</span>}
    </div>
  );
}
