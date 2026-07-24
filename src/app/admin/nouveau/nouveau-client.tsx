"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { creerCabinet } from "../actions";

const METIERS = [
  { value: "kine", label: "Kinésithérapie" },
  { value: "osteo", label: "Ostéopathie" },
  { value: "dentiste", label: "Dentisterie" },
  { value: "veto", label: "Vétérinaire" },
  { value: "barber", label: "Barbier" },
];

const TEMPLATES_PRESTATIONS: Record<string, { nom: string; dureeMinutes: number; prix: number }[]> = {
  kine: [
    { nom: "Première séance (bilan)", dureeMinutes: 45, prix: 35 },
    { nom: "Séance de suivi", dureeMinutes: 30, prix: 28.5 },
  ],
  osteo: [
    { nom: "Consultation adulte", dureeMinutes: 45, prix: 60 },
    { nom: "Consultation enfant", dureeMinutes: 30, prix: 50 },
  ],
  dentiste: [
    { nom: "Consultation", dureeMinutes: 30, prix: 45 },
    { nom: "Détartrage", dureeMinutes: 30, prix: 40 },
  ],
  veto: [
    { nom: "Consultation générale", dureeMinutes: 30, prix: 45 },
    { nom: "Vaccination", dureeMinutes: 20, prix: 38 },
  ],
  barber: [
    { nom: "Coupe", dureeMinutes: 30, prix: 25 },
    { nom: "Coupe + barbe", dureeMinutes: 45, prix: 38 },
  ],
};

const MESSAGES_ACCUEIL: Record<string, (nom: string, ia: string) => string> = {
  kine: (nom, ia) => `${nom}, bonjour ! Je suis ${ia}, la secrétaire du cabinet. Comment puis-je vous aider ?`,
  osteo: (nom, ia) => `${nom}, bonjour ! Je suis ${ia}, la secrétaire du cabinet. Comment puis-je vous aider ?`,
  dentiste: (nom, ia) => `${nom}, bonjour ! Je suis ${ia}, la secrétaire du cabinet dentaire. Comment puis-je vous aider ?`,
  veto: (nom, ia) => `${nom}, bonjour ! Je suis ${ia}, la secrétaire de la clinique. Comment puis-je vous aider ?`,
  barber: (nom, ia) => `${nom}, salut ! Je suis ${ia}. Je peux te prendre un rendez-vous ?`,
};

const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

