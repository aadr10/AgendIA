import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Twilio POST ce webhook (formulaire, pas JSON) quand un Usage Trigger est
// atteint. On se contente de relayer l'alerte par email — pas de logique
// métier ici, juste un filet de sécurité pour ne jamais être prise au dépourvu
// par une facture Twilio qui grimpe sans qu'on le sache.
export async function POST(request: NextRequest) {
  const donnees = await request.formData();
  const categorie = donnees.get("UsageCategory")?.toString() ?? "inconnue";
  const valeurDeclenchee = donnees.get("TriggerValue")?.toString() ?? "?";
  const valeurActuelle = donnees.get("CurrentValue")?.toString() ?? "?";

  await resend.emails.send({
    from: "AgendIA <notifications@agendia-app.com>",
    to: "andrea.aita0305@gmail.com",
    subject: `⚠️ Alerte dépense Twilio : seuil de ${valeurDeclenchee}$ atteint`,
    html: `
      <p>Ton compte Twilio vient d'atteindre le seuil de dépense configuré.</p>
      <ul>
        <li>Catégorie : ${categorie}</li>
        <li>Seuil configuré : ${valeurDeclenchee}$</li>
        <li>Valeur actuelle : ${valeurActuelle}$</li>
      </ul>
      <p>Va vérifier ton compte Twilio pour voir ce qui se passe.</p>
    `,
  });

  return NextResponse.json({ ok: true });
}
