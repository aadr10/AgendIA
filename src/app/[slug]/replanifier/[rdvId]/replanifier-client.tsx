"use client";

import { useMemo, useState } from "react";
import { creneauxPourReplanification, confirmerReplanification } from "./actions";

function genJours() {
  const jours: { iso: string; label: string; full: string }[] = [];
  const aujourdhui = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(aujourdhui);
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    jours.push({
      iso: `${y}-${m}-${day}`,
      label: d.toLocaleDateString("fr-BE", { weekday: "short", day: "numeric" }),
      full: d.toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" }),
    });
  }
  return jours;
}

export default function ReplanifierClient({
  cabinet,
  rdvAnnule,
}: {
  cabinet: { id: string; nom: string; couleurPrimaire: string; couleurDouce: string };
  rdvAnnule: {
    id: string;
    patientId: string;
    patientNom: string;
    praticienId: string;
    praticienNom: string;
    prestationId: string;
    prestationNom: string;
    dureeMinutes: number;
    ancienDebut: string;
  };
}) {
  const jours = useMemo(genJours, []);
  const [jourISO, setJourISO] = useState<string | null>(null);
  const [heure, setHeure] = useState<string | null>(null);
  const [slots, setSlots] = useState<{ heure: string }[]>([]);
  const [chargement, setChargement] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirme, setConfirme] = useState(false);

  const ancienneDate = new Date(rdvAnnule.ancienDebut);

  async function choisirJour(iso: string) {
    setJourISO(iso);
    setHeure(null);
    setChargement(true);
    const res = await creneauxPourReplanification({
      cabinetId: cabinet.id,
      prestationId: rdvAnnule.prestationId,
      praticienId: rdvAnnule.praticienId,
      jourISO: iso,
      dureeMinutes: rdvAnnule.dureeMinutes,
    });
    setSlots(res);
    setChargement(false);
  }

  async function confirmer() {
    if (!jourISO || !heure) return;
    setEnvoi(true);
    setErreur(null);
    const res = await confirmerReplanification({
      rdvAnnuleId: rdvAnnule.id,
      cabinetId: cabinet.id,
      patientId: rdvAnnule.patientId,
      praticienId: rdvAnnule.praticienId,
      prestationId: rdvAnnule.prestationId,
      dureeMinutes: rdvAnnule.dureeMinutes,
      jourISO,
      heure,
    });
    setEnvoi(false);
    if (res.error) setErreur(res.error);
    else setConfirme(true);
  }

  const jourChoisi = jours.find((j) => j.iso === jourISO);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10" style={{ fontFamily: "system-ui, sans-serif" }}>
      <div className="mx-auto max-w-lg">
        <div className="mb-5 text-center">
          <div
            className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold text-white"
            style={{ background: cabinet.couleurPrimaire }}
          >
            {cabinet.nom.trim().charAt(0)}
          </div>
          <div className="text-lg font-semibold">{cabinet.nom}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          {confirme ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3xl" style={{ background: cabinet.couleurDouce }}>
                ✓
              </div>
              <h2 className="text-xl font-semibold">C&apos;est confirmé !</h2>
              <p className="mt-2 text-sm text-slate-600">
                {rdvAnnule.prestationNom}
                <br />
                {jourChoisi?.full} à {heure} · {rdvAnnule.praticienNom}
              </p>
              <p className="mt-4 text-xs text-slate-400">Un email de confirmation vous a été envoyé.</p>
            </div>
          ) : (
            <>
              <h1 className="mb-1 text-lg font-semibold">Choisir un nouveau créneau</h1>
              <p className="mb-4 text-sm text-slate-500">
                Bonjour {rdvAnnule.patientNom.split(" ")[0]}, votre rendez-vous{" "}
                <strong>{rdvAnnule.prestationNom}</strong> du{" "}
                {ancienneDate.toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" })} à{" "}
                {ancienneDate.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" })} a été annulé.
                Choisissez un nouveau créneau avec {rdvAnnule.praticienNom} :
              </p>

              {erreur && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{erreur}</div>}

              <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                {jours.map((j) => (
                  <button
                    key={j.iso}
                    onClick={() => choisirJour(j.iso)}
                    className="flex-shrink-0 rounded-xl border px-4 py-2 text-sm font-medium"
                    style={
                      jourISO === j.iso
                        ? { background: cabinet.couleurPrimaire, color: "#fff", borderColor: cabinet.couleurPrimaire }
                        : { borderColor: "#E2E8F0", color: "#475569" }
                    }
                  >
                    {j.label}
                  </button>
                ))}
              </div>

              {!jourISO && <p className="text-sm text-slate-400">Choisissez d&apos;abord un jour.</p>}
              {jourISO && chargement && <p className="text-sm text-slate-400">Recherche des créneaux…</p>}
              {jourISO && !chargement && slots.length === 0 && (
                <p className="text-sm text-slate-400">Aucun créneau libre ce jour-là. Essayez un autre jour.</p>
              )}
              {jourISO && !chargement && slots.length > 0 && (
                <div className="mb-4 grid grid-cols-4 gap-2">
                  {slots.map((s) => (
                    <button
                      key={s.heure}
                      onClick={() => setHeure(s.heure)}
                      className="rounded-lg border py-2 text-sm"
                      style={heure === s.heure ? { borderColor: cabinet.couleurPrimaire, background: cabinet.couleurDouce } : { borderColor: "#E2E8F0" }}
                    >
                      {s.heure}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={confirmer}
                disabled={!heure || envoi}
                className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: cabinet.couleurPrimaire }}
              >
                {envoi ? "Confirmation…" : "Confirmer ce créneau"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
