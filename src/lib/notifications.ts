import { Resend } from "resend";
import twilio from "twilio";
import { createAdminClient } from "@/lib/supabase/admin";

const resend = new Resend(process.env.RESEND_API_KEY);
const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

const EXPEDITEUR = "AgendIA <notifications@agendia-app.com>";

type RdvPourNotification = {
  cabinetId: string;
  cabinetSlug: string;
  rdvId: string;
  cabinetNom: string;
  couleurPrimaire: string;
  iaPrenom: string;
  patientId: string;
  patientNom: string;
  patientEmail?: string;
  patientTelephone?: string;
  prestationNom: string;
  praticienNom: string;
  debut: Date;
};

// Lien court (/a/{id} redirige vers /{slug}/annuler/{id}) : garde le SMS sous
// 160 caractères même avec un nom de cabinet long, pour rester à 1 seul
// segment facturé au lieu de 2.
function lienAnnulation(rdv: Pick<RdvPourNotification, "rdvId">) {
  return `${process.env.NEXT_PUBLIC_APP_URL}/a/${rdv.rdvId}`;
}

function normaliserTelephoneBE(numero: string): string {
  const nettoye = numero.replace(/[\s.\-()]/g, "");
  if (nettoye.startsWith("+")) return nettoye;
  if (nettoye.startsWith("0032")) return "+32" + nettoye.slice(4);
  if (nettoye.startsWith("00")) return "+" + nettoye.slice(2);
  if (nettoye.startsWith("0")) return "+32" + nettoye.slice(1);
  return nettoye;
}

function formatDateHeure(d: Date) {
  const date = d.toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" });
  const heure = d.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
  return `${date} à ${heure}`;
}

// Format court, sans accent, pour les SMS : reste dans l'alphabet GSM-7 (160
// caractères par SMS) au lieu de basculer en Unicode (70 caractères) à cause
// d'un accent, et limite le nombre de caractères facturés.
function formatDateHeureSms(d: Date) {
  const jour = d.toLocaleDateString("fr-BE", { day: "2-digit", month: "2-digit" });
  const heure = d.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
  return `${jour} ${heure}`;
}

// Un seul caractère accentué dans le SMS fait basculer tout le message en
// UCS-2 (70 caractères/segment au lieu de 160), doublant le coût Twilio même
// pour un message court. On désaccentue les textes dynamiques (nom de cabinet)
// pour garantir un SMS à 1 segment quel que soit le nom du client.
function versGsm7(texte: string): string {
  return texte.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

async function journaliser(input: {
  cabinetId: string;
  patientId: string;
  type: "confirmation" | "rappel" | "replanification" | "avis";
  canal: "email" | "sms";
  statut: "envoye" | "echec";
}) {
  const admin = createAdminClient();
  await admin.from("notifications").insert({
    cabinet_id: input.cabinetId,
    patient_id: input.patientId,
    type: input.type,
    canal: input.canal,
    statut: input.statut,
    envoye_le: new Date().toISOString(),
  });
}

async function envoyerEmail(input: {
  cabinetId: string;
  patientId: string;
  type: "confirmation" | "rappel" | "replanification" | "avis";
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const { error } = await resend.emails.send({
      from: EXPEDITEUR,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    await journaliser({ cabinetId: input.cabinetId, patientId: input.patientId, type: input.type, canal: "email", statut: error ? "echec" : "envoye" });
    return { error: error ? error.message : null };
  } catch (e) {
    await journaliser({ cabinetId: input.cabinetId, patientId: input.patientId, type: input.type, canal: "email", statut: "echec" });
    return { error: e instanceof Error ? e.message : "Erreur d'envoi email" };
  }
}

async function forfaitSmsDepasse(cabinetId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data: cabinet } = await admin.from("cabinets").select("sms_forfait_mensuel").eq("id", cabinetId).single();
  const forfait = cabinet?.sms_forfait_mensuel ?? 250;

  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);

  const { count } = await admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("cabinet_id", cabinetId)
    .eq("canal", "sms")
    .eq("statut", "envoye")
    .gte("envoye_le", debutMois.toISOString());

  return (count ?? 0) >= forfait;
}

async function envoyerSms(input: {
  cabinetId: string;
  patientId: string;
  type: "confirmation" | "rappel" | "replanification" | "avis";
  to: string;
  message: string;
}) {
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
    await journaliser({ cabinetId: input.cabinetId, patientId: input.patientId, type: input.type, canal: "sms", statut: "echec" });
    return { error: "Twilio n'est pas configuré." };
  }
  // Forfait SMS mensuel du cabinet atteint : on ne dépasse jamais son inclus
  // (protège la marge, pas de frais Twilio en plus de ce qui a été facturé au client).
  if (await forfaitSmsDepasse(input.cabinetId)) {
    return { error: null, forfaitDepasse: true };
  }
  try {
    await twilioClient.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: normaliserTelephoneBE(input.to),
      body: input.message,
    });
    await journaliser({ cabinetId: input.cabinetId, patientId: input.patientId, type: input.type, canal: "sms", statut: "envoye" });
    return { error: null };
  } catch (e) {
    await journaliser({ cabinetId: input.cabinetId, patientId: input.patientId, type: input.type, canal: "sms", statut: "echec" });
    return { error: e instanceof Error ? e.message : "Erreur d'envoi SMS" };
  }
}

