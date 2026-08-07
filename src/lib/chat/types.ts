export type CabinetContexteChat = {
  id: string;
  slug: string;
  nom: string;
  couleurPrimaire: string;
  metier: string;
  ville: string;
  adresse: string;
  telephoneAffiche: string;
  horairesTexte: string;
  iaPrenom: string;
  iaTon: string;
  iaMessageAccueil: string;
};

export type ReglesContexteChat = {
  delaiMinReservationHeures: number;
  delaiAnnulationHeures: number;
  accepteNouveauxPatients: boolean;
  transfertHumainNumero: string | null;
};

export type PrestationContexteChat = {
  id: string;
  nom: string;
  dureeMinutes: number;
  prix: number;
};

export type PraticienContexteChat = {
  id: string;
  nom: string;
};

export type FaqContexteChat = { question: string; reponse: string };

export type ContexteChat = {
  cabinet: CabinetContexteChat;
  regles: ReglesContexteChat;
  prestations: PrestationContexteChat[];
  praticiens: PraticienContexteChat[];
  liaisons: { praticien_id: string; prestation_id: string }[];
  faq: FaqContexteChat[];
};

export type ChatMessage = { role: "user" | "assistant"; content: string };
