import { useState } from "react";

/* ------------------------------------------------------------------ */
/*  PROTOTYPE — Secrétaire IA pour cabinets (V0 démo, données fictives) */
/* ------------------------------------------------------------------ */

const PRATICIENS = [
  { id: 0, nom: "Marc Dupont", role: "Kinésithérapeute", couleur: "#0E5E63", initiales: "MD" },
  { id: 1, nom: "Julie Lambert", role: "Kinésithérapeute", couleur: "#C4762A", initiales: "JL" },
];

const PRESTATIONS = [
  { nom: "Première séance (bilan)", duree: "45 min", prix: "35,00 €", prats: "Marc, Julie" },
  { nom: "Séance de suivi", duree: "30 min", prix: "28,50 €", prats: "Marc, Julie" },
  { nom: "Séance longue", duree: "45 min", prix: "35,00 €", prats: "Marc" },
  { nom: "Séance à domicile", duree: "60 min", prix: "42,00 €", prats: "Julie" },
];

const JOURS = ["Lun 13", "Mar 14", "Mer 15", "Jeu 16", "Ven 17", "Sam 18"];

const RDVS = [
  { day: 0, start: 8.5, dur: 0.75, patient: "A. Vandenberghe", presta: "Bilan", prat: 0, origine: "IA" },
  { day: 0, start: 9.5, dur: 0.5, patient: "L. Peeters", presta: "Suivi", prat: 0, origine: "Site" },
  { day: 0, start: 10.5, dur: 0.5, patient: "M. Rossi", presta: "Suivi", prat: 1, origine: "IA" },
  { day: 1, start: 9, dur: 0.75, patient: "C. Janssens", presta: "Bilan", prat: 1, origine: "IA" },
  { day: 1, start: 11, dur: 0.5, patient: "R. Dubois", presta: "Suivi", prat: 0, origine: "Manuel" },
  { day: 1, start: 14, dur: 0.5, patient: "S. Willems", presta: "Suivi", prat: 0, origine: "IA" },
  { day: 2, start: 8.5, dur: 0.5, patient: "K. Mertens", presta: "Suivi", prat: 1, origine: "Site" },
  { day: 2, start: 10, dur: 1, patient: "P. Leclercq", presta: "Domicile", prat: 1, origine: "IA" },
  { day: 2, start: 15, dur: 0.75, patient: "N. Baert", presta: "Bilan", prat: 0, origine: "IA" },
  { day: 3, start: 9.5, dur: 0.5, patient: "E. Simon", presta: "Suivi", prat: 0, origine: "Site" },
  { day: 3, start: 13.5, dur: 0.5, patient: "T. Claes", presta: "Suivi", prat: 1, origine: "IA" },
  { day: 4, start: 8.5, dur: 0.75, patient: "V. Goossens", presta: "Bilan", prat: 1, origine: "IA" },
  { day: 4, start: 11, dur: 0.5, patient: "F. Martin", presta: "Suivi", prat: 0, origine: "Manuel" },
  { day: 4, start: 16, dur: 0.5, patient: "H. De Smet", presta: "Suivi", prat: 0, origine: "IA" },
  { day: 5, start: 9, dur: 0.5, patient: "O. Renard", presta: "Suivi", prat: 1, origine: "Site" },
];