export async function envoyerConfirmationRdv(rdv: RdvPourNotification) {
  const lien = lienAnnulation(rdv);
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background:${rdv.couleurPrimaire}; color:#fff; padding:20px; border-radius:12px 12px 0 0;">
        <h1 style="margin:0; font-size:18px;">${rdv.cabinetNom}</h1>
      </div>
      <div style="border:1px solid #E2E8F0; border-top:none; padding:24px; border-radius:0 0 12px 12px;">
        <p>Bonjour ${rdv.patientNom.split(" ")[0]},</p>
        <p>Votre rendez-vous est <strong>confirmé</strong> :</p>
        <div style="background:#F7F9F8; border-radius:8px; padding:16px; margin:16px 0;">
          <p style="margin:0 0 4px;"><strong>${rdv.prestationNom}</strong></p>
          <p style="margin:0 0 4px;">${formatDateHeure(rdv.debut)}</p>
          <p style="margin:0;">Avec ${rdv.praticienNom}</p>
        </div>
        <p style="font-size:13px; color:#64748B;">
          Vous recevrez un rappel par SMS avant votre rendez-vous. Besoin de changer ? Appelez le cabinet,
          ${rdv.iaPrenom} s'en occupe 24h/24. Annulation gratuite jusqu'à 24h avant —
          <a href="${lien}" style="color:${rdv.couleurPrimaire};">annuler en un clic</a>.
        </p>
      </div>
    </div>
  `;

  // Pas de SMS de confirmation : le patient voit déjà la confirmation à l'écran juste après
  // sa réservation, et reçoit un email. Seul le rappel SMS la veille (envoyerRappelRdv) est envoyé,
  // pour éviter un coût Twilio inutile sur chaque réservation.
  const resultat = rdv.patientEmail
    ? await envoyerEmail({
        cabinetId: rdv.cabinetId,
        patientId: rdv.patientId,
        type: "confirmation",
        to: rdv.patientEmail,
        subject: `Confirmation de votre rendez-vous — ${rdv.cabinetNom}`,
        html,
      })
    : { error: null };

  return { error: resultat.error };
}

export async function envoyerRappelRdv(rdv: RdvPourNotification) {
  const lien = lienAnnulation(rdv);
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background:${rdv.couleurPrimaire}; color:#fff; padding:20px; border-radius:12px 12px 0 0;">
        <h1 style="margin:0; font-size:18px;">${rdv.cabinetNom}</h1>
      </div>
      <div style="border:1px solid #E2E8F0; border-top:none; padding:24px; border-radius:0 0 12px 12px;">
        <p>Bonjour ${rdv.patientNom.split(" ")[0]},</p>
        <p>Petit rappel : vous avez rendez-vous <strong>demain</strong> :</p>
        <div style="background:#F7F9F8; border-radius:8px; padding:16px; margin:16px 0;">
          <p style="margin:0 0 4px;"><strong>${rdv.prestationNom}</strong></p>
          <p style="margin:0 0 4px;">${formatDateHeure(rdv.debut)}</p>
          <p style="margin:0;">Avec ${rdv.praticienNom}</p>
        </div>
        <p style="font-size:13px; color:#64748B;">
          À bientôt ! Besoin de changer ? Appelez le cabinet, ${rdv.iaPrenom} s'en occupe 24h/24, ou
          <a href="${lien}" style="color:${rdv.couleurPrimaire};">annulez en un clic</a>.
        </p>
      </div>
    </div>
  `;

  return Promise.all([
    rdv.patientEmail
      ? envoyerEmail({
          cabinetId: rdv.cabinetId,
          patientId: rdv.patientId,
          type: "rappel",
          to: rdv.patientEmail,
          subject: `Rappel : rendez-vous demain — ${rdv.cabinetNom}`,
          html,
        })
      : Promise.resolve({ error: null }),
    rdv.patientTelephone && !rdv.patientEmail
      ? envoyerSms({
          cabinetId: rdv.cabinetId,
          patientId: rdv.patientId,
          type: "rappel",
          to: rdv.patientTelephone,
          message: `${versGsm7(rdv.cabinetNom)}: RDV demain ${formatDateHeureSms(rdv.debut)}. Annuler: ${lien}`,
        })
      : Promise.resolve({ error: null }),
  ]);
}

