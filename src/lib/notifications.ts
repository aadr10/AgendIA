import { Resend } from "resend";
import twilio from "twilio";
import { createAdminClient } from "@/lib/supabase/admin";

const resend = new Resend(process.env.RESEND_API_KEY);
const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

// Tant qu'aucun domaine n'est vérifié sur Resend, l'envoi ne fonctionne
// que vers l'adresse email du compte Resend lui-même (limite du mode test).
const EXPEDITEUR = "Secrétaire IA <onboarding@resend.dev>";

type RdvPourNotification = {
  cabinetId: string;
  cabinetNom: string;
  couleurPrimaire: string;
  iaPrenom: string;
  patientId: string;
  patientNom: string;
  patientEmail: string;
  patientTelephone?: string;
  prestationNom: string;
  praticienNom: string;
  debut: Date;
};

function formatDateHeure(d: Date) {
  const date = d.toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" });
  const heure = d.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
  return `${date} à ${heure}`;
}

async function journaliser(input: {
  cabinetId: string;
  patientId: string;
  type: "confirmation" | "rappel" | "replanification";
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
  type: "confirmation" | "rappel" | "replanification";
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

async function envoyerSms(input: {
  cabinetId: string;
  patientId: string;
  type: "confirmation" | "rappel" | "replanification";
  to: string;
  message: string;
}) {
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
    await journaliser({ cabinetId: input.cabinetId, patientId: input.patientId, type: input.type, canal: "sms", statut: "echec" });
    return { error: "Twilio n'est pas configuré." };
  }
  try {
    await twilioClient.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: input.to,
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
          Vous recevrez un rappel avant votre rendez-vous. Besoin de changer ou d'annuler ?
          Appelez le cabinet, ${rdv.iaPrenom} s'en occupe 24h/24. Annulation gratuite jusqu'à 24h avant.
        </p>
      </div>
    </div>
  `;

  const resultats = await Promise.all([
    envoyerEmail({
      cabinetId: rdv.cabinetId,
      patientId: rdv.patientId,
      type: "confirmation",
      to: rdv.patientEmail,
      subject: `Confirmation de votre rendez-vous — ${rdv.cabinetNom}`,
      html,
    }),
    rdv.patientTelephone
      ? envoyerSms({
          cabinetId: rdv.cabinetId,
          patientId: rdv.patientId,
          type: "confirmation",
          to: rdv.patientTelephone,
          message: `${rdv.cabinetNom} : RDV confirmé - ${rdv.prestationNom} le ${formatDateHeure(rdv.debut)} avec ${rdv.praticienNom}. Annulation gratuite jusqu'à 24h avant.`,
        })
      : Promise.resolve({ error: null }),
  ]);

  return { error: resultats[0].error };
}

export async function envoyerRappelRdv(rdv: RdvPourNotification) {
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
          À bientôt ! Besoin de changer ou d'annuler ? Appelez le cabinet, ${rdv.iaPrenom} s'en occupe 24h/24.
        </p>
      </div>
    </div>
  `;

  return Promise.all([
    envoyerEmail({
      cabinetId: rdv.cabinetId,
      patientId: rdv.patientId,
      type: "rappel",
      to: rdv.patientEmail,
      subject: `Rappel : rendez-vous demain — ${rdv.cabinetNom}`,
      html,
    }),
    rdv.patientTelephone
      ? envoyerSms({
          cabinetId: rdv.cabinetId,
          patientId: rdv.patientId,
          type: "rappel",
          to: rdv.patientTelephone,
          message: `${rdv.cabinetNom} : rappel de votre RDV demain ${formatDateHeure(rdv.debut)} (${rdv.prestationNom}, ${rdv.praticienNom}).`,
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
  patientEmail: string;
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
    envoyerEmail({
      cabinetId: input.cabinetId,
      patientId: input.patientId,
      type: "replanification",
      to: input.patientEmail,
      subject: `Votre rendez-vous a été déplacé — ${input.cabinetNom}`,
      html,
    }),
    input.patientTelephone
      ? envoyerSms({
          cabinetId: input.cabinetId,
          patientId: input.patientId,
          type: "replanification",
          to: input.patientTelephone,
          message: `${input.cabinetNom} : votre RDV du ${formatDateHeure(input.ancienDebut)} a été annulé (fermeture exceptionnelle). Choisissez un nouveau créneau ici : ${input.lienUrl}`,
        })
      : Promise.resolve({ error: null }),
  ]);
}
