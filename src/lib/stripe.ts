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

// Crée le client + la session de paiement Stripe pour un cabinet — utilisé à
// la création du cabinet (si la case est cochée) et depuis sa fiche admin
// (pour un cabinet créé sans Stripe au départ, activé plus tard). Renvoie
// `null` si Stripe n'est pas configuré ou si le prix n'existe pas pour ce
// couple offre/palier — ne jette jamais, un souci ici ne doit jamais bloquer
// le reste (création ou consultation du cabinet).
export async function creerLienPaiementCabinet(input: {
  cabinetId: string;
  cabinetNom: string;
  emailClient: string;
  offre: Offre;
  smsForfaitMensuel: number;
}): Promise<{ lienPaiement: string; stripeCustomerId: string; stripePriceId: string } | null> {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  const prixId = stripePriceId(input.offre, input.smsForfaitMensuel);
  if (!prixId) return null;

  try {
    const client = await stripe.customers.create({ email: input.emailClient, name: input.cabinetNom });
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: client.id,
      line_items: [{ price: prixId, quantity: 1 }],
      payment_method_types: ["card", "sepa_debit"],
      subscription_data: {
        billing_cycle_anchor: prochainPremierDuMoisUnix(),
        proration_behavior: "create_prorations",
        metadata: { cabinet_id: input.cabinetId },
      },
      metadata: { cabinet_id: input.cabinetId },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/cabinets/${input.cabinetId}?paiement=ok`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/cabinets/${input.cabinetId}?paiement=annule`,
    });
    if (!session.url) return null;
    return { lienPaiement: session.url, stripeCustomerId: client.id, stripePriceId: prixId };
  } catch (e) {
    console.error("Échec création lien de paiement Stripe :", e);
    return null;
  }
}