export default function NouveauCabinetClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<{ slug: string; numeroTwilio?: string | null } | null>(null);

  const [nom, setNom] = useState("");
  const [metier, setMetier] = useState("kine");
  const [ville, setVille] = useState("");
  const [adresse, setAdresse] = useState("");
  const [telephoneAffiche, setTelephoneAffiche] = useState("");
  const [couleurPrimaire, setCouleurPrimaire] = useState("#0E5E63");
  const [couleurDouce, setCouleurDouce] = useState("#F2F7F6");
  const [emailAdmin, setEmailAdmin] = useState("");

  const [praticiens, setPraticiens] = useState([{ nom: "", role: "" }]);
  const [prestations, setPrestations] = useState(TEMPLATES_PRESTATIONS.kine);
  const [faq, setFaq] = useState([{ question: "", reponse: "" }]);

  const [iaPrenom, setIaPrenom] = useState("Sofia");
  const [iaTon, setIaTon] = useState("chaleureux-pro");
  const [horairesTexte, setHorairesTexte] = useState("Lun-Ven 8h-18h");
  const [delaiMinReservationHeures, setDelaiMinReservationHeures] = useState(2);
  const [delaiAnnulationHeures, setDelaiAnnulationHeures] = useState(24);
  const [accepteNouveauxPatients, setAccepteNouveauxPatients] = useState(true);
  const [achterNumeroTwilio, setAchterNumeroTwilio] = useState(false);

  function changerMetier(nouveauMetier: string) {
    setMetier(nouveauMetier);
    setPrestations(TEMPLATES_PRESTATIONS[nouveauMetier] ?? []);
  }

  function creer() {
    setErreur(null);
    startTransition(async () => {
      const res = await creerCabinet({
        nom,
        metier,
        ville,
        adresse,
        telephoneAffiche,
        couleurPrimaire,
        couleurDouce,
        emailAdmin,
        iaPrenom,
        iaTon,
        iaMessageAccueil: MESSAGES_ACCUEIL[metier]?.(nom, iaPrenom) ?? `${nom}, bonjour ! Comment puis-je vous aider ?`,
        horairesTexte,
        praticiens,
        prestations,
        faq,
        delaiMinReservationHeures,
        delaiAnnulationHeures,
        accepteNouveauxPatients,
        achterNumeroTwilio,
      });
      if (res.error) setErreur(res.error);
      else {
        setSucces({ slug: res.slug!, numeroTwilio: res.numeroTwilio });
        router.refresh();
      }
    });
  }

  if (succes) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-3 text-lg font-semibold text-emerald-700">Cabinet créé avec succès ✅</div>
        <p className="text-sm text-slate-600">
          Site : <a href={`/${succes.slug}`} target="_blank" rel="noreferrer" className="underline">/{succes.slug}</a>
        </p>
        {succes.numeroTwilio && <p className="text-sm text-slate-600">Numéro attribué : {succes.numeroTwilio}</p>}
        <p className="mt-2 text-sm text-slate-600">Un email a été envoyé à l&apos;administrateur du cabinet pour définir son mot de passe.</p>
        <a href="/admin" className="mt-4 inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "#0E5E63" }}>
          Retour à la liste des cabinets
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {erreur && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{erreur}</div>}

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-medium text-slate-800">1. Identité</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Nom du cabinet</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} className={inputCls} placeholder="Cabinet Martin" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Métier</label>
            <select value={metier} onChange={(e) => changerMetier(e.target.value)} className={inputCls}>
              {METIERS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Ville</label>
            <input value={ville} onChange={(e) => setVille(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Adresse</label>
            <input value={adresse} onChange={(e) => setAdresse(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Téléphone affiché</label>
            <input value={telephoneAffiche} onChange={(e) => setTelephoneAffiche(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Email de l&apos;administrateur (compte de connexion)</label>
            <input value={emailAdmin} onChange={(e) => setEmailAdmin(e.target.value)} className={inputCls} type="email" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Couleur principale</label>
            <input type="color" value={couleurPrimaire} onChange={(e) => setCouleurPrimaire(e.target.value)} className="h-9 w-20 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Couleur douce</label>
            <input type="color" value={couleurDouce} onChange={(e) => setCouleurDouce(e.target.value)} className="h-9 w-20 rounded-lg border border-slate-200" />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-medium text-slate-800">2. Équipe</h2>
        <div className="space-y-2">
          {praticiens.map((p, i) => (
            <div key={i} className="flex gap-2">
              <input
                placeholder="Nom du praticien"
                value={p.nom}
                onChange={(e) => setPraticiens(praticiens.map((x, j) => (j === i ? { ...x, nom: e.target.value } : x)))}
                className={inputCls}
              />
              <input
                placeholder="Rôle"
                value={p.role}
                onChange={(e) => setPraticiens(praticiens.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))}
                className={inputCls}
              />
              <button onClick={() => setPraticiens(praticiens.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-600">✕</button>
            </div>
          ))}
          <button onClick={() => setPraticiens([...praticiens, { nom: "", role: "" }])} className="text-xs text-slate-500 hover:underline">
            + Ajouter un praticien
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 font-medium text-slate-800">3. Prestations</h2>
        <p className="mb-3 text-xs text-slate-500">Pré-remplies selon le métier — ajuste librement.</p>
        <div className="space-y-2">
          {prestations.map((p, i) => (
            <div key={i} className="flex gap-2">
              <input
                placeholder="Nom"
                value={p.nom}
                onChange={(e) => setPrestations(prestations.map((x, j) => (j === i ? { ...x, nom: e.target.value } : x)))}
                className={inputCls + " flex-1"}
              />
              <input
                type="number"
                placeholder="Durée (min)"
                value={p.dureeMinutes}
                onChange={(e) => setPrestations(prestations.map((x, j) => (j === i ? { ...x, dureeMinutes: +e.target.value } : x)))}
                className={inputCls + " w-28"}
              />
              <input
                type="number"
                placeholder="Prix (€)"
                value={p.prix}
                onChange={(e) => setPrestations(prestations.map((x, j) => (j === i ? { ...x, prix: +e.target.value } : x)))}
                className={inputCls + " w-28"}
              />
              <button onClick={() => setPrestations(prestations.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-600">✕</button>
            </div>
          ))}
          <button onClick={() => setPrestations([...prestations, { nom: "", dureeMinutes: 30, prix: 0 }])} className="text-xs text-slate-500 hover:underline">
            + Ajouter une prestation
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-medium text-slate-800">4. Secrétaire IA</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Prénom de l&apos;IA</label>
            <input value={iaPrenom} onChange={(e) => setIaPrenom(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Ton</label>
            <select value={iaTon} onChange={(e) => setIaTon(e.target.value)} className={inputCls}>
              <option value="chaleureux-pro">Chaleureux et professionnel</option>
              <option value="formel">Formel</option>
              <option value="decontracte">Décontracté</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Horaires (texte affiché)</label>
            <input value={horairesTexte} onChange={(e) => setHorairesTexte(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Délai min. de réservation (h)</label>
            <input type="number" value={delaiMinReservationHeures} onChange={(e) => setDelaiMinReservationHeures(+e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Délai d&apos;annulation gratuite (h)</label>
            <input type="number" value={delaiAnnulationHeures} onChange={(e) => setDelaiAnnulationHeures(+e.target.value)} className={inputCls} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={accepteNouveauxPatients} onChange={(e) => setAccepteNouveauxPatients(e.target.checked)} />
            Accepte les nouveaux patients
          </label>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-slate-500">FAQ de départ</label>
          <div className="space-y-2">
            {faq.map((f, i) => (
              <div key={i} className="flex gap-2">
                <input
                  placeholder="Question"
                  value={f.question}
                  onChange={(e) => setFaq(faq.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))}
                  className={inputCls}
                />
                <input
                  placeholder="Réponse"
                  value={f.reponse}
                  onChange={(e) => setFaq(faq.map((x, j) => (j === i ? { ...x, reponse: e.target.value } : x)))}
                  className={inputCls}
                />
                <button onClick={() => setFaq(faq.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-600">✕</button>
              </div>
            ))}
            <button onClick={() => setFaq([...faq, { question: "", reponse: "" }])} className="text-xs text-slate-500 hover:underline">
              + Ajouter une question
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 font-medium text-slate-800">5. Numéro de téléphone</h2>
        <p className="mb-3 text-xs text-slate-500">
          Offre Premium (site + téléphone géré par l&apos;IA) ou Site seul, sans numéro.
        </p>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={achterNumeroTwilio} onChange={(e) => setAchterNumeroTwilio(e.target.checked)} />
          Attribuer un numéro de téléphone (offre Premium)
        </label>
      </section>

      <button
        onClick={creer}
        disabled={isPending || !nom.trim() || !emailAdmin.trim()}
        className="rounded-lg px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
        style={{ background: "#0E5E63" }}
      >
        {isPending ? "Création en cours…" : "Créer le cabinet"}
      </button>
    </div>
  );
}
