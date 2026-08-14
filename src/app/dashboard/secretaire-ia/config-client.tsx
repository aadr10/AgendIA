"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Toggle } from "@/components/ui";
import { majIdentite, majRegles, ajouterFaq, supprimerFaq } from "./actions";

type Faq = { id: string; question: string; reponse: string };

export default function ConfigClient({
  cabinet,
  regles,
  faqInitiale,
  couleurPrimaire,
}: {
  cabinet: { iaPrenom: string; iaTon: string; iaMessageAccueil: string };
  regles: {
    delaiMinReservationHeures: number;
    delaiAnnulationHeures: number;
    accepteNouveauxPatients: boolean;
    confirmationAuto: boolean;
  };
  faqInitiale: Faq[];
  couleurPrimaire: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const [prenom, setPrenom] = useState(cabinet.iaPrenom);
  const [ton, setTon] = useState(cabinet.iaTon);
  const [accueil, setAccueil] = useState(cabinet.iaMessageAccueil);

  const [r, setR] = useState(regles);

  const [newQ, setNewQ] = useState("");
  const [newR, setNewR] = useState("");

  function saveIdentite() {
    setErreur(null);
    startTransition(async () => {
      const res = await majIdentite({ iaPrenom: prenom, iaTon: ton, iaMessageAccueil: accueil });
      if (res.error) setErreur(res.error);
      else {
        setSavedMsg("Identité enregistrée.");
        router.refresh();
      }
    });
  }

  function saveRegle(next: typeof r) {
    setR(next);
    setErreur(null);
    startTransition(async () => {
      const res = await majRegles(next);
      if (res.error) setErreur(res.error);
      else router.refresh();
    });
  }

  function addFaq() {
    if (!newQ.trim() || !newR.trim()) return;
    setErreur(null);
    startTransition(async () => {
      const res = await ajouterFaq({ question: newQ.trim(), reponse: newR.trim() });
      if (res.error) setErreur(res.error);
      else {
        setNewQ("");
        setNewR("");
        router.refresh();
      }
    });
  }

  function removeFaq(id: string) {
    startTransition(async () => {
      const res = await supprimerFaq(id);
      if (res.error) setErreur(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {erreur && (
        <div className="lg:col-span-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{erreur}</div>
      )}

      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 font-medium text-slate-800">Identité de votre secrétaire</div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Prénom</label>
          <input
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            className="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <label className="mb-1 block text-xs font-medium text-slate-500">Ton</label>
          <select
            value={ton}
            onChange={(e) => setTon(e.target.value)}
            className="mb-4 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="chaleureux-pro">Chaleureux et professionnel</option>
            <option value="formel">Formel</option>
            <option value="decontracte">Décontracté</option>
          </select>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Message d&apos;accueil (téléphone et chat)
          </label>
          <textarea
            value={accueil}
            onChange={(e) => setAccueil(e.target.value)}
            rows={3}
            className="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            onClick={saveIdentite}
            disabled={isPending}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            style={{ background: couleurPrimaire }}
          >
            Enregistrer
          </button>
          {savedMsg && <span className="ml-3 text-xs text-slate-400">{savedMsg}</span>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-800">Délai minimum de réservation</div>
              <div className="text-xs text-slate-500">{prenom} ne propose jamais un créneau avant ce délai</div>
            </div>
            <input
              type="number"
              min={0}
              value={r.delaiMinReservationHeures}
              onChange={(e) => saveRegle({ ...r, delaiMinReservationHeures: +e.target.value })}
              className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm"
            />
            <span className="text-xs text-slate-400">h</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-800">Délai d&apos;annulation gratuite</div>
              <div className="text-xs text-slate-500">Au-delà, l&apos;annulation est signalée au patient</div>
            </div>
            <input
              type="number"
              min={0}
              value={r.delaiAnnulationHeures}
              onChange={(e) => saveRegle({ ...r, delaiAnnulationHeures: +e.target.value })}
              className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm"
            />
            <span className="text-xs text-slate-400">h</span>
          </div>
          <Toggle
            label="Accepter les nouveaux patients"
            desc={`${prenom} peut créer des fiches pour des patients inconnus`}
            on={r.accepteNouveauxPatients}
            onChange={() => saveRegle({ ...r, accepteNouveauxPatients: !r.accepteNouveauxPatients })}
            onColor={couleurPrimaire}
          />
          <Toggle
            label="Confirmation automatique"
            desc="Les RDV pris par téléphone ou en ligne sont confirmés sans validation manuelle"
            on={r.confirmationAuto}
            onChange={() => saveRegle({ ...r, confirmationAuto: !r.confirmationAuto })}
            onColor={couleurPrimaire}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-1 font-medium text-slate-800">Questions fréquentes</div>
        <p className="mb-4 text-xs text-slate-500">{prenom} utilise ces réponses au téléphone et sur le chat du site.</p>
        <ul className="mb-4 space-y-2">
          {faqInitiale.map((q) => (
            <li
              key={q.id}
              className="flex items-start justify-between gap-3 rounded-lg px-3 py-2 text-sm text-slate-700"
              style={{ background: "#F7F9F8" }}
            >
              <span>
                <span className="font-medium">{q.question}</span> → {q.reponse}
              </span>
              <button onClick={() => removeFaq(q.id)} className="text-xs text-slate-400 hover:text-red-600">
                ✕
              </button>
            </li>
          ))}
          {faqInitiale.length === 0 && <li className="text-sm text-slate-400">Aucune question pour le moment.</li>}
        </ul>
        <div className="space-y-2">
          <input
            value={newQ}
            onChange={(e) => setNewQ(e.target.value)}
            placeholder="Question"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={newR}
            onChange={(e) => setNewR(e.target.value)}
            placeholder="Réponse"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            onClick={addFaq}
            disabled={isPending || !newQ.trim() || !newR.trim()}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            style={{ background: couleurPrimaire }}
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}
