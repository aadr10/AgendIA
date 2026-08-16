import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Reçoit les événements Stripe (paiement réussi/raté, abonnement créé) et met
// à jour le cabinet correspondant. Ne coupe jamais l'accès automatiquement en
// cas d'impayé — décision explicite d'Andrea, elle décide au cas par cas.
export async function POST(request: NextRequest) {
  const corps = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Non configuré." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(corps, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return NextResponse.json({ error: "Signature invalide : " + (e instanceof Error ? e.message : "erreur") }, { status: 400 });
  }

  const admin = createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const cabinetId = session.metadata?.cabinet_id;
    if (cabinetId && session.subscription) {
      await admin
        .from("cabinets")
        .update({ stripe_subscription_id: session.subscription as string, statut_abonnement: "actif" })
        .eq("id", cabinetId);
    }
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = (invoice as unknown as { subscription: string | null }).subscription;
    if (subscriptionId) {
      await admin.from("cabinets").update({ statut_abonnement: "actif" }).eq("stripe_subscription_id", subscriptionId);
    }
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = (invoice as unknown as { subscription: string | null }).subscription;
    if (subscriptionId) {
      await admin.from("cabinets").update({ statut_abonnement: "impaye" }).eq("stripe_subscription_id", subscriptionId);
    }
  }

  return NextResponse.json({ received: true });
}
