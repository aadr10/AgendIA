import { useState, useMemo } from "react";

/* ------------------------------------------------------------------- */
/*  PROTOTYPE — Site public du cabinet + réservation en ligne (patient) */
/*  White-label : couleurs, nom, vocabulaire modifiables en direct       */
/* ------------------------------------------------------------------- */

const THEMES = {
  "Kiné (défaut)": {
    primary: "#0E5E63", soft: "#E3F2EC", dark: "#16232A", bg: "#F7F9F8",
    nom: "Cabinet Dupont", sousTitre: "Kinésithérapie", ville: "Charleroi",
    adresse: "Rue des Lilas 24", tel: "071 12 34 56", horaires: "Lun–Ven : 8h–18h · Sam : 8h–13h",
    ia: "Sofia", accroche: "Réservez votre séance en 30 secondes",
    prestations: [
      { nom: "Première séance (bilan)", duree: 45, prix: "35,00 €" },
      { nom: "Séance de suivi", duree: 30, prix: "28,50 €" },
      { nom: "Séance à domicile", duree: 60, prix: "42,00 €" },
    ],
    praticiens: ["Marc Dupont", "Julie Lambert"],
  },
  "Ostéopathe": {
    primary: "#5B4B8A", soft: "#EDE9F6", dark: "#1E1A2E", bg: "#F9F8FB",
    nom: "Ostéo Centre Mons", sousTitre: "Ostéopathie", ville: "Mons",
    adresse: "Grand-Rue 12", tel: "065 22 11 44", horaires: "Lun–Sam : 9h–19h",
    ia: "Léa", accroche: "Prenez rendez-vous à toute heure",
    prestations: [
      { nom: "Consultation adulte", duree: 45, prix: "60,00 €" },
      { nom: "Consultation nourrisson", duree: 30, prix: "55,00 €" },
      { nom: "Consultation sportif", duree: 60, prix: "70,00 €" },
    ],
    praticiens: ["Thomas Grard", "Emma Wauters"],
  },
  "Barber shop": {
    primary: "#B8863B", soft: "#F5EDDC", dark: "#181410", bg: "#FAF8F4",
    nom: "Le Rasoir d'Or", sousTitre: "Barbier", ville: "Namur",
    adresse: "Rue de Fer 8", tel: "081 55 66 77", horaires: "Mar–Sam : 10h–19h",
    ia: "Max", accroche: "Ton créneau, direct, sans appeler",
    prestations: [
      { nom: "Coupe + barbe", duree: 45, prix: "38,00 €" },
      { nom: "Coupe classique", duree: 30, prix: "25,00 €" },
      { nom: "Rasage traditionnel", duree: 30, prix: "22,00 €" },
    ],
    praticiens: ["Karim", "Diego"],
  },
  "Vétérinaire": {
    primary: "#2F6B3C", soft: "#E6F2E7", dark: "#152418", bg: "#F7FAF7",
    nom: "Clinique Vét' des Prés", sousTitre: "Vétérinaire", ville: "Liège",
    adresse: "Chaussée Verte 101", tel: "04 233 44 55", horaires: "Lun–Ven : 8h–19h · Sam : 9h–13h",
    ia: "Nina", accroche: "Un rendez-vous pour votre compagnon, jour et nuit",
    prestations: [
      { nom: "Consultation générale", duree: 30, prix: "45,00 €" },
      { nom: "Vaccination", duree: 20, prix: "38,00 €" },
      { nom: "Bilan senior", duree: 45, prix: "65,00 €" },
    ],
    praticiens: ["Dr. Fontaine", "Dr. Bekaert"],
  },
};

const JOURS_SEMAINE = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function genJours() {
  // 7 prochains jours à partir de mer 15/07/2026 (démo)
  const base = [
    { label: "Mer 15", full: "mercredi 15 juillet" },
    { label: "Jeu 16", full: "jeudi 16 juillet" },
    { label: "Ven 17", full: "vendredi 17 juillet" },
    { label: "Sam 18", full: "samedi 18 juillet" },
    { label: "Lun 20", full: "lundi 20 juillet" },
    { label: "Mar 21", full: "mardi 21 juillet" },
    { label: "Mer 22", full: "mercredi 22 juillet" },
  ];
  return base;
}

function genSlots(dayIdx, pratIdx) {
  // Créneaux fictifs mais déterministes (varient selon jour/praticien)
  const all = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "13:30", "14:00", "14:30", "15:00", "16:00", "16:30", "17:00"];
  return all.filter((_, i) => (i + dayIdx * 3 + pratIdx * 2) % 3 !== 0);
}

