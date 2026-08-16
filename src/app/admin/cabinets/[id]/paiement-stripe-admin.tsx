"use client";

import { useState, useTransition } from "react";
import { genererLienPaiementCabinetExistant } from "../../actions";

export default function PaiementStripeAdmin({
  cabinetId,
  aDejaUnAbonnement,
  statutAbonnement,
}: {
  cabinetId: string;
  aDejaUnAbonnement: boolean;
  statutAbonnement: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [lien, setLien] = useState<string | null>(null);
  const [copie, setCopie] = useState(false);

  function generer() {
    setErreur(null);
    startTransition(async () => {
      const res = await genererLienPaiementCabinetExistant(cabinetId);
      if (res.error) setErreur(res.error);
      else setLien(res.lienPaiement ?? null);
    });
  }

  function copier() {
    if (!lien) return;
    navigator.clipboard.writeText(lien);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  }

  if (aDejaUnAbonnement) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
        <div className="font-medium text-slate-800">Paiement Stripe</div>
        <p className="mt-1 text-slate-500">
          Abonnement Stripe actif pour ce cabinet — statut : <span className="font-medium">{statutAbonnement}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
      <div className="font-medium text-slate-800">Paiement Stripe</div>
      <p className="mt-1 mb-3 text-slate-500">
        Ce cabinet n&apos;a pas encore de lien de paiement — génère-le quand tu es prête à le partager au client.
      </p>
      {erreur && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{erreur}</div>}
      {lien ? (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-3">
          <span className="break-all text-xs">{lien}</span>
          <button
            onClick={copier}
            className="flex-shrink-0 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
          >
            {copie ? "Copié !" : "Copier"}
          </button>
        </div>
      ) : (
        <button
          onClick={generer}
          disabled={isPending}
          className="rounded-lg bg-[#0E5E63] px-4 py-2 text-xs font-medium text-white disabled:opacity-40"
        >
          {isPending ? "Génération…" : "Générer le lien de paiement Stripe"}
        </button>
      )}
    </div>
  );
}
