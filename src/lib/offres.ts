// Source unique de la grille tarifaire — toute l'UI (admin, formulaires) doit
// lire ces valeurs plutôt que recopier des prix en dur, pour éviter qu'un
// changement de prix soit oublié à un endroit (déjà arrivé une fois).

export type Offre = "site" | "premium";

export const OFFRE_LABEL: Record<Offre, string> = {
  site: "Site + Chatbot",
  premium: "Premium",
};

export const OFFRE_BADGE: Record<Offre, { bg: string; fg: string; label: string }> = {
  site: { bg: "#FCE3E1", fg: "#B42318", label: "Site seul" },
  premium: { bg: "#DCE9FB", fg: "#1D4ED8", label: "★ Premium" },
};

export const OFFRE_DESCRIPTION: Record<Offre, string> = {
  site: "Site de réservation + chatbot IA, pas de numéro de téléphone.",
  premium: "Numéro dédié : l'IA répond toujours en premier et gère toute la réservation elle-même.",
};

// Certaines offres n'ont pas tous les paliers (ex: "site" a un palier 0 SMS
// que l'offre avec téléphone n'a pas).
export const PALIERS_SMS: Record<Offre, { sms: number; prix: number }[]> = {
  site: [
    { sms: 0, prix: 64.99 },
    { sms: 250, prix: 94.99 },
    { sms: 500, prix: 119.99 },
    { sms: 1000, prix: 174.99 },
  ],
  premium: [
    { sms: 250, prix: 219.99 },
    { sms: 500, prix: 249.99 },
    { sms: 1000, prix: 299.99 },
  ],
};

export function prixOffre(offre: Offre, sms: number): number | undefined {
  return PALIERS_SMS[offre].find((p) => p.sms === sms)?.prix;
}

// L'offre "site" n'achète jamais de numéro Twilio ; les deux autres en achètent un.
export function offreNecessiteNumero(offre: Offre): boolean {
  return offre !== "site";
}
