"use client";

import { useState, useTransition } from "react";
import { creerDemandeDemo } from "./actions";
import { METIERS } from "@/lib/metiers";

const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm";

export default function DemandeDemoForm() {
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState(false);

  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [metier, setMetier] = useState("");
  const [cabinetNom, setCabinetNom] = useState("");
  const [message, setMessage] = useState("");

  function envoyer() {
    setErreur(null);
    startTransition(async () => {
      const res = await creerDemandeDemo({ nom, email, telephone, metier, cabinetNom, message });
      if (res.error) setErreur(res.error);
      else setEnvoye(true);
    });
  }

  if (envoye) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#E3F2EC] text-2xl">✓</div>
        <h3 className="text-lg font-semibold text-slate-900">Demande envoyée !</h3>
        <p className="mt-2 text-sm text-slate-600">Je te recontacte très vite pour organiser une démo.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <h3 className="mb-1 text-lg font-semibold text-slate-900">Demander une démo gratuite</h3>
      <p className="mb-5 text-sm text-slate-500">Je te recontacte pour te montrer AgendIA en direct, sans engagement.</p>

      {erreur && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</div>}

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input placeholder="Ton nom" value={nom} onChange={(e) => setNom(e.target.value)} className={inputCls} />
          <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input placeholder="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} className={inputCls} />
          <select value={metier} onChange={(e) => setMetier(e.target.value)} className={inputCls}>
            <option value="">Ton métier</option>
            {Object.entries(METIERS).map(([cle, config]) => (
              <option key={cle} value={cle}>{config.label}</option>
            ))}
          </select>
        </div>
        <input placeholder="Nom de ton cabinet (facultatif)" value={cabinetNom} onChange={(e) => setCabinetNom(e.target.value)} className={inputCls} />
        <textarea
          placeholder="Un mot sur ta situation actuelle (facultatif)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={inputCls}
          rows={3}
        />
      </div>

      <button
        onClick={envoyer}
        disabled={isPending || !nom.trim() || !email.trim()}
        className="mt-5 w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-40"
        style={{ background: "#0E5E63" }}
      >
        {isPending ? "Envoi…" : "Demander ma démo gratuite"}
      </button>
    </div>
  );
}
