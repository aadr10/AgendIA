"use client";

import { useMemo, useState } from "react";
import { creneauxPourJour, reserverRdv } from "./actions";
import ChatWidget from "./chat-widget";

type Cabinet = {
  id: string;
  slug: string;
  nom: string;
  metier: string;
  ville: string;
  adresse: string;
  telephoneAffiche: string;
  horairesTexte: string;
  iaPrenom: string;
  couleurPrimaire: string;
  couleurDouce: string;
  photoHeroUrl: string | null;
};
type Prestation = { id: string; nom: string; duree_minutes: number; prix: number };
type Praticien = { id: string; nom: string; couleur_agenda: string };
type Liaison = { praticien_id: string; prestation_id: string };

function initiales(nom: string) {
  return nom.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

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

export default function SitePatientClient({
  cabinet,
  prestations,
  praticiens,
  liaisons,
}: {
  cabinet: Cabinet;
  prestations: Prestation[];
  praticiens: Praticien[];
  liaisons: Liaison[];
}) {
  const t = {
    primary: cabinet.couleurPrimaire,
    soft: cabinet.couleurDouce,
    dark: "#16232A",
  };

  const jours = useMemo(genJours, []);

  const [booking, setBooking] = useState(false);
  const [step, setStep] = useState(0);
  const [prestationId, setPrestationId] = useState<string | null>(null);
  const [praticienChoice, setPraticienChoice] = useState<string | null>(null); // id ou "sans_preference"
  const [jourISO, setJourISO] = useState<string | null>(null);
  const [heure, setHeure] = useState<string | null>(null);
  const [praticienAssigne, setPraticienAssigne] = useState<string | null>(null);
  const [slots, setSlots] = useState<{ heure: string; praticienId: string }[]>([]);
  const [chargementSlots, setChargementSlots] = useState(false);
  const [nom, setNom] = useState("");
  const [tel, setTel] = useState("");
  const [email, setEmail] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const prestation = prestations.find((p) => p.id === prestationId) ?? null;

  const praticiensPourPrestation = prestationId
    ? praticiens.filter((p) => liaisons.some((l) => l.prestation_id === prestationId && l.praticien_id === p.id))
    : [];

  const praticienAssigneNom = praticiens.find((p) => p.id === praticienAssigne)?.nom ?? "";

  function resetBooking() {
    setBooking(false);
    setStep(0);
    setPrestationId(null);
    setPraticienChoice(null);
    setJourISO(null);
    setHeure(null);
    setPraticienAssigne(null);
    setSlots([]);
    setNom("");
    setTel("");
    setEmail("");
    setErreur(null);
  }

  function choisirPrestation(id: string) {
    setPrestationId(id);
    setStep(1);
  }

  function choisirPraticien(choice: string) {
    setPraticienChoice(choice);
    setStep(2);
  }

  async function choisirJour(iso: string) {
    setJourISO(iso);
    setHeure(null);
    setSlots([]);
    if (!prestation) return;
    setChargementSlots(true);
    const res = await creneauxPourJour({
      cabinetId: cabinet.id,
      prestationId: prestation.id,
      praticienId: praticienChoice === "sans_preference" ? null : praticienChoice,
      jourISO: iso,
      dureeMinutes: prestation.duree_minutes,
    });
    setSlots(res);
    setChargementSlots(false);
  }

  function choisirHeure(s: { heure: string; praticienId: string }) {
    setHeure(s.heure);
    setPraticienAssigne(s.praticienId);
    setStep(3);
  }

  async function confirmer() {
    if (!prestation || !jourISO || !heure || !praticienAssigne) return;
    setErreur(null);
    setEnvoi(true);
    const res = await reserverRdv({
      cabinetId: cabinet.id,
      prestationId: prestation.id,
      praticienId: praticienAssigne,
      dureeMinutes: prestation.duree_minutes,
      jourISO,
      heure,
      nom,
      telephone: tel,
      email,
    });
    setEnvoi(false);
    if (res.error) setErreur(res.error);
    else setStep(4);
  }

  const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm";
  const canConfirm = nom.trim() && tel.trim() && email.trim();
  const jourChoisi = jours.find((j) => j.iso === jourISO);

  return (
    <div className="min-h-screen" style={{ background: "#F7F9F8", color: t.dark, fontFamily: "system-ui, sans-serif" }}>
      <div className="mx-auto max-w-4xl px-4 pb-24">
        <header className="flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold text-white"
              style={{ background: t.primary }}
            >
              {cabinet.nom.trim().charAt(0) || "?"}
            </span>
            <div>
              <div className="text-lg font-semibold leading-tight">{cabinet.nom}</div>
              <div className="text-xs text-slate-500">
                {cabinet.metier} · {cabinet.ville}
              </div>
            </div>
          </div>
          {cabinet.telephoneAffiche && (
            <a className="hidden text-sm font-medium sm:block" style={{ color: t.primary }} href={`tel:${cabinet.telephoneAffiche}`}>
              {cabinet.telephoneAffiche}
            </a>
          )}
        </header>

        {!booking ? (
          <>
            <section
              className="relative overflow-hidden rounded-2xl px-6 py-10 text-center sm:py-16"
              style={
                cabinet.photoHeroUrl
                  ? {
                      backgroundImage: `linear-gradient(rgba(12,16,15,0.45), rgba(12,16,15,0.6)), url(${cabinet.photoHeroUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : { background: t.soft }
              }
            >
              <div
                className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium"
                style={{ color: t.primary }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute h-full w-full animate-ping rounded-full opacity-60" style={{ background: t.primary }} />
                  <span className="relative h-2 w-2 rounded-full" style={{ background: t.primary }} />
                </span>
                {cabinet.iaPrenom} répond au téléphone 24h/24
              </div>
              <h1
                className="mx-auto max-w-xl text-3xl font-bold leading-tight sm:text-4xl"
                style={{
                  color: cabinet.photoHeroUrl ? "#FFFFFF" : t.dark,
                  textShadow: cabinet.photoHeroUrl ? "0 2px 16px rgba(0,0,0,0.4)" : "none",
                }}
              >
                Réservez votre séance en 30 secondes
              </h1>
              <p
                className="mx-auto mt-3 max-w-md text-sm"
                style={{ color: cabinet.photoHeroUrl ? "rgba(255,255,255,0.92)" : "#475569" }}
              >
                Choisissez votre créneau en ligne, ou appelez à n&apos;importe quelle heure : {cabinet.iaPrenom}, notre
                secrétaire, décroche toujours.
              </p>
              <button
                onClick={() => setBooking(true)}
                className="mt-6 rounded-xl px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-transform hover:scale-105"
                style={{ background: t.primary }}
              >
                Réserver un rendez-vous
              </button>
            </section>

            <section className="mt-10">
              <h2 className="mb-4 text-xl font-semibold">Nos prestations</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {prestations.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setBooking(true);
                      choisirPrestation(p.id);
                    }}
                    className="rounded-xl border border-slate-200 bg-white p-4 text-left transition-shadow hover:shadow-md"
                  >
                    <div className="text-sm font-semibold">{p.nom}</div>
                    <div className="mt-1 text-xs text-slate-500">{p.duree_minutes} min</div>
                    <div className="mt-2 text-sm font-semibold" style={{ color: t.primary }}>
                      {p.prix.toFixed(2)} €
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="mb-3 font-semibold">L&apos;équipe</h3>
                {praticiens.map((p, i) => (
                  <div key={p.id} className="mb-2 flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ background: t.primary, opacity: 1 - i * 0.2 }}
                    >
                      {initiales(p.nom)}
                    </span>
                    <span className="text-sm">{p.nom}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
                <h3 className="mb-3 font-semibold">Infos pratiques</h3>
                <p className="mb-1 text-slate-600">
                  📍 {cabinet.adresse}, {cabinet.ville}
                </p>
                <p className="mb-1 text-slate-600">🕗 {cabinet.horairesTexte}</p>
                <p className="text-slate-600">
                  📞 {cabinet.telephoneAffiche} — {cabinet.iaPrenom} répond 24h/24
                </p>
              </div>
            </section>
          </>
        ) : (
          <section className="mx-auto mt-2 max-w-lg">
            <div className="mb-5 flex items-center justify-between">
              <button onClick={() => (step === 0 ? resetBooking() : setStep(step - 1))} className="text-sm text-slate-500">
                ← Retour
              </button>
              <div className="flex gap-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="h-1.5 w-8 rounded-full" style={{ background: i <= step ? t.primary : "#E2E8F0" }} />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              {step === 0 && (
                <>
                  <h2 className="mb-4 text-lg font-semibold">Quelle prestation ?</h2>
                  <div className="space-y-2">
                    {prestations.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => choisirPrestation(p.id)}
                        className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-slate-400"
                      >
                        <div>
                          <div className="text-sm font-medium">{p.nom}</div>
                          <div className="text-xs text-slate-500">{p.duree_minutes} min</div>
                        </div>
                        <span className="text-sm font-semibold" style={{ color: t.primary }}>
                          {p.prix.toFixed(2)} €
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <h2 className="mb-4 text-lg font-semibold">Avec qui ?</h2>
                  <div className="space-y-2">
                    {praticiensPourPrestation.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => choisirPraticien(p.id)}
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-slate-400"
                      >
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                          style={{ background: t.primary }}
                        >
                          {initiales(p.nom)}
                        </span>
                        <span className="text-sm font-medium">{p.nom}</span>
                      </button>
                    ))}
                    {praticiensPourPrestation.length > 1 && (
                      <button
                        onClick={() => choisirPraticien("sans_preference")}
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-slate-400"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: "#94A3B8" }}>
                          ?
                        </span>
                        <span className="text-sm font-medium">Sans préférence</span>
                      </button>
                    )}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="mb-4 text-lg font-semibold">Quand ?</h2>
                  <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                    {jours.map((j) => (
                      <button
                        key={j.iso}
                        onClick={() => choisirJour(j.iso)}
                        className="flex-shrink-0 rounded-xl border px-4 py-2 text-sm font-medium"
                        style={
                          jourISO === j.iso
                            ? { background: t.primary, color: "#fff", borderColor: t.primary }
                            : { borderColor: "#E2E8F0", color: "#475569" }
                        }
                      >
                        {j.label}
                      </button>
                    ))}
                  </div>
                  {!jourISO && <p className="text-sm text-slate-400">Choisissez d&apos;abord un jour.</p>}
                  {jourISO && chargementSlots && <p className="text-sm text-slate-400">Recherche des créneaux…</p>}
                  {jourISO && !chargementSlots && slots.length === 0 && (
                    <p className="text-sm text-slate-400">Aucun créneau libre ce jour-là. Essayez un autre jour.</p>
                  )}
                  {jourISO && !chargementSlots && slots.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {slots.map((s) => (
                        <button
                          key={s.heure}
                          onClick={() => choisirHeure(s)}
                          className="rounded-lg border border-slate-200 py-2 text-sm hover:border-slate-400"
                          style={{ color: t.dark }}
                        >
                          {s.heure}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className="mb-1 text-lg font-semibold">Vos coordonnées</h2>
                  <p className="mb-4 text-xs text-slate-500">
                    {prestation?.nom} · {jourChoisi?.full} à {heure} · {praticienAssigneNom}
                  </p>
                  {erreur && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{erreur}</div>}
                  <div className="space-y-3">
                    <input placeholder="Nom et prénom" value={nom} onChange={(e) => setNom(e.target.value)} className={inputCls} />
                    <input placeholder="Téléphone" value={tel} onChange={(e) => setTel(e.target.value)} className={inputCls} />
                    <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
                  </div>
                  <button
                    disabled={!canConfirm || envoi}
                    onClick={confirmer}
                    className="mt-5 w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-40"
                    style={{ background: t.primary }}
                  >
                    {envoi ? "Confirmation…" : "Confirmer le rendez-vous"}
                  </button>
                  <p className="mt-3 text-center text-xs text-slate-400">Annulation gratuite jusqu&apos;à 24h avant.</p>
                </>
              )}

              {step === 4 && (
                <div className="py-4 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3xl" style={{ background: t.soft }}>
                    ✓
                  </div>
                  <h2 className="text-xl font-semibold">C&apos;est confirmé, {nom.split(" ")[0]} !</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {prestation?.nom}
                    <br />
                    {jourChoisi?.full} à {heure} · {praticienAssigneNom}
                  </p>
                  <div className="mx-auto mt-4 max-w-xs rounded-xl p-3 text-xs text-slate-600" style={{ background: t.soft }}>
                    📧 Confirmation envoyée à {email}
                    <br />
                    📱 Rappel SMS la veille · Besoin de changer ? Appelez, {cabinet.iaPrenom} s&apos;en occupe 24h/24.
                  </div>
                  <button onClick={resetBooking} className="mt-5 text-sm font-medium" style={{ color: t.primary }}>
                    ← Retour au site
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
      <ChatWidget
        slug={cabinet.slug}
        iaPrenom={cabinet.iaPrenom}
        cabinetNom={cabinet.nom}
        couleurPrimaire={t.primary}
        couleurDouce={t.soft}
      />
    </div>
  );
}