const APPELS = [
  {
    id: 1, heure: "Aujourd'hui · 08:12", patient: "Anna Vandenberghe", numero: "+32 471 •• •• 38",
    duree: "1 min 42", resultat: "RDV créé", motif: "Première séance — douleur lombaire",
    transcript: [
      ["Sofia", "Cabinet Dupont, bonjour ! Je suis Sofia, la secrétaire du cabinet. Comment puis-je vous aider ?"],
      ["Patient", "Bonjour, j'aurais besoin d'un rendez-vous, j'ai mal au bas du dos depuis quelques jours."],
      ["Sofia", "Bien sûr. Est-ce votre première visite au cabinet ?"],
      ["Patient", "Oui, c'est la première fois."],
      ["Sofia", "Parfait, je vous propose une première séance de bilan de 45 minutes. J'ai une disponibilité lundi à 8h30 avec Marc Dupont, ou mardi à 9h avec Julie Lambert. Laquelle vous convient ?"],
      ["Patient", "Lundi 8h30, c'est très bien."],
      ["Sofia", "C'est noté ! Puis-je avoir votre nom complet et votre adresse email pour la confirmation ?"],
      ["Patient", "Anna Vandenberghe, anna.v@gmail.com."],
      ["Sofia", "Merci Anna. Votre rendez-vous est confirmé : lundi à 8h30 avec Marc Dupont. Vous recevrez un email de confirmation et un rappel SMS la veille. Pensez à apporter votre prescription si vous en avez une. Bonne journée !"],
    ],
  },
  {
    id: 2, heure: "Aujourd'hui · 07:48", patient: "Sophie Willems", numero: "+32 496 •• •• 12",
    duree: "58 s", resultat: "RDV déplacé", motif: "Déplacement séance de mardi",
    transcript: [
      ["Sofia", "Cabinet Dupont, bonjour ! Je suis Sofia. Comment puis-je vous aider ?"],
      ["Patient", "Bonjour, j'ai un rendez-vous mardi à 10h mais j'ai un empêchement, je peux le déplacer ?"],
      ["Sofia", "Aucun problème. Je vois votre rendez-vous de suivi avec Marc Dupont. Je peux vous proposer mardi à 14h ou jeudi à 9h30."],
      ["Patient", "Mardi 14h, parfait."],
      ["Sofia", "C'est fait ! Votre séance est déplacée à mardi 14h. Vous recevrez une nouvelle confirmation par email. Bonne journée !"],
    ],
  },
  {
    id: 3, heure: "Hier · 21:34", patient: "Numéro inconnu", numero: "+32 478 •• •• 90",
    duree: "44 s", resultat: "Info donnée", motif: "Question tarifs et horaires",
    transcript: [
      ["Sofia", "Cabinet Dupont, bonsoir ! Je suis Sofia, la secrétaire du cabinet. Comment puis-je vous aider ?"],
      ["Patient", "Bonsoir, c'est combien une séance et vous êtes ouverts le samedi ?"],
      ["Sofia", "Une séance de suivi est à 28,50 € et une première séance de bilan à 35 €. Le cabinet est ouvert le samedi matin de 8h à 13h. Souhaitez-vous prendre rendez-vous ?"],
      ["Patient", "Non merci, je vais en parler à ma femme d'abord."],
      ["Sofia", "Très bien, n'hésitez pas à rappeler à tout moment, je suis disponible 24h/24. Bonne soirée !"],
    ],
  },
  {
    id: 4, heure: "Hier · 18:05", patient: "Karim Mertens", numero: "+32 485 •• •• 27",
    duree: "1 min 10", resultat: "RDV annulé", motif: "Annulation séance de mercredi",
    transcript: [
      ["Sofia", "Cabinet Dupont, bonjour ! Je suis Sofia. Comment puis-je vous aider ?"],
      ["Patient", "Bonjour, je dois annuler mon rendez-vous de mercredi, je suis malade."],
      ["Sofia", "Je suis désolée de l'apprendre, prompt rétablissement ! J'annule votre séance de mercredi 8h30. Souhaitez-vous reprogrammer dès maintenant ou préférez-vous rappeler plus tard ?"],
      ["Patient", "Je rappellerai quand ça ira mieux."],
      ["Sofia", "Très bien, c'est annulé sans frais. Soignez-vous bien !"],
    ],
  },
];

const ACTIVITE = [
  { t: "08:12", txt: "RDV créé pour Anna Vandenberghe — lundi 8h30 (bilan)", type: "create" },
  { t: "07:48", txt: "RDV de Sophie Willems déplacé à mardi 14h", type: "move" },
  { t: "07:48", txt: "Email de confirmation envoyé à Sophie Willems", type: "mail" },
  { t: "06:30", txt: "Rappels SMS envoyés pour les 6 RDV de demain", type: "mail" },
  { t: "hier 21:34", txt: "Question tarifs/horaires — réponse donnée, aucun RDV", type: "info" },
  { t: "hier 18:05", txt: "RDV de Karim Mertens annulé (maladie), créneau libéré", type: "cancel" },
  { t: "hier 18:06", txt: "Créneau libéré proposé à la liste d'attente (2 patients)", type: "create" },
];

const NAV = ["Tableau de bord", "Agenda", "Appels", "Secrétaire IA", "Praticiens", "Prestations"];

