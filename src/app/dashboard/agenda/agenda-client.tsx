"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toLocalISODate } from "@/lib/dates";
import {
  creerRdv,
  deplacerRdv,
  annulerRdv,
  marquerAbsentRdv,
  creerBlocage,
  supprimerBlocage,
  replanifierPatient,
} from "./actions";
import { badgeStyle, STATUT_LABELS } from "@/components/ui";

type Praticien = { id: string; nom: string; couleur_agenda: string };
type Prestation = { id: string; nom: string; duree_minutes: number; prix: number };
type Rdv = {
  id: string;
  debut: string;
  fin: string;
  statut: string;
  origine: string;
  patientId: string;
  praticienId: string;
  prestationId: string;
  patientNom: string;
  prestationNom: string;
  dureeMinutes: number;
};
type Blocage = {
  id: string;
  praticienId: string | null;
  debut: string;
  fin: string;
  motif: string;
};
type Impacte = {
  id: string;
  patientId: string;
  patientNom: string;
  prestationId: string;
  prestationNom: string;
  dureeMinutes: number;
  praticienId: string;
  praticienNom: string;
  ancienDebut: string;
};

const H0 = 8;
const H1 = 18;
const ROW_H = 44;
const HEURES = Array.from({ length: 20 }, (_, i) => H0 + i * 0.5);
const MOTIFS = ["Congés", "Maladie / imprévu", "Fermeture exceptionnelle", "Formation"];
const ORIGINE_LABEL: Record<string, string> = {
  ia_telephone: "créé par l'IA (téléphone)",
  site: "réservation en ligne",
  chat: "créé via le chat",
  manuel: "créé manuellement",
};

const fmtH = (h: number) => `${Math.floor(h)}h${h % 1 ? "30" : "00"}`;
const toHHMM = (h: number) => `${String(Math.floor(h)).padStart(2, "0")}:${h % 1 ? "30" : "00"}`;

function heureDecimale(iso: string) {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
}

function inputCls() {
  return "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";
}

