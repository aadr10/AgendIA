"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviterMembre, revoquerAcces } from "./actions";

type Membre = { id: string; email: string; role: string; cree_le: string };

export default function EquipeClient({
  membres,
  monId,
  couleurPrimaire,
}: {
  membres: Membre[];
  monId: string;
  couleurPrimaire: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "praticien">("praticien");

  function inviter() {
    setErreur(null);
    setSucces(null);
    startTransition(async () => {
      const res = await inviterMembre({ email, role });
      if (res.error) setErreur(res.error);
      else {
        setSucces(`Invitation envoyée à ${email}.`);
        setEmail("");
        router.refresh();
      }
    });
  }

  function revoquer(id: string) {
    setErreur(null);
    startTransition(async () => {
      const res = await revoquerAcces(id);
      if (res.error) setErreur(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {erreur && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{erreur}</div>}
      {succes && <div className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{succes}</div>}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-1 font-medium text-slate-800">Inviter un membre</div>
        <p className="mb-4 text-xs text-slate-500">
          Il recevra un email pour créer son propre mot de passe et se connecter à cette interface.
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            placeholder="email@exemple.be"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-w-56 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "praticien")}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="praticien">Praticien</option>
            <option value="admin">Administrateur</option>
          </select>
          <button
            onClick={inviter}
            disabled={isPending || !email.trim()}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            style={{ background: couleurPrimaire }}
          >
            Inviter
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Rôle</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {membres.map((m) => (
              <tr key={m.id}>
                <td className="px-5 py-3 font-medium text-slate-800">
                  {m.email} {m.id === monId && <span className="text-xs font-normal text-slate-400">(vous)</span>}
                </td>
                <td className="px-5 py-3 capitalize text-slate-600">{m.role}</td>
                <td className="px-5 py-3 text-right">
                  {m.id !== monId && (
                    <button onClick={() => revoquer(m.id)} disabled={isPending} className="text-xs text-slate-400 hover:text-red-600">
                      Révoquer l&apos;accès
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