export default function App() {
  const [themeKey, setThemeKey] = useState("Kiné (défaut)");
  const [custom, setCustom] = useState({});
  const t = { ...THEMES[themeKey], ...custom };

  const [panel, setPanel] = useState(false);
  const [booking, setBooking] = useState(false);
  const [step, setStep] = useState(0);
  const [choix, setChoix] = useState({ presta: null, prat: null, jour: null, heure: null, nom: "", tel: "", email: "" });
  const [chat, setChat] = useState(false);
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const jours = useMemo(genJours, []);

  const resetBooking = () => { setBooking(false); setStep(0); setChoix({ presta: null, prat: null, jour: null, heure: null, nom: "", tel: "", email: "" }); };

  const switchTheme = (k) => { setThemeKey(k); setCustom({}); resetBooking(); setChatMsgs([]); };

  const setT = (k, v) => setCustom({ ...custom, [k]: v });
  const setPresta = (i, field, val) => setCustom({ ...custom, prestations: t.prestations.map((p, j) => (j === i ? { ...p, [field]: val } : p)) });
  const addPresta = () => setCustom({ ...custom, prestations: [...t.prestations, { nom: "Nouvelle prestation", duree: 30, prix: "0,00 €" }] });
  const delPresta = (i) => setCustom({ ...custom, prestations: t.prestations.filter((_, j) => j !== i) });
  const setPrat = (i, val) => setCustom({ ...custom, praticiens: t.praticiens.map((p, j) => (j === i ? val : p)) });
  const addPrat = () => setCustom({ ...custom, praticiens: [...t.praticiens, "Nouveau praticien"] });
  const delPrat = (i) => setCustom({ ...custom, praticiens: t.praticiens.filter((_, j) => j !== i) });

  const handlePhoto = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setCustom((c) => ({ ...c, photo: r.result }));
    r.readAsDataURL(f);
    e.target.value = "";
  };

  const sendChat = () => {
    const q = chatInput.trim();
    if (!q) return;
    const low = q.toLowerCase();
    let rep;
    if (low.includes("prix") || low.includes("tarif") || low.includes("combien")) {
      rep = `Nos tarifs : ${t.prestations.map((p) => `${p.nom} ${p.prix}`).join(" · ")}. Souhaitez-vous réserver ?`;
    } else if (low.includes("horaire") || low.includes("ouvert")) {
      rep = `Nos horaires : ${t.horaires}. Souhaitez-vous réserver un créneau ?`;
    } else if (low.includes("rendez") || low.includes("rdv") || low.includes("réserv") || low.includes("reserv")) {
      rep = "Avec plaisir ! Cliquez sur « Réserver » juste au-dessus, ou appelez-nous : je réponds aussi au téléphone, 24h/24.";
    } else if (low.includes("annul")) {
      rep = "Pour annuler ou déplacer un rendez-vous, appelez-nous à tout moment : je m'en occupe immédiatement, même la nuit.";
    } else {
      rep = `Bonne question ! Je peux vous renseigner sur les tarifs, les horaires ou prendre un rendez-vous. Et je suis aussi joignable par téléphone 24h/24.`;
    }
    setChatMsgs([...chatMsgs, { who: "vous", txt: q }, { who: t.ia, txt: rep }]);
    setChatInput("");
  };

  const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm";
  const canConfirm = choix.nom.trim() && choix.tel.trim() && choix.email.trim();

  return (
    <div className="min-h-screen" style={{ background: t.bg, color: t.dark, fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');`}</style>

      {/* ---------- Bandeau démo white-label ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs text-white" style={{ background: t.dark }}>
        <span className="opacity-80">Démo white-label — le même moteur, habillé pour chaque métier :</span>
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(THEMES).map((k) => (
            <button key={k} onClick={() => switchTheme(k)}
              className="rounded-full px-3 py-1 transition-opacity"
              style={{ background: themeKey === k ? THEMES[k].primary : "rgba(255,255,255,0.12)", opacity: themeKey === k ? 1 : 0.85 }}>
              {k}
            </button>
          ))}
          <button onClick={() => setPanel(!panel)} className="rounded-full px-3 py-1" style={{ background: "rgba(255,255,255,0.25)" }}>
            🎨 Personnaliser
          </button>
        </div>
      </div>

      {/* ---------- Panneau de personnalisation ---------- */}
      {panel && (
        <div className="border-b border-slate-200 bg-white px-4 py-4">
          <div className="mx-auto max-w-4xl space-y-5 text-sm">
            {/* Identité + coordonnées + couleurs */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Nom du cabinet</label>
                <input value={t.nom} onChange={(e) => setT("nom", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Prénom de l'IA</label>
                <input value={t.ia} onChange={(e) => setT("ia", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Téléphone</label>
                <input value={t.tel} onChange={(e) => setT("tel", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Adresse</label>
                <input value={t.adresse} onChange={(e) => setT("adresse", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Ville</label>
                <input value={t.ville} onChange={(e) => setT("ville", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Horaires (affichés + utilisés par l'IA)</label>
                <input value={t.horaires} onChange={(e) => setT("horaires", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="flex items-end gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Couleur principale</label>
                  <input type="color" value={t.primary} onChange={(e) => setT("primary", e.target.value)} className="h-9 w-16 cursor-pointer rounded-lg border border-slate-200" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Couleur douce</label>
                  <input type="color" value={t.soft} onChange={(e) => setT("soft", e.target.value)} className="h-9 w-16 cursor-pointer rounded-lg border border-slate-200" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Photo de fond du site</label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:border-slate-400">
                    📷 {t.photo ? "Changer la photo" : "Choisir une photo"}
                    <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                  </label>
                  {t.photo && (
                    <button onClick={() => setT("photo", null)} className="text-xs text-slate-400 hover:text-red-600">Retirer</button>
                  )}
                </div>
              </div>
            </div>

            {/* Prestations */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prestations (nom · durée · prix)</span>
                <button onClick={addPresta} className="rounded-lg px-3 py-1 text-xs font-medium text-white" style={{ background: t.primary }}>+ Ajouter</button>
              </div>
              <div className="space-y-2">
                {t.prestations.map((p, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <input value={p.nom} onChange={(e) => setPresta(i, "nom", e.target.value)} className="min-w-40 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                    <div className="flex items-center gap-1">
                      <input value={p.duree} onChange={(e) => setPresta(i, "duree", parseInt(e.target.value) || 0)} className="w-16 rounded-lg border border-slate-200 px-2 py-2 text-center text-sm" />
                      <span className="text-xs text-slate-400">min</span>
                    </div>
                    <input value={p.prix} onChange={(e) => setPresta(i, "prix", e.target.value)} className="w-24 rounded-lg border border-slate-200 px-2 py-2 text-center text-sm" />
                    <button onClick={() => delPresta(i)} className="text-slate-300 hover:text-red-600">✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Équipe */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Équipe</span>
                <button onClick={addPrat} className="rounded-lg px-3 py-1 text-xs font-medium text-white" style={{ background: t.primary }}>+ Ajouter</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {t.praticiens.map((p, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <input value={p} onChange={(e) => setPrat(i, e.target.value)} className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                    <button onClick={() => delPrat(i)} className="text-slate-300 hover:text-red-600">✕</button>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-400">→ En production : chaque cabinet règle tout ça une fois dans ses paramètres (+ upload du logo). Toutes les modifications sont utilisées instantanément par le site, la réservation et l'IA.</p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl px-4 pb-24">
        {/* ---------- Header ---------- */}
        <header className="flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold text-white" style={{ background: t.primary, fontFamily: "Sora, sans-serif" }}>
              {t.nom.trim().charAt(0) || "?"}
            </span>
            <div>
              <div className="text-lg font-semibold leading-tight" style={{ fontFamily: "Sora, sans-serif" }}>{t.nom}</div>
              <div className="text-xs text-slate-500">{t.sousTitre} · {t.ville}</div>
            </div>
          </div>
          <a className="hidden text-sm font-medium sm:block" style={{ color: t.primary }}>{t.tel}</a>
        </header>

        {!booking ? (
          <>
            {/* ---------- Hero ---------- */}
            <section
              className="relative overflow-hidden rounded-2xl px-6 py-10 text-center sm:py-16"
              style={t.photo
                ? { backgroundImage: `linear-gradient(rgba(12,16,15,0.45), rgba(12,16,15,0.6)), url(${t.photo})`, backgroundSize: "cover", backgroundPosition: "center" }
                : { background: t.soft }}>
              <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium" style={{ color: t.primary }}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute h-full w-full animate-ping rounded-full opacity-60" style={{ background: t.primary }} />
                  <span className="relative h-2 w-2 rounded-full" style={{ background: t.primary }} />
                </span>
                {t.ia} répond au téléphone et au chat, 24h/24
              </div>
              <h1 className="mx-auto max-w-xl text-3xl font-bold leading-tight sm:text-4xl"
                style={{ fontFamily: "Sora, sans-serif", color: t.photo ? "#FFFFFF" : t.dark, textShadow: t.photo ? "0 2px 16px rgba(0,0,0,0.4)" : "none" }}>
                {t.accroche}
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm" style={{ color: t.photo ? "rgba(255,255,255,0.92)" : "#475569" }}>
                Choisissez votre créneau en ligne, ou appelez à n'importe quelle heure : {t.ia}, notre secrétaire, décroche toujours.
              </p>
              <button onClick={() => setBooking(true)}
                className="mt-6 rounded-xl px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-transform hover:scale-105"
                style={{ background: t.primary, boxShadow: t.photo ? "0 8px 30px rgba(0,0,0,0.35)" : undefined }}>
                Réserver un rendez-vous
              </button>
            </section>

            {/* ---------- Prestations ---------- */}
            <section className="mt-10">
              <h2 className="mb-4 text-xl font-semibold" style={{ fontFamily: "Sora, sans-serif" }}>Nos prestations</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {t.prestations.map((p, i) => (
                  <button key={i} onClick={() => { setBooking(true); setChoix({ ...choix, presta: p }); setStep(1); }}
                    className="rounded-xl border border-slate-200 bg-white p-4 text-left transition-shadow hover:shadow-md">
                    <div className="text-sm font-semibold">{p.nom}</div>
                    <div className="mt-1 text-xs text-slate-500">{p.duree} min</div>
                    <div className="mt-2 text-sm font-semibold" style={{ color: t.primary }}>{p.prix}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* ---------- Équipe + infos ---------- */}
            <section className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="mb-3 font-semibold" style={{ fontFamily: "Sora, sans-serif" }}>L'équipe</h3>
                {t.praticiens.map((p, i) => (
                  <div key={i} className="mb-2 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: t.primary, opacity: 1 - i * 0.25 }}>
                      {p.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </span>
                    <span className="text-sm">{p}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
                <h3 className="mb-3 font-semibold" style={{ fontFamily: "Sora, sans-serif" }}>Infos pratiques</h3>
                <p className="mb-1 text-slate-600">📍 {t.adresse}, {t.ville}</p>
                <p className="mb-1 text-slate-600">🕗 {t.horaires}</p>
                <p className="text-slate-600">📞 {t.tel} — {t.ia} répond 24h/24</p>
              </div>
            </section>
          </>
        ) : (
          /* ================= RÉSERVATION ================= */
          <section className="mx-auto mt-2 max-w-lg">
            <div className="mb-5 flex items-center justify-between">
              <button onClick={() => (step === 0 ? resetBooking() : setStep(step - 1))} className="text-sm text-slate-500">← Retour</button>
              <div className="flex gap-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="h-1.5 w-8 rounded-full" style={{ background: i <= step ? t.primary : "#E2E8F0" }} />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              {step === 0 && (
                <>
                  <h2 className="mb-4 text-lg font-semibold" style={{ fontFamily: "Sora, sans-serif" }}>Quelle prestation ?</h2>
                  <div className="space-y-2">
                    {t.prestations.map((p, i) => (
                      <button key={i} onClick={() => { setChoix({ ...choix, presta: p }); setStep(1); }}
                        className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-slate-400">
                        <div>
                          <div className="text-sm font-medium">{p.nom}</div>
                          <div className="text-xs text-slate-500">{p.duree} min</div>
                        </div>
                        <span className="text-sm font-semibold" style={{ color: t.primary }}>{p.prix}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <h2 className="mb-4 text-lg font-semibold" style={{ fontFamily: "Sora, sans-serif" }}>Avec qui ?</h2>
                  <div className="space-y-2">
                    {[...t.praticiens, "Sans préférence"].map((p, i) => (
                      <button key={i} onClick={() => { setChoix({ ...choix, prat: p }); setStep(2); }}
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-slate-400">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: p === "Sans préférence" ? "#94A3B8" : t.primary }}>
                          {p === "Sans préférence" ? "?" : p.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                        </span>
                        <span className="text-sm font-medium">{p}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="mb-4 text-lg font-semibold" style={{ fontFamily: "Sora, sans-serif" }}>Quand ?</h2>
                  <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                    {jours.map((j, i) => (
                      <button key={i} onClick={() => setChoix({ ...choix, jour: j, heure: null })}
                        className="flex-shrink-0 rounded-xl border px-4 py-2 text-sm font-medium"
                        style={choix.jour?.label === j.label ? { background: t.primary, color: "#fff", borderColor: t.primary } : { borderColor: "#E2E8F0", color: "#475569" }}>
                        {j.label}
                      </button>
                    ))}
                  </div>
                  {choix.jour && (
                    <div className="grid grid-cols-4 gap-2">
                      {genSlots(jours.indexOf(choix.jour), t.praticiens.indexOf(choix.prat)).map((h) => (
                        <button key={h} onClick={() => { setChoix({ ...choix, heure: h }); setStep(3); }}
                          className="rounded-lg border border-slate-200 py-2 text-sm hover:border-slate-400"
                          style={{ color: t.dark }}>
                          {h}
                        </button>
                      ))}
                    </div>
                  )}
                  {!choix.jour && <p className="text-sm text-slate-400">Choisissez d'abord un jour.</p>}
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className="mb-1 text-lg font-semibold" style={{ fontFamily: "Sora, sans-serif" }}>Vos coordonnées</h2>
                  <p className="mb-4 text-xs text-slate-500">
                    {choix.presta?.nom} · {choix.jour?.full} à {choix.heure} · {choix.prat}
                  </p>
                  <div className="space-y-3">
                    <input placeholder="Nom et prénom" value={choix.nom} onChange={(e) => setChoix({ ...choix, nom: e.target.value })} className={inputCls} />
                    <input placeholder="Téléphone" value={choix.tel} onChange={(e) => setChoix({ ...choix, tel: e.target.value })} className={inputCls} />
                    <input placeholder="Email" type="email" value={choix.email} onChange={(e) => setChoix({ ...choix, email: e.target.value })} className={inputCls} />
                  </div>
                  <button disabled={!canConfirm} onClick={() => setStep(4)}
                    className="mt-5 w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-40"
                    style={{ background: t.primary }}>
                    Confirmer le rendez-vous
                  </button>
                  <p className="mt-3 text-center text-xs text-slate-400">Annulation gratuite jusqu'à 24h avant.</p>
                </>
              )}

              {step === 4 && (
                <div className="py-4 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3xl" style={{ background: t.soft }}>✓</div>
                  <h2 className="text-xl font-semibold" style={{ fontFamily: "Sora, sans-serif" }}>C'est confirmé, {choix.nom.split(" ")[0]} !</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {choix.presta?.nom}<br />
                    {choix.jour?.full} à {choix.heure} · {choix.prat}
                  </p>
                  <div className="mx-auto mt-4 max-w-xs rounded-xl p-3 text-xs text-slate-600" style={{ background: t.soft }}>
                    📧 Confirmation envoyée à {choix.email}<br />
                    📱 Rappel SMS la veille · Besoin de changer ? Appelez, {t.ia} s'en occupe 24h/24.
                  </div>
                  <button onClick={resetBooking} className="mt-5 text-sm font-medium" style={{ color: t.primary }}>← Retour au site</button>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* ---------- Chat widget ---------- */}
      <div className="fixed bottom-4 right-4 z-10 flex flex-col items-end">
        {chat && (
          <div className="mb-3 flex h-96 w-80 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-3 text-white" style={{ background: t.primary }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute h-full w-full animate-ping rounded-full bg-white opacity-60" />
                <span className="relative h-2 w-2 rounded-full bg-white" />
              </span>
              <span className="text-sm font-semibold">{t.ia} · {t.nom}</span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm" style={{ background: t.soft }}>
                Bonjour ! Je suis {t.ia}. Tarifs, horaires, rendez-vous… posez-moi votre question 🙂
              </div>
              {chatMsgs.map((m, i) => (
                <div key={i} className={`flex ${m.who === "vous" ? "justify-end" : ""}`}>
                  <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm"
                    style={m.who === "vous" ? { background: t.primary, color: "#fff" } : { background: t.soft }}>
                    {m.txt}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t border-slate-100 p-2">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()}
                placeholder="Écrivez ici… (essayez « tarifs »)" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <button onClick={sendChat} className="rounded-lg px-3 text-sm font-medium text-white" style={{ background: t.primary }}>→</button>
            </div>
          </div>
        )}
        <button onClick={() => setChat(!chat)}
          className="flex items-center gap-3 rounded-full py-4 pl-5 pr-6 text-white shadow-2xl transition-transform hover:scale-105"
          style={{ background: t.primary }}>
          <span className="text-2xl">{chat ? "✕" : "💬"}</span>
          <span className="text-left text-sm font-semibold leading-tight">
            {chat ? "Fermer" : <>Une question ?<br /><span className="font-normal opacity-90">{t.ia} vous répond</span></>}
          </span>
        </button>
      </div>
    </div>
  );
}