export default function AgendaClient({
  semaineDebutISO,
  nbJours = 6,
  praticiens,
  prestations,
  rdvsInitiaux,
  blocagesInitiaux,
  couleurPrimaire,
}: {
  semaineDebutISO: string;
  nbJours?: number;
  praticiens: Praticien[];
  prestations: Prestation[];
  rdvsInitiaux: Rdv[];
  blocagesInitiaux: Blocage[];
  couleurPrimaire: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [sel, setSel] = useState<Rdv | null>(null);
  const [replanif, setReplanif] = useState<Impacte[]>([]);

  const semaineDebut = useMemo(() => new Date(semaineDebutISO + "T00:00:00"), [semaineDebutISO]);
  const jours = useMemo(
    () =>
      Array.from({ length: nbJours }, (_, i) => {
        const d = new Date(semaineDebut);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [semaineDebut, nbJours]
  );
  const labelsJours = jours.map((d) =>
    d.toLocaleDateString("fr-BE", { weekday: "short", day: "numeric" }).replace(".", "")
  );

  const [form, setForm] = useState<null | {
    id: string | null;
    patientNom: string;
    patientTelephone: string;
    patientEmail: string;
    prestationId: string;
    praticienId: string;
    jour: number;
    heure: number;
  }>(null);

  const [bf, setBf] = useState<null | {
    praticienId: string; // "" = tout le cabinet
    motif: string;
    jourFrom: number;
    jourTo: number;
    heureDebut: string;
    heureFin: string;
  }>(null);

  function dureeForm() {
    const p = prestations.find((p) => p.id === form?.prestationId);
    return p?.duree_minutes ?? 30;
  }

  function conflitForm() {
    if (!form) return false;
    const dur = dureeForm();
    const chevaucheRdv = rdvsInitiaux.some((r) => {
      if (r.id === form.id) return false;
      if (r.praticienId !== form.praticienId) return false;
      const jourR = Math.floor((new Date(r.debut).getTime() - semaineDebut.getTime()) / 86400000);
      if (jourR !== form.jour) return false;
      const hR = heureDecimale(r.debut);
      const durR = r.dureeMinutes / 60;
      return form.heure < hR + durR && hR < form.heure + dur / 60;
    });
    const chevaucheBlocage = blocagesInitiaux.some((b) => {
      if (b.praticienId !== null && b.praticienId !== form.praticienId) return false;
      const jourB = Math.floor((new Date(b.debut).getTime() - semaineDebut.getTime()) / 86400000);
      if (jourB !== form.jour) return false;
      const hB0 = heureDecimale(b.debut);
      const hB1 = heureDecimale(b.fin);
      return form.heure < hB1 && hB0 < form.heure + dur / 60;
    });
    return chevaucheRdv || chevaucheBlocage;
  }

  function debutISOPourForm() {
    if (!form) return "";
    const d = new Date(semaineDebut);
    d.setDate(d.getDate() + form.jour);
    d.setHours(Math.floor(form.heure), (form.heure % 1) * 60, 0, 0);
    return d.toISOString();
  }

  function ouvrirNouveauRdv() {
    setSel(null);
    setForm({
      id: null,
      patientNom: "",
      patientTelephone: "",
      patientEmail: "",
      prestationId: prestations[0]?.id ?? "",
      praticienId: praticiens[0]?.id ?? "",
      jour: 0,
      heure: 9,
    });
  }

  function ouvrirModifRdv(r: Rdv) {
    const jourR = Math.floor((new Date(r.debut).getTime() - semaineDebut.getTime()) / 86400000);
    setForm({
      id: r.id,
      patientNom: r.patientNom,
      patientTelephone: "",
      patientEmail: "",
      prestationId: r.prestationId,
      praticienId: r.praticienId,
      jour: jourR,
      heure: heureDecimale(r.debut),
    });
    setSel(null);
  }

  function enregistrerForm() {
    if (!form) return;
    setErreur(null);
    const dur = dureeForm();
    const debut = debutISOPourForm();

    startTransition(async () => {
      const res = form.id
        ? await deplacerRdv({
            id: form.id,
            prestationId: form.prestationId,
            praticienId: form.praticienId,
            debut,
            dureeMinutes: dur,
          })
        : await creerRdv({
            patientNom: form.patientNom.trim(),
            patientTelephone: form.patientTelephone.trim(),
            patientEmail: form.patientEmail.trim() || undefined,
            prestationId: form.prestationId,
            praticienId: form.praticienId,
            debut,
            dureeMinutes: dur,
          });
      if (res.error) {
        setErreur(res.error);
      } else {
        setForm(null);
        router.refresh();
      }
    });
  }

  function annuler(r: Rdv) {
    setErreur(null);
    startTransition(async () => {
      const res = await annulerRdv(r.id);
      if (res.error) setErreur(res.error);
      else {
        setSel(null);
        router.refresh();
      }
    });
  }

  function marquerAbsent(r: Rdv) {
    setErreur(null);
    startTransition(async () => {
      const res = await marquerAbsentRdv(r.id);
      if (res.error) setErreur(res.error);
      else {
        setSel(null);
        router.refresh();
      }
    });
  }

  function enregistrerBlocage() {
    if (!bf) return;
    setErreur(null);
    const dJ = jours[bf.jourFrom];
    const fJ = jours[bf.jourTo];
    const jourDebutISO = toLocalISODate(dJ);
    const jourFinISO = toLocalISODate(fJ);

    startTransition(async () => {
      const res = await creerBlocage({
        praticienId: bf.praticienId || null,
        motif: bf.motif,
        jourDebutISO,
        jourFinISO,
        heureDebut: bf.heureDebut,
        heureFin: bf.heureFin,
      });
      if (res.error) {
        setErreur(res.error);
      } else {
        setReplanif((prev) => [...prev, ...res.impactes]);
        setBf(null);
        router.refresh();
      }
    });
  }

  function retirerBlocage(id: string) {
    startTransition(async () => {
      const res = await supprimerBlocage(id);
      if (res.error) setErreur(res.error);
      else router.refresh();
    });
  }

  function recaser(imp: Impacte) {
    startTransition(async () => {
      const res = await replanifierPatient({
        patientId: imp.patientId,
        praticienId: imp.praticienId,
        prestationId: imp.prestationId,
        dureeMinutes: imp.dureeMinutes,
      });
      if (res.error) setErreur(res.error);
      else {
        setReplanif((prev) => prev.filter((x) => x.id !== imp.id));
        router.refresh();
      }
    });
  }

  const conflit = form ? conflitForm() : false;

  return (
    <div className="space-y-4">
      {erreur && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {erreur}
          <button className="ml-3 underline" onClick={() => setErreur(null)}>
            fermer
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
          {praticiens.map((p) => (
            <span key={p.id} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.couleur_agenda }} /> {p.nom}
            </span>
          ))}
          <button
            onClick={ouvrirNouveauRdv}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-white"
            style={{ background: couleurPrimaire }}
          >
            + Nouveau rendez-vous
          </button>
          <button
            onClick={() =>
              setBf({
                praticienId: "",
                motif: MOTIFS[0],
                jourFrom: 0,
                jourTo: 0,
                heureDebut: "08:00",
                heureFin: "18:00",
              })
            }
            className="rounded-lg border px-4 py-2 text-xs font-semibold"
            style={{ borderColor: "#C4762A", color: "#C4762A" }}
          >
            🏖️ Bloquer une période
          </button>
        </div>
      </div>

      {form && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 font-medium text-slate-800">
            {form.id ? "Modifier / déplacer le rendez-vous" : "Nouveau rendez-vous (manuel)"}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {!form.id && (
              <>
                <input
                  placeholder="Nom du patient"
                  value={form.patientNom}
                  onChange={(e) => setForm({ ...form, patientNom: e.target.value })}
                  className={inputCls() + " min-w-44 flex-1"}
                />
                <input
                  placeholder="Téléphone"
                  value={form.patientTelephone}
                  onChange={(e) => setForm({ ...form, patientTelephone: e.target.value })}
                  className={inputCls() + " w-40"}
                />
                <input
                  placeholder="Email (optionnel)"
                  value={form.patientEmail}
                  onChange={(e) => setForm({ ...form, patientEmail: e.target.value })}
                  className={inputCls() + " w-48"}
                />
              </>
            )}
            <select
              value={form.prestationId}
              onChange={(e) => setForm({ ...form, prestationId: e.target.value })}
              className={inputCls()}
            >
              {prestations.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} ({p.duree_minutes} min)
                </option>
              ))}
            </select>
            <select
              value={form.praticienId}
              onChange={(e) => setForm({ ...form, praticienId: e.target.value })}
              className={inputCls()}
            >
              {praticiens.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
            <select
              value={form.jour}
              onChange={(e) => setForm({ ...form, jour: +e.target.value })}
              className={inputCls()}
            >
              {labelsJours.map((j, i) => (
                <option key={j} value={i}>
                  {j}
                </option>
              ))}
            </select>
            <select
              value={form.heure}
              onChange={(e) => setForm({ ...form, heure: +e.target.value })}
              className={inputCls()}
            >
              {HEURES.map((h) => (
                <option key={h} value={h}>
                  {fmtH(h)}
                </option>
              ))}
            </select>
          </div>
          {conflit && (
            <p className="mt-2 text-xs font-medium" style={{ color: "#9C3325" }}>
              ⚠️ Ce créneau chevauche un autre rendez-vous ou une période bloquée. Choisissez une autre heure.
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <button
              onClick={enregistrerForm}
              disabled={
                isPending ||
                conflit ||
                (!form.id && (!form.patientNom.trim() || !form.patientTelephone.trim()))
              }
              className="rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: couleurPrimaire }}
            >
              Enregistrer
            </button>
            <button
              onClick={() => setForm(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {bf && (
        <div className="rounded-xl border p-5" style={{ borderColor: "#EAD3B5", background: "#FFFDF8" }}>
          <div className="mb-1 font-medium text-slate-800">
            Bloquer une période (congés, absence, imprévu, fermeture)
          </div>
          <p className="mb-4 text-xs text-slate-500">
            Les créneaux concernés seront fermés à la réservation. Les rendez-vous déjà pris sur cette
            période sont annulés et proposés ci-dessous pour un recasage automatique.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <select value={bf.motif} onChange={(e) => setBf({ ...bf, motif: e.target.value })} className={inputCls()}>
              {MOTIFS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
            <select
              value={bf.praticienId}
              onChange={(e) => setBf({ ...bf, praticienId: e.target.value })}
              className={inputCls()}
            >
              <option value="">Tout le cabinet</option>
              {praticiens.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-400">du</span>
            <select
              value={bf.jourFrom}
              onChange={(e) => setBf({ ...bf, jourFrom: +e.target.value })}
              className={inputCls()}
            >
              {labelsJours.map((j, i) => (
                <option key={j} value={i}>
                  {j}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-400">au</span>
            <select
              value={bf.jourTo}
              onChange={(e) => setBf({ ...bf, jourTo: +e.target.value })}
              className={inputCls()}
            >
              {labelsJours.map((j, i) => (
                <option key={j} value={i}>
                  {j}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-400">de</span>
            <select
              value={bf.heureDebut}
              onChange={(e) => setBf({ ...bf, heureDebut: e.target.value })}
              className={inputCls()}
            >
              {HEURES.map((h) => (
                <option key={h} value={toHHMM(h)}>
                  {fmtH(h)}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-400">à</span>
            <select
              value={bf.heureFin}
              onChange={(e) => setBf({ ...bf, heureFin: e.target.value })}
              className={inputCls()}
            >
              {[...HEURES.slice(1), 18].map((h) => (
                <option key={h} value={toHHMM(h)}>
                  {fmtH(h)}
                </option>
              ))}
            </select>
          </div>
          {bf.jourTo < bf.jourFrom || (bf.jourTo === bf.jourFrom && bf.heureFin <= bf.heureDebut) ? (
            <p className="mt-2 text-xs font-medium" style={{ color: "#9C3325" }}>
              ⚠️ Vérifiez les jours et heures : la fin doit être après le début.
            </p>
          ) : null}
          <div className="mt-4 flex gap-2">
            <button
              onClick={enregistrerBlocage}
              disabled={
                isPending ||
                bf.jourTo < bf.jourFrom ||
                (bf.jourTo === bf.jourFrom && bf.heureFin <= bf.heureDebut)
              }
              className="rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: "#C4762A" }}
            >
              Bloquer la période
            </button>
            <button
              onClick={() => setBf(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div
          className="grid"
          style={{ gridTemplateColumns: `56px repeat(${nbJours}, 1fr)`, minWidth: nbJours === 1 ? 320 : 720 }}
        >
          <div />
          {labelsJours.map((j) => (
            <div key={j} className="border-b border-l border-slate-100 px-2 py-2 text-center text-xs font-medium text-slate-600">
              {j}
            </div>
          ))}
          <div className="relative" style={{ height: (H1 - H0) * ROW_H }}>
            {Array.from({ length: H1 - H0 }, (_, i) => (
              <div key={i} className="absolute right-2 text-right text-[11px] text-slate-400" style={{ top: i * ROW_H - 7 }}>
                {i ? `${H0 + i}h` : ""}
              </div>
            ))}
          </div>
          {jours.map((jourDate, d) => (
            <div key={d} className="relative border-l border-slate-100" style={{ height: (H1 - H0) * ROW_H }}>
              {Array.from({ length: H1 - H0 }, (_, i) => (
                <div key={i} className="absolute left-0 right-0 border-t border-slate-100" style={{ top: i * ROW_H }} />
              ))}
              {blocagesInitiaux
                .filter((b) => Math.floor((new Date(b.debut).getTime() - semaineDebut.getTime()) / 86400000) === d)
                .map((b) => {
                  const pIdx = praticiens.findIndex((p) => p.id === b.praticienId);
                  const hDebut = heureDecimale(b.debut);
                  const hFin = heureDecimale(b.fin);
                  return (
                    <div
                      key={b.id}
                      className="absolute overflow-hidden rounded-md border border-slate-200"
                      style={{
                        top: (hDebut - H0) * ROW_H + 1,
                        height: (hFin - hDebut) * ROW_H - 3,
                        left: pIdx === 1 ? "50%" : 2,
                        right: pIdx === 0 ? "50%" : 2,
                        background:
                          "repeating-linear-gradient(45deg,#F1F4F3,#F1F4F3 6px,#E3E8E6 6px,#E3E8E6 12px)",
                      }}
                    >
                      <span className="absolute left-1 top-0.5 text-[10px] font-medium text-slate-500">
                        {b.motif}
                        {pIdx >= 0 ? ` · ${praticiens[pIdx].nom.split(" ")[0]}` : ""}
                      </span>
                    </div>
                  );
                })}
              {rdvsInitiaux
                .filter((r) => Math.floor((new Date(r.debut).getTime() - semaineDebut.getTime()) / 86400000) === d)
                .map((r) => {
                  const p = praticiens.find((p) => p.id === r.praticienId);
                  const isSel = sel?.id === r.id;
                  const hDebut = heureDecimale(r.debut);
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSel(isSel ? null : r)}
                      className="absolute left-1 right-1 overflow-hidden rounded-md px-1.5 py-0.5 text-left text-[11px] leading-tight text-white"
                      style={{
                        top: (hDebut - H0) * ROW_H + 1,
                        height: (r.dureeMinutes / 60) * ROW_H - 3,
                        background: p?.couleur_agenda ?? couleurPrimaire,
                        opacity: isSel ? 1 : 0.9,
                        outline: isSel ? "2px solid #16232A" : "none",
                      }}
                    >
                      <span className="font-semibold">{r.patientNom}</span>
                      <span className="opacity-80"> · {r.prestationNom}</span>
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>

      {sel && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm">
          <span className="font-medium text-slate-800">{sel.patientNom}</span>
          <span className="text-slate-500">
            {sel.prestationNom} · {sel.dureeMinutes} min ·{" "}
            {praticiens.find((p) => p.id === sel.praticienId)?.nom}
          </span>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={badgeStyle(sel.statut)}>
            {STATUT_LABELS[sel.statut] ?? sel.statut}
          </span>
          <span className="text-xs text-slate-400">Origine : {ORIGINE_LABEL[sel.origine] ?? sel.origine}</span>
          <span className="ml-auto flex gap-2">
            <button
              onClick={() => ouvrirModifRdv(sel)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
            >
              Déplacer / modifier
            </button>
            <button
              onClick={() => marquerAbsent(sel)}
              disabled={isPending || sel.statut === "absent"}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40"
              style={{ color: "#9C3325" }}
            >
              Marquer absent
            </button>
            <button
              onClick={() => annuler(sel)}
              disabled={isPending || sel.statut === "annule"}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40"
              style={{ color: "#9C3325" }}
            >
              Annuler le RDV
            </button>
          </span>
        </div>
      )}

      {blocagesInitiaux.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Périodes bloquées</div>
          <div className="flex flex-wrap gap-2">
            {blocagesInitiaux.map((b) => {
              const p = praticiens.find((p) => p.id === b.praticienId);
              return (
                <span
                  key={b.id}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
                  style={{ background: "#FBF0DF", color: "#8A5A16" }}
                >
                  {b.motif} · {new Date(b.debut).toLocaleDateString("fr-BE", { weekday: "short", day: "numeric" })} ·{" "}
                  {fmtH(heureDecimale(b.debut))}–{fmtH(heureDecimale(b.fin))} · {p ? p.nom : "Tout le cabinet"}
                  <button onClick={() => retirerBlocage(b.id)} className="opacity-60 hover:opacity-100">
                    ✕
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {replanif.length > 0 && (
        <div className="overflow-hidden rounded-xl border bg-white" style={{ borderColor: "#EAD3B8" }}>
          <div className="flex items-center justify-between px-5 py-3" style={{ background: "#FBF0DF" }}>
            <span className="text-sm font-medium" style={{ color: "#8A5A16" }}>
              ⚠️ {replanif.length} rendez-vous impacté{replanif.length > 1 ? "s" : ""} — à recaser
            </span>
          </div>
          <ul className="divide-y divide-slate-100">
            {replanif.map((imp) => (
              <li key={imp.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
                <span className="font-medium text-slate-800">{imp.patientNom}</span>
                <span className="text-slate-500">
                  {imp.prestationNom} · était le {new Date(imp.ancienDebut).toLocaleDateString("fr-BE", { weekday: "short", day: "numeric" })} à{" "}
                  {new Date(imp.ancienDebut).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" })} · {imp.praticienNom}
                </span>
                <button
                  onClick={() => recaser(imp)}
                  disabled={isPending}
                  className="ml-auto rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:border-slate-400"
                >
                  Recaser automatiquement
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