const badgeStyle = (r) => {
  const map = {
    "RDV créé": ["#E3F2EC", "#0E5E63"],
    "RDV déplacé": ["#FBF0DF", "#8A5A16"],
    "RDV annulé": ["#FBE7E4", "#9C3325"],
    "Info donnée": ["#EAEEF2", "#40515C"],
  };
  const [bg, fg] = map[r] || map["Info donnée"];
  return { background: bg, color: fg };
};

const origineStyle = { IA: "#0E5E63", Site: "#8A5A16", Manuel: "#40515C" };

/* ------------------------- Petits composants ------------------------- */

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold" style={{ color: accent || "#16232A", fontFamily: "Sora, sans-serif" }}>
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-500">{sub}</div>
    </div>
  );
}

function Toggle({ label, desc, on, onChange }) {
  return (
    <button onClick={onChange} className="flex w-full items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left">
      <div>
        <div className="text-sm font-medium text-slate-800">{label}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
      <div className="h-6 w-11 flex-shrink-0 rounded-full p-1 transition-colors" style={{ background: on ? "#0E5E63" : "#CBD5E1" }}>
        <div className="h-4 w-4 rounded-full bg-white transition-transform" style={{ transform: on ? "translateX(20px)" : "translateX(0)" }} />
      </div>
    </button>
  );
}

/* ------------------------------ Pages ------------------------------ */

