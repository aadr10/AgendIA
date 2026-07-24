"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function verifierSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL) {
    throw new Error("Accès refusé.");
  }
}

export async function basculerStatutCabinet(cabinetId: string, statut: "essai" | "actif" | "suspendu") {
  await verifierSuperAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("cabinets").update({ statut_abonnement: statut }).eq("id", cabinetId);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { error: null };
}

function slugify(nom: string) {
  return nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const COULEURS_AGENDA = ["#0E5E63", "#C4762A", "#6B4C9A", "#2E6DA4", "#A43E5C", "#3F7A4E"];

export async function creerCabinet(input: {
  nom: string;
  metier: string;
  ville: string;
  adresse: string;
  telephoneAffiche: string;
  couleurPrimaire: string;
  couleurDouce: string;
  emailAdmin: string;
  iaPrenom: string;
  iaTon: string;
  iaMessageAccueil: string;
  horairesTexte: string;
  praticiens: { nom: string; role: string }[];
  prestations: { nom: string; dureeMinutes: number; prix: number }[];
  faq: { question: string; reponse: string }[];
  delaiMinReservationHeures: number;
  delaiAnnulationHeures: number;
  accepteNouveauxPatients: boolean;
  achterNumeroTwilio: boolean;
}) {
  await verifierSuperAdmin();
  const admin = createAdminClient();

  const nom = input.nom.trim();
  if (!nom) return { error: "Le nom du cabinet est requis." };
  const emailAdmin = input.emailAdmin.trim().toLowerCase();
  if (!emailAdmin) return { error: "L'email de l'administrateur du cabinet est requis." };

  let slug = slugify(nom);
  const { data: existant } = await admin.from("cabinets").select("id").eq("slug", slug).maybeSingle();
  if (existant) slug = `${slug}-${Math.floor(Math.random() * 1000)}`;

  let numeroTwilio: string | null = null;
  if (input.achterNumeroTwilio) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return { error: "Twilio n'est pas configuré, impossible d'acheter un numéro." };
    }
    try {
      const twilio = (await import("twilio")).default;
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const disponibles = await client.availablePhoneNumbers("US").local.list({ smsEnabled: true, voiceEnabled: true, limit: 1 });
      if (disponibles.length === 0) return { error: "Aucun numéro disponible à l'achat pour le moment." };
      const achete = await client.incomingPhoneNumbers.create({ phoneNumber: disponibles[0].phoneNumber });
      numeroTwilio = achete.phoneNumber;
    } catch (e) {
      return { error: "Échec de l'achat du numéro : " + (e instanceof Error ? e.message : "erreur inconnue") };
    }
  }

  const { data: cabinet, error: eCabinet } = await admin
    .from("cabinets")
    .insert({
      slug,
      nom,
      metier: input.metier,
      ville: input.ville,
      adresse: input.adresse,
      telephone_affiche: input.telephoneAffiche,
      couleur_primaire: input.couleurPrimaire,
      couleur_douce: input.couleurDouce,
      ia_prenom: input.iaPrenom,
      ia_ton: input.iaTon,
      ia_message_accueil: input.iaMessageAccueil,
      horaires_texte: input.horairesTexte,
      numero_twilio: numeroTwilio,
      statut_abonnement: "essai",
    })
    .select("id")
    .single();
  if (eCabinet || !cabinet) return { error: "Erreur création cabinet : " + eCabinet?.message };

  await admin.from("regles").insert({
    cabinet_id: cabinet.id,
    delai_min_reservation_heures: input.delaiMinReservationHeures,
    delai_annulation_heures: input.delaiAnnulationHeures,
    accepte_nouveaux_patients: input.accepteNouveauxPatients,
  });

  const praticiensACreer = input.praticiens.filter((p) => p.nom.trim());
  const praticienIds: string[] = [];
  for (let i = 0; i < praticiensACreer.length; i++) {
    const { data: praticien } = await admin
      .from("praticiens")
      .insert({
        cabinet_id: cabinet.id,
        nom: praticiensACreer[i].nom.trim(),
        role: praticiensACreer[i].role.trim() || "Praticien",
        couleur_agenda: COULEURS_AGENDA[i % COULEURS_AGENDA.length],
        actif: true,
      })
      .select("id")
      .single();
    if (praticien) {
      praticienIds.push(praticien.id);
      const horaires = [1, 2, 3, 4, 5].map((jour) => ({
        cabinet_id: cabinet.id,
        praticien_id: praticien.id,
        jour_semaine: jour,
        heure_debut: "08:00",
        heure_fin: "18:00",
      }));
      await admin.from("horaires").insert(horaires);
    }
  }

  const prestationsACreer = input.prestations.filter((p) => p.nom.trim());
  for (const p of prestationsACreer) {
    const { data: prestation } = await admin
      .from("prestations")
      .insert({ cabinet_id: cabinet.id, nom: p.nom.trim(), duree_minutes: p.dureeMinutes, prix: p.prix, actif: true })
      .select("id")
      .single();
    if (prestation && praticienIds.length > 0) {
      await admin.from("praticien_prestations").insert(
        praticienIds.map((praticienId) => ({ cabinet_id: cabinet.id, praticien_id: praticienId, prestation_id: prestation.id }))
      );
    }
  }

  const faqACreer = input.faq.filter((f) => f.question.trim() && f.reponse.trim());
  if (faqACreer.length > 0) {
    await admin.from("faq").insert(faqACreer.map((f) => ({ cabinet_id: cabinet.id, question: f.question.trim(), reponse: f.reponse.trim() })));
  }

  const { data: authUser, error: eAuth } = await admin.auth.admin.inviteUserByEmail(emailAdmin, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/auth/set-password`,
  });
  if (eAuth || !authUser?.user) {
    return { error: null, avertissement: "Cabinet créé mais l'invitation du compte a échoué : " + eAuth?.message, slug };
  }

  await admin.from("users").insert({ id: authUser.user.id, cabinet_id: cabinet.id, email: emailAdmin, role: "admin" });

  revalidatePath("/admin");
  return { error: null, slug, numeroTwilio };
}
