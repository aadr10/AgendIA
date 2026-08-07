export type MetierConfig = {
  label: string;
  couleur: string;
  patient: string;
  seance: string;
  urgence: string;
  accueil: (nomCabinet: string, iaPrenom: string) => string;
  prestations: { nom: string; dureeMinutes: number; prix: number }[];
};

const URGENCE_112 = "Pour toute urgence médicale, raccrochez et appelez le 112.";

export const METIERS: Record<string, MetierConfig> = {
  kine: {
    label: "Kinésithérapie",
    couleur: "#0E5E63",
    patient: "patient",
    seance: "séance",
    urgence: URGENCE_112,
    accueil: (nom, ia) => `${nom}, bonjour ! Je suis ${ia}, la secrétaire du cabinet. Comment puis-je vous aider ?`,
    prestations: [
      { nom: "Première séance (bilan)", dureeMinutes: 45, prix: 35 },
      { nom: "Séance de suivi", dureeMinutes: 30, prix: 28.5 },
    ],
  },
  osteo: {
    label: "Ostéopathie",
    couleur: "#6B4C9A",
    patient: "patient",
    seance: "séance",
    urgence: URGENCE_112,
    accueil: (nom, ia) => `${nom}, bonjour ! Je suis ${ia}, la secrétaire du cabinet. Comment puis-je vous aider ?`,
    prestations: [
      { nom: "Consultation adulte", dureeMinutes: 45, prix: 60 },
      { nom: "Consultation enfant", dureeMinutes: 30, prix: 50 },
    ],
  },
  dentiste: {
    label: "Dentisterie",
    couleur: "#2E6DA4",
    patient: "patient",
    seance: "consultation",
    urgence: "Pour toute urgence dentaire ou médicale, appelez le 112.",
    accueil: (nom, ia) => `${nom}, bonjour ! Je suis ${ia}, la secrétaire du cabinet dentaire. Comment puis-je vous aider ?`,
    prestations: [
      { nom: "Consultation", dureeMinutes: 30, prix: 45 },
      { nom: "Détartrage", dureeMinutes: 30, prix: 40 },
    ],
  },
  medecin: {
    label: "Médecine générale",
    couleur: "#1B6E8C",
    patient: "patient",
    seance: "consultation",
    urgence: URGENCE_112,
    accueil: (nom, ia) => `${nom}, bonjour ! Je suis ${ia}, la secrétaire du cabinet médical. Comment puis-je vous aider ?`,
    prestations: [
      { nom: "Consultation", dureeMinutes: 20, prix: 30 },
      { nom: "Consultation longue", dureeMinutes: 40, prix: 50 },
    ],
  },
  esthetique: {
    label: "Institut de beauté / Esthétique",
    couleur: "#B8628F",
    patient: "client",
    seance: "soin",
    urgence: "",
    accueil: (nom, ia) => `${nom}, bonjour ! Je suis ${ia}. Comment puis-je vous aider ?`,
    prestations: [
      { nom: "Soin du visage", dureeMinutes: 45, prix: 55 },
      { nom: "Épilation", dureeMinutes: 30, prix: 35 },
    ],
  },
  coiffeur: {
    label: "Coiffure",
    couleur: "#C4762A",
    patient: "client",
    seance: "rendez-vous",
    urgence: "",
    accueil: (nom, ia) => `${nom}, bonjour ! Je suis ${ia}. Comment puis-je vous aider ?`,
    prestations: [
      { nom: "Coupe", dureeMinutes: 30, prix: 30 },
      { nom: "Coupe + couleur", dureeMinutes: 90, prix: 75 },
    ],
  },
  barber: {
    label: "Barbier",
    couleur: "#8A5A2E",
    patient: "client",
    seance: "rendez-vous",
    urgence: "",
    accueil: (nom, ia) => `${nom}, salut ! Je suis ${ia}. Je peux te prendre un rendez-vous ?`,
    prestations: [
      { nom: "Coupe", dureeMinutes: 30, prix: 25 },
      { nom: "Coupe + barbe", dureeMinutes: 45, prix: 38 },
    ],
  },
  veto: {
    label: "Vétérinaire",
    couleur: "#3F7A4E",
    patient: "propriétaire",
    seance: "consultation",
    urgence: "Pour toute urgence vétérinaire, contactez la clinique vétérinaire de garde.",
    accueil: (nom, ia) => `${nom}, bonjour ! Je suis ${ia}, la secrétaire de la clinique. Comment puis-je vous aider ?`,
    prestations: [
      { nom: "Consultation générale", dureeMinutes: 30, prix: 45 },
      { nom: "Vaccination", dureeMinutes: 20, prix: 38 },
    ],
  },
  psychologue: {
    label: "Psychologie",
    couleur: "#7A4EA0",
    patient: "patient",
    seance: "séance",
    urgence: "S'il s'agit d'une urgence ou d'une détresse immédiate, appelez le 112 ou les Centres de Prévention du Suicide (0800 32 123).",
    accueil: (nom, ia) => `${nom}, bonjour ! Je suis ${ia}, la secrétaire du cabinet. Comment puis-je vous aider ?`,
    prestations: [{ nom: "Séance", dureeMinutes: 50, prix: 60 }],
  },
  podologue: {
    label: "Podologie",
    couleur: "#4A8B7C",
    patient: "patient",
    seance: "consultation",
    urgence: URGENCE_112,
    accueil: (nom, ia) => `${nom}, bonjour ! Je suis ${ia}, la secrétaire du cabinet. Comment puis-je vous aider ?`,
    prestations: [
      { nom: "Consultation", dureeMinutes: 30, prix: 40 },
      { nom: "Soin des ongles", dureeMinutes: 30, prix: 35 },
    ],
  },
  coach: {
    label: "Coaching sportif",
    couleur: "#A4453E",
    patient: "client",
    seance: "séance",
    urgence: "",
    accueil: (nom, ia) => `${nom}, salut ! Je suis ${ia}. Comment puis-je t'aider ?`,
    prestations: [
      { nom: "Séance individuelle", dureeMinutes: 60, prix: 50 },
      { nom: "Bilan initial", dureeMinutes: 45, prix: 40 },
    ],
  },
  garage: {
    label: "Garage automobile",
    couleur: "#52616B",
    patient: "client",
    seance: "rendez-vous",
    urgence: "",
    accueil: (nom, ia) => `${nom}, bonjour ! Je suis ${ia}. Comment puis-je vous aider ?`,
    prestations: [
      { nom: "Révision", dureeMinutes: 60, prix: 90 },
      { nom: "Contrôle rapide", dureeMinutes: 30, prix: 35 },
    ],
  },
  architecte: {
    label: "Architecture",
    couleur: "#3B5A73",
    patient: "client",
    seance: "rendez-vous",
    urgence: "",
    accueil: (nom, ia) => `${nom}, bonjour ! Je suis ${ia}. Comment puis-je vous aider ?`,
    prestations: [
      { nom: "Consultation initiale", dureeMinutes: 60, prix: 90 },
      { nom: "Rendez-vous de suivi de projet", dureeMinutes: 45, prix: 60 },
    ],
  },
};

export const METIER_DEFAUT = "kine";

export const METIER_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(METIERS).map(([cle, config]) => [cle, config.label])
);

export function metierConfig(metier: string): MetierConfig {
  return METIERS[metier] ?? METIERS[METIER_DEFAUT];
}