function Dashboard({ rdvs }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="RDV aujourd'hui" value="9" sub="3 créés par Sofia" accent="#0E5E63" />
        <StatCard label="Appels traités (7 j)" value="31" sub="0 appel manqué" accent="#0E5E63" />
        <StatCard label="Annulations (7 j)" value="2" sub="1 créneau recasé" />
        <StatCard label="Créneaux libres" value="6" sub="cette semaine" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white lg:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="font-medium text-slate-800" style={{ fontFamily: "Sora, sans-serif" }}>
              Ce que Sofia a fait pendant que vous soigniez
            </div>
            <span className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium" style={{ background: "#E3F2EC", color: "#0E5E63" }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: "#0E5E63" }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#0E5E63" }} />
              </span>
              En ligne 24h/24
            </span>
          </div>
          <ul className="divide-y divide-slate-100">
            {ACTIVITE.map((a, i) => (
              <li key={i} className="flex items-start gap-3 px-5 py-3">
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: a.type === "cancel" ? "#C05E4E" : a.type === "move" ? "#C4762A" : "#0E5E63" }} />
                <div className="min-w-0">
                  <div className="text-sm text-slate-700">{a.txt}</div>
                  <div className="text-xs text-slate-400">{a.t}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white lg:col-span-2">
          <div className="border-b border-slate-100 px-5 py-4 font-medium text-slate-800" style={{ fontFamily: "Sora, sans-serif" }}>
            Prochains rendez-vous
          </div>
          <ul className="divide-y divide-slate-100">
            {rdvs.slice(0, 6).map((r, i) => {
              const p = PRATICIENS[r.prat];
              const h = Math.floor(r.start), m = (r.start % 1) * 60;
              return (
                <li key={i} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: p.couleur }}>
                    {p.initiales}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-800">{r.patient}</div>
                    <div className="text-xs text-slate-500">{r.presta} · {JOURS[r.day]} · {h}h{m ? m : "00"}</div>
                  </div>
                  <span className="text-xs font-medium" style={{ color: origineStyle[r.origine] }}>{r.origine}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

const HEURES = Array.from({ length: 20 }, (_, i) => 8 + i * 0.5);
const fmtH = (h) => `${Math.floor(h)}h${h % 1 ? "30" : "00"}`;
const PRESTA_AGENDA = [
  { label: "Bilan", dur: 0.75 },
  { label: "Suivi", dur: 0.5 },
  { label: "Domicile", dur: 1 },
];

const MOTIFS_BLOCAGE = ["Congés", "Maladie / imprévu", "Fermeture exceptionnelle", "Formation"];

function Agenda({ rdvs, setRdvs }) {
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [bf, setBf] = useState(null);
  const [replanif, setReplanif] = useState([]);
  const H0 = 8, H1 = 18, rowH = 44;

  const conflit = form && (
    rdvs.some((r, i) =>
      i !== form.idx && r.prat === form.prat && r.day === form.day &&
      form.start < r.start + r.dur && r.start < form.start + form.dur
    ) ||
    blocks.some((b) =>
      b.day === form.day && (b.prat === -1 || b.prat === form.prat) &&
      form.start < b.end && b.start < form.start + form.dur
    )
  );

  const libre = (day, start, prat, dur) =>
    start + dur <= H1 &&
    !rdvs.some((r) => r.prat === prat && r.day === day && start < r.start + r.dur && r.start < start + dur) &&
    !blocks.some((b) => b.day === day && (b.prat === -1 || b.prat === prat) && start < b.end && b.start < start + dur);

  const saveBlock = () => {
    const nouveaux = [];
    for (let d = bf.dayFrom; d <= bf.dayTo; d++) nouveaux.push({ day: d, start: bf.start, end: bf.end, prat: bf.prat, motif: bf.motif });
    const touche = (r) => nouveaux.some((b) => b.day === r.day && (b.prat === -1 || b.prat === r.prat) && r.start < b.end && b.start < r.start + r.dur);
    const impactes = rdvs.filter(touche);
    if (impactes.length) setReplanif([...replanif, ...impactes]);
    setRdvs(rdvs.filter((r) => !touche(r)));
    setBlocks([...blocks, ...nouveaux]);
    setBf(null); setSel(null);
  };

  const patientReplanifie = (r) => {
    for (let d = 0; d < JOURS.length; d++) {
      for (const h of HEURES) {
        if (libre(d, h, r.prat, r.dur)) {
          setRdvs([...rdvs, { ...r, day: d, start: h, origine: "Site" }]);
          setReplanif(replanif.filter((x) => x !== r));
          return;
        }
      }
    }
  };

  const save = () => {
    const rdv = {
      day: form.day, start: form.start, dur: form.dur,
      patient: form.patient.trim(), presta: form.presta, prat: form.prat,
      origine: form.idx >= 0 ? rdvs[form.idx].origine : "Manuel",
    };
    setRdvs(form.idx >= 0 ? rdvs.map((r, i) => (i === form.idx ? rdv : r)) : [...rdvs, rdv]);
    setForm(null); setSel(null);
  };

  const inputCls = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="font-medium text-slate-800" style={{ fontFamily: "Sora, sans-serif" }}>Semaine du 13 au 18 juillet</div>
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 text-xs">
            <span className="rounded-md px-3 py-1 text-slate-400">Jour</span>
            <span className="rounded-md px-3 py-1 font-medium text-white" style={{ background: "#0E5E63" }}>Semaine</span>
            <span className="rounded-md px-3 py-1 text-slate-400">Mois</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-600">
          {PRATICIENS.map((p) => (
            <span key={p.id} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.couleur }} /> {p.nom}
            </span>
          ))}
          <button
            onClick={() => setForm({ idx: -1, patient: "", presta: "Suivi", prat: 0, day: 0, start: 9, dur: 0.5 })}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-white"
            style={{ background: "#0E5E63" }}>
            + Nouveau rendez-vous
          </button>
          <button
            onClick={() => setBf({ prat: -1, dayFrom: 0, dayTo: 0, start: 8, end: 18, motif: "Congés" })}
            className="rounded-lg border px-4 py-2 text-xs font-semibold"
            style={{ borderColor: "#C4762A", color: "#C4762A" }}>
            🏖️ Bloquer une période
          </button>
        </div>
      </div>

      {form && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 font-medium text-slate-800" style={{ fontFamily: "Sora, sans-serif" }}>
            {form.idx >= 0 ? "Modifier / déplacer le rendez-vous" : "Nouveau rendez-vous (manuel)"}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input placeholder="Nom du patient" value={form.patient}
              onChange={(e) => setForm({ ...form, patient: e.target.value })}
              className={inputCls + " min-w-44 flex-1"} />
            <select value={form.presta}
              onChange={(e) => { const p = PRESTA_AGENDA.find((x) => x.label === e.target.value); setForm({ ...form, presta: p.label, dur: p.dur }); }}
              className={inputCls}>
              {PRESTA_AGENDA.map((p) => <option key={p.label} value={p.label}>{p.label} ({p.dur * 60} min)</option>)}
            </select>
            <select value={form.prat} onChange={(e) => setForm({ ...form, prat: +e.target.value })} className={inputCls}>
              {PRATICIENS.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
            <select value={form.day} onChange={(e) => setForm({ ...form, day: +e.target.value })} className={inputCls}>
              {JOURS.map((j, i) => <option key={j} value={i}>{j}</option>)}
            </select>
            <select value={form.start} onChange={(e) => setForm({ ...form, start: +e.target.value })} className={inputCls}>
              {HEURES.map((h) => <option key={h} value={h}>{fmtH(h)}</option>)}
            </select>
          </div>
          {conflit && (
            <p className="mt-2 text-xs font-medium" style={{ color: "#9C3325" }}>
              ⚠️ Ce créneau chevauche un autre rendez-vous de {PRATICIENS[form.prat].nom}. Choisissez une autre heure.
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <button onClick={save} disabled={!form.patient.trim() || conflit}
              className="rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: "#0E5E63" }}>
              Enregistrer
            </button>
            <button onClick={() => setForm(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600">
              Fermer
            </button>
          </div>
        </div>
      )}

      {bf && (
        <div className="rounded-xl border p-5" style={{ borderColor: "#EAD3B5", background: "#FFFDF8" }}>
          <div className="mb-1 font-medium text-slate-800" style={{ fontFamily: "Sora, sans-serif" }}>
            Bloquer une période (congés, absence, imprévu, fermeture)
          </div>
          <p className="mb-4 text-xs text-slate-500">
            Les créneaux concernés seront automatiquement fermés à la réservation (site, téléphone, chat).
            Les patients qui avaient déjà rendez-vous recevront un SMS + email avec un lien pour choisir eux-mêmes un nouveau créneau.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <select value={bf.motif} onChange={(e) => setBf({ ...bf, motif: e.target.value })} className={inputCls}>
              {MOTIFS_BLOCAGE.map((m) => <option key={m}>{m}</option>)}
            </select>
            <select value={bf.prat} onChange={(e) => setBf({ ...bf, prat: +e.target.value })} className={inputCls}>
              <option value={-1}>Tout le cabinet</option>
              {PRATICIENS.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
            <span className="text-xs text-slate-400">du</span>
            <select value={bf.dayFrom} onChange={(e) => setBf({ ...bf, dayFrom: +e.target.value })} className={inputCls}>
              {JOURS.map((j, i) => <option key={j} value={i}>{j}</option>)}
            </select>
            <span className="text-xs text-slate-400">au</span>
            <select value={bf.dayTo} onChange={(e) => setBf({ ...bf, dayTo: +e.target.value })} className={inputCls}>
              {JOURS.map((j, i) => <option key={j} value={i}>{j}</option>)}
            </select>
            <span className="text-xs text-slate-400">de</span>
            <select value={bf.start} onChange={(e) => setBf({ ...bf, start: +e.target.value })} className={inputCls}>
              {HEURES.map((h) => <option key={h} value={h}>{fmtH(h)}</option>)}
            </select>
            <span className="text-xs text-slate-400">à</span>
            <select value={bf.end} onChange={(e) => setBf({ ...bf, end: +e.target.value })} className={inputCls}>
              {[...HEURES.slice(1), 18].map((h) => <option key={h} value={h}>{fmtH(h)}</option>)}
            </select>
          </div>
          {(bf.end <= bf.start || bf.dayTo < bf.dayFrom) && (
            <p className="mt-2 text-xs font-medium" style={{ color: "#9C3325" }}>⚠️ Vérifiez les dates et heures : la fin doit être après le début.</p>
          )}
          <div className="mt-4 flex gap-2">
            <button onClick={saveBlock} disabled={bf.end <= bf.start || bf.dayTo < bf.dayFrom}
              className="rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: "#C4762A" }}>
              Bloquer la période
            </button>
            <button onClick={() => setBf(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600">
              Fermer
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div className="grid min-w-[720px]" style={{ gridTemplateColumns: "56px repeat(6, 1fr)" }}>
          <div />
          {JOURS.map((j) => (
            <div key={j} className="border-b border-l border-slate-100 px-2 py-2 text-center text-xs font-medium text-slate-600">{j}</div>
          ))}
          {/* colonne heures */}
          <div className="relative" style={{ height: (H1 - H0) * rowH }}>
            {Array.from({ length: H1 - H0 }, (_, i) => (
              <div key={i} className="absolute right-2 text-right text-[11px] text-slate-400" style={{ top: i * rowH - 7 }}>
                {i ? `${H0 + i}h` : ""}
              </div>
            ))}
          </div>
          {JOURS.map((_, d) => (
            <div key={d} className="relative border-l border-slate-100" style={{ height: (H1 - H0) * rowH }}>
              {Array.from({ length: H1 - H0 }, (_, i) => (
                <div key={i} className="absolute left-0 right-0 border-t border-slate-100" style={{ top: i * rowH }} />
              ))}
              {blocks.filter((b) => b.day === d).map((b, i) => (
                <div key={"b" + i}
                  className="absolute overflow-hidden rounded-md border border-slate-200"
                  style={{
                    top: (b.start - H0) * rowH + 1,
                    height: (b.end - b.start) * rowH - 3,
                    left: b.prat === 1 ? "50%" : 2,
                    right: b.prat === 0 ? "50%" : 2,
                    background: "repeating-linear-gradient(45deg,#F1F4F3,#F1F4F3 6px,#E3E8E6 6px,#E3E8E6 12px)",
                  }}>
                  <span className="absolute left-1 top-0.5 text-[10px] font-medium text-slate-500">
                    {b.motif}{b.prat >= 0 ? ` · ${PRATICIENS[b.prat].initiales}` : ""}
                  </span>
                </div>
              ))}
              {rdvs.filter((r) => r.day === d).map((r, i) => {
                const p = PRATICIENS[r.prat];
                const isSel = sel === r;
                return (
                  <button
                    key={i}
                    onClick={() => setSel(isSel ? null : r)}
                    className="absolute left-1 right-1 overflow-hidden rounded-md px-1.5 py-0.5 text-left text-[11px] leading-tight text-white"
                    style={{
                      top: (r.start - H0) * rowH + 1,
                      height: r.dur * rowH - 3,
                      background: p.couleur,
                      opacity: isSel ? 1 : 0.9,
                      outline: isSel ? "2px solid #16232A" : "none",
                    }}
                  >
                    <span className="font-semibold">{r.patient}</span>
                    <span className="opacity-80"> · {r.presta}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {sel && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm">
          <span className="font-medium text-slate-800">{sel.patient}</span>
          <span className="text-slate-500">{sel.presta} · {sel.dur * 60} min · {PRATICIENS[sel.prat].nom}</span>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={badgeStyle("RDV créé")}>Confirmé</span>
          <span className="text-xs text-slate-400">Origine : {sel.origine === "IA" ? "créé par Sofia (téléphone)" : sel.origine === "Site" ? "réservation en ligne" : "créé manuellement"}</span>
          <span className="ml-auto flex gap-2">
            <button
              onClick={() => setForm({ idx: rdvs.indexOf(sel), patient: sel.patient, presta: sel.presta, prat: sel.prat, day: sel.day, start: sel.start, dur: sel.dur })}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600">
              Déplacer / modifier
            </button>
            <button
              onClick={() => { setRdvs(rdvs.filter((r) => r !== sel)); setSel(null); }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs" style={{ color: "#9C3325" }}>
              Annuler le RDV
            </button>
          </span>
        </div>
      )}

      {blocks.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Périodes bloquées</div>
          <div className="flex flex-wrap gap-2">
            {blocks.map((b, i) => (
              <span key={i} className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
                style={{ background: "#FBF0DF", color: "#8A5A16" }}>
                {b.motif} · {JOURS[b.day]} · {fmtH(b.start)}–{fmtH(b.end)} · {b.prat === -1 ? "Tout le cabinet" : PRATICIENS[b.prat].nom}
                <button onClick={() => setBlocks(blocks.filter((_, j) => j !== i))} className="opacity-60 hover:opacity-100">✕</button>
              </span>
            ))}
          </div>
        </div>
      )}

      {replanif.length > 0 && (
        <div className="overflow-hidden rounded-xl border bg-white" style={{ borderColor: "#EAD3B8" }}>
          <div className="flex items-center justify-between px-5 py-3" style={{ background: "#FBF0DF" }}>
            <span className="text-sm font-medium" style={{ color: "#8A5A16", fontFamily: "Sora, sans-serif" }}>
              ⚠️ {replanif.length} rendez-vous impacté{replanif.length > 1 ? "s" : ""} — patients prévenus automatiquement
            </span>
          </div>
          <ul className="divide-y divide-slate-100">
            {replanif.map((r, i) => (
              <li key={i} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
                <span className="font-medium text-slate-800">{r.patient}</span>
                <span className="text-slate-500">{r.presta} · était {JOURS[r.day]} à {fmtH(r.start)} · {PRATICIENS[r.prat].nom}</span>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: "#E3F2EC", color: "#0E5E63" }}>
                  📧 + 📱 lien de replanification envoyé
                </span>
                <button onClick={() => patientReplanifie(r)}
                  className="ml-auto rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:border-slate-400">
                  Simuler : le patient choisit un créneau
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}

function Appels() {
  const [open, setOpen] = useState(1);
  return (
    <div className="space-y-3">
      {APPELS.map((a) => (
        <div key={a.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <button onClick={() => setOpen(open === a.id ? null : a.id)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 text-left">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-800">{a.patient} <span className="font-normal text-slate-400">· {a.numero}</span></div>
              <div className="text-xs text-slate-500">{a.motif}</div>
            </div>
            <span className="text-xs text-slate-400">{a.heure} · {a.duree}</span>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={badgeStyle(a.resultat)}>{a.resultat}</span>
            <span className="text-slate-400">{open === a.id ? "▾" : "▸"}</span>
          </button>
          {open === a.id && (
            <div className="space-y-2 border-t border-slate-100 px-5 py-4" style={{ background: "#F7F9F8" }}>
              <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Transcription</div>
              {a.transcript.map(([who, txt], i) => (
                <div key={i} className={`flex ${who === "Sofia" ? "" : "justify-end"}`}>
                  <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm" style={who === "Sofia" ? { background: "#E3F2EC", color: "#16232A" } : { background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#16232A" }}>
                    <span className="mr-1 text-xs font-semibold" style={{ color: who === "Sofia" ? "#0E5E63" : "#64748B" }}>{who} —</span>
                    {txt}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ConfigIA() {
  const [prenom, setPrenom] = useState("Sofia");
  const [accueil, setAccueil] = useState("Cabinet Dupont, bonjour ! Je suis Sofia, la secrétaire du cabinet. Comment puis-je vous aider ?");
  const [ton, setTon] = useState("Chaleureux et professionnel");
  const [regles, setRegles] = useState({ delai: true, auto: true, nouveaux: true, transfert: true });
  const [faq, setFaq] = useState([
    "Faut-il une prescription médicale ? → Oui pour le remboursement, mais vous pouvez consulter sans.",
    "Où se garer ? → Parking gratuit derrière le cabinet, entrée rue des Lilas.",
    "Acceptez-vous les paiements par carte ? → Oui, Bancontact et carte bancaire.",
  ]);
  const [newQ, setNewQ] = useState("");
  const flip = (k) => setRegles({ ...regles, [k]: !regles[k] });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 font-medium text-slate-800" style={{ fontFamily: "Sora, sans-serif" }}>Identité de votre secrétaire</div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Prénom</label>
          <input value={prenom} onChange={(e) => setPrenom(e.target.value)} className="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <label className="mb-1 block text-xs font-medium text-slate-500">Ton</label>
          <select value={ton} onChange={(e) => setTon(e.target.value)} className="mb-4 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <option>Chaleureux et professionnel</option>
            <option>Formel</option>
            <option>Décontracté</option>
          </select>
          <label className="mb-1 block text-xs font-medium text-slate-500">Message d'accueil (téléphone et chat)</label>
          <textarea value={accueil} onChange={(e) => setAccueil(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>

        <div className="space-y-2">
          <Toggle label="Délai minimum de réservation : 2 h" desc={`${prenom} ne propose jamais un créneau dans moins de 2 heures`} on={regles.delai} onChange={() => flip("delai")} />
          <Toggle label="Confirmation automatique" desc="Les RDV pris par téléphone ou en ligne sont confirmés sans validation manuelle" on={regles.auto} onChange={() => flip("auto")} />
          <Toggle label="Accepter les nouveaux patients" desc={`${prenom} peut créer des fiches pour des patients inconnus`} on={regles.nouveaux} onChange={() => flip("nouveaux")} />
          <Toggle label="Transfert vers un humain" desc="Si le patient le demande ou si la situation dépasse ses règles, l'appel est transféré" on={regles.transfert} onChange={() => flip("transfert")} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-1 font-medium text-slate-800" style={{ fontFamily: "Sora, sans-serif" }}>Questions fréquentes</div>
        <p className="mb-4 text-xs text-slate-500">{prenom} utilise ces réponses au téléphone et sur le chat du site.</p>
        <ul className="mb-4 space-y-2">
          {faq.map((q, i) => (
            <li key={i} className="flex items-start justify-between gap-3 rounded-lg px-3 py-2 text-sm text-slate-700" style={{ background: "#F7F9F8" }}>
              <span>{q}</span>
              <button onClick={() => setFaq(faq.filter((_, j) => j !== i))} className="text-xs text-slate-400 hover:text-red-600">✕</button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input value={newQ} onChange={(e) => setNewQ(e.target.value)} placeholder="Question → Réponse" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <button
            onClick={() => { if (newQ.trim()) { setFaq([...faq, newQ.trim()]); setNewQ(""); } }}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "#0E5E63" }}
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

function Praticiens() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {PRATICIENS.map((p) => (
        <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white" style={{ background: p.couleur }}>{p.initiales}</span>
            <div>
              <div className="font-medium text-slate-800">{p.nom}</div>
              <div className="text-xs text-slate-500">{p.role}</div>
            </div>
          </div>
          <div className="mt-4 space-y-1 text-sm text-slate-600">
            <div>Lun – Ven : 8h00 – 18h00</div>
            <div>Samedi : {p.id === 1 ? "8h00 – 13h00" : "fermé"}</div>
          </div>
          <div className="mt-3 text-xs text-slate-400">Couleur agenda : <span className="ml-1 inline-block h-3 w-3 rounded-sm align-middle" style={{ background: p.couleur }} /></div>
        </div>
      ))}
      <button className="flex min-h-32 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400">+ Ajouter un praticien</button>
    </div>
  );
}

function Prestations() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
            <th className="px-5 py-3 font-medium">Prestation</th>
            <th className="px-5 py-3 font-medium">Durée</th>
            <th className="px-5 py-3 font-medium">Prix</th>
            <th className="px-5 py-3 font-medium">Praticiens</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {PRESTATIONS.map((p, i) => (
            <tr key={i}>
              <td className="px-5 py-3 font-medium text-slate-800">{p.nom}</td>
              <td className="px-5 py-3 text-slate-600">{p.duree}</td>
              <td className="px-5 py-3 text-slate-600">{p.prix}</td>
              <td className="px-5 py-3 text-slate-600">{p.prats}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------ Shell ------------------------------ */

export default function App() {
  const [page, setPage] = useState("Tableau de bord");
  const [rdvs, setRdvs] = useState(RDVS);
  return (
    <div className="min-h-screen text-slate-800" style={{ background: "#F1F4F3", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600&family=Inter:wght@400;500;600&display=swap');`}</style>

      <div className="mx-auto flex max-w-6xl gap-6 p-4 lg:p-6">
        {/* Sidebar */}
        <aside className="hidden w-52 flex-shrink-0 md:block">
          <div className="mb-6 px-2">
            <div className="text-lg font-semibold" style={{ fontFamily: "Sora, sans-serif", color: "#0E5E63" }}>Cabinet Dupont</div>
            <div className="text-xs text-slate-400">Kinésithérapie · Charleroi</div>
          </div>
          <nav className="space-y-1">
            {NAV.map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors"
                style={page === n ? { background: "#0E5E63", color: "#fff", fontWeight: 500 } : { color: "#475569" }}
              >
                {n}
              </button>
            ))}
          </nav>
          <div className="mt-8 rounded-xl p-4 text-xs" style={{ background: "#E3F2EC", color: "#0E5E63" }}>
            <div className="mb-1 font-semibold">Sofia est en ligne</div>
            31 appels traités cette semaine, 0 manqué.
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between md:hidden">
            <select value={page} onChange={(e) => setPage(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              {NAV.map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div className="mb-5 flex items-center justify-between">
            <h1 className="text-xl font-semibold" style={{ fontFamily: "Sora, sans-serif" }}>{page}</h1>
            <span className="text-sm text-slate-400">Mardi 14 juillet 2026</span>
          </div>
          {page === "Tableau de bord" && <Dashboard rdvs={rdvs} />}
          {page === "Agenda" && <Agenda rdvs={rdvs} setRdvs={setRdvs} />}
          {page === "Appels" && <Appels />}
          {page === "Secrétaire IA" && <ConfigIA />}
          {page === "Praticiens" && <Praticiens />}
          {page === "Prestations" && <Prestations />}
        </main>
      </div>
    </div>
  );
}
