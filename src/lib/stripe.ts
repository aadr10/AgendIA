import Stripe from "stripe";
import type { Offre } from "./offres";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Un prix Stripe récurrent par (offre, palier SMS) — créés une fois en mode
// test le 2026-08-16, correspondance stricte avec src/lib/offres.ts. Si les
// prix de offres.ts changent, il faut créer de nouveaux prix Stripe (jamais
// modifier un prix existant : Stripe les rend immuables une fois créés) et
// mettre à jour cette table.
const STRIPE_PRICE_ID: Record<string, string> = {
  site_0: "price_1U5AasPhQnQH4QR16VKWhb6M",
  site_250: "price_1U5AatPhQnQH4QR1mKyam048",
  site_500: "price_1U5AatPhQnQH4QR18rZRkDsB",
  site_1000: "price_1U5AatPhQnQH4QR1ugh2dlcF",
  premium_250: "price_1U5AauPhQnQH4QR1WdLTS3WE",
  premium_500: "price_1U5AauPhQnQH4QR1ZJDQYRjx",
  premium_1000: "price_1U5AavPhQnQH4QR1eraOCXOk",
};

export function stripePriceId(offre: Offre, sms: number): string | undefined {
  return STRIPE_PRICE_ID[`${offre}_${sms}`];
}

// Prochain 1er du mois à minuit (Europe/Brussels, via process.env.TZ fixé
// dans instrumentation.ts) — tous les abonnements sont calés dessus, quelle
// que soit la date réelle d'inscription du client (décision explicite
// d'Andrea : facturation uniforme le 1er pour tout le monde).
export function prochainPremierDuMoisUnix(): number {
  const maintenant = new Date();
  const premierDuMoisProchain = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 1, 0, 0, 0);
  return Math.floor(premierDuMoisProchain.getTime() / 1000);
}