export async function envoyerLienReplanification(input: {
  cabinetId: string;
  cabinetNom: string;
  couleurPrimaire: string;
  patientId: string;
  patientNom: string;
  patientEmail?: string;
  patientTelephone?: string;
  prestationNom: string;
  ancienDebut: Date;
  lienUrl: string;
}) {
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background:${input.couleurPrimaire}; color:#fff; padding:20px; border-radius:12px 12px 0 0;">
        <h1 style="margin:0; font-size:18px;">${input.cabinetNom}</h1>
      </div>
      <div style="border:1px solid #E2E8F0; border-top:none; padding:24px; border-radius:0 0 12px 12px;">
        <p>Bonjour ${input.patientNom.split(" ")[0]},</p>
        <p>
          Votre rendez-vous du <strong>${formatDateHeure(input.ancienDebut)}</strong> (${input.prestationNom})
          a dû être annulé suite à une fermeture exceptionnelle du cabinet. Toutes nos excuses pour la gêne occasionnée.
        </p>
        <p>Choisissez vous-même un nouveau créneau, ça prend 30 secondes :</p>
        <p style="text-align:center; margin:24px 0;">
          <a href="${input.lienUrl}" style="background:${input.couleurPrimaire}; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600;">
            Choisir un nouveau créneau
          </a>
        </p>
      </div>
    </div>
  `;

  return Promise.all([
    input.patientEmail
      ? envoyerEmail({
          cabinetId: input.cabinetId,
          patientId: input.patientId,
          type: "replanification",
          to: input.patientEmail,
          subject: `Votre rendez-vous a été déplacé — ${input.cabinetNom}`,
          html,
        })
      : Promise.resolve({ error: null }),
    input.patientTelephone && !input.patientEmail
      ? envoyerSms({
          cabinetId: input.cabinetId,
          patientId: input.patientId,
          type: "replanification",
          to: input.patientTelephone,
          message: `${versGsm7(input.cabinetNom)}: votre RDV du ${formatDateHeureSms(input.ancienDebut)} est annule. Nouveau creneau: ${input.lienUrl}`,
        })
      : Promise.resolve({ error: null }),
  ]);
}

export async function envoyerDemandeAvis(input: {
  cabinetId: string;
  cabinetNom: string;
  couleurPrimaire: string;
  lienAvisGoogle: string;
  patientId: string;
  patientNom: string;
  patientEmail: string;
}) {
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background:${input.couleurPrimaire}; color:#fff; padding:20px; border-radius:12px 12px 0 0;">
        <h1 style="margin:0; font-size:18px;">${input.cabinetNom}</h1>
      </div>
      <div style="border:1px solid #E2E8F0; border-top:none; padding:24px; border-radius:0 0 12px 12px;">
        <p>Bonjour ${input.patientNom.split(" ")[0]},</p>
        <p>Merci pour votre visite chez ${input.cabinetNom} ! Si vous êtes satisfait(e), un petit avis nous aiderait énormément :</p>
        <p style="text-align:center; margin:24px 0;">
          <a href="${input.lienAvisGoogle}" style="background:${input.couleurPrimaire}; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600;">
            Laisser un avis Google
          </a>
        </p>
        <p style="font-size:13px; color:#64748B;">Ça prend 30 secondes et ça compte beaucoup pour nous. Merci !</p>
      </div>
    </div>
  `;

  return envoyerEmail({
    cabinetId: input.cabinetId,
    patientId: input.patientId,
    type: "avis",
    to: input.patientEmail,
    subject: `Merci pour votre visite — ${input.cabinetNom}`,
    html,
  });
}
