"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { genererQrSvg } from "@/lib/qrcode";

const COOKIE_VUE_ADMIN = "admin_vue_cabinet_id";

export async function qrCodeCabinet(slug: string) {
  await verifierSuperAdmin();
  const lien = `${process.env.NEXT_PUBLIC_APP_URL}/${slug}`;
  const svg = await genererQrSvg(lien);
  return { svg, lien };
}

// Permet au super-admin de consulter le dashboard d'un cabinet exactement
// comme le praticien le voit, sans connaître son mot de passe — pose un
// cookie lu par getSessionContext(), qu'on quitte via quitterVueDashboard().
export async function voirDashboardCabinet(cabinetId: string) {
  await verifierSuperAdmin();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_VUE_ADMIN, cabinetId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60,
    path: "/",
  });
  redirect("/dashboard");
}

export async function quitterVueDashboard() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_VUE_ADMIN);
  redirect("/admin");
}

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

export async function majCabinetAdmin(
  cabinetId: string,
  input: {
    nom: string;
    adresse: string;
    ville: string;
    telephoneAffiche: string;
    horairesTexte: string;
    couleurPrimaire: string;
    couleurDouce: string;
    lienAvisGoogle: string;
    iaPrenom: string;
    iaTon: string;
    smsRappelActif: boolean;
    smsForfaitMensuel: number;
  }
) {
  await verifierSuperAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("cabinets")
    .update({
      nom: input.nom,
      adresse: input.adresse,
      ville: input.ville,
      telephone_affiche: input.telephoneAffiche,
      horaires_texte: input.horairesTexte,
      couleur_primaire: input.couleurPrimaire,
      couleur_douce: input.couleurDouce,
      lien_avis_google: input.lienAvisGoogle.trim() || null,
      ia_prenom: input.iaPrenom,
      ia_ton: input.iaTon,
      sms_rappel_actif: input.smsRappelActif,
      sms_forfait_mensuel: input.smsForfaitMensuel,
    })
    .eq("id", cabinetId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/cabinets/${cabinetId}`);
  revalidatePath("/[slug]");
  return { error: null };
}

const CHAMP_VERS_COLONNE_ADMIN = { logo: "logo_url", photo: "photo_hero_url" } as const;

export async function uploaderImageCabinetAdmin(cabinetId: string, formData: FormData) {
  await verifierSuperAdmin();
  const admin = createAdminClient();

  const type = formData.get("type") as "logo" | "photo";
  const fichier = formData.get("fichier") as File | null;
  if (!fichier || fichier.size === 0) return { error: "Aucun fichier reçu." };
  if (!fichier.type.startsWith("image/")) return { error: "Le fichier doit être une image." };
  if (fichier.size > 5 * 1024 * 1024) return { error: "L'image dépasse la taille maximale (5 Mo)." };

  const colonne = CHAMP_VERS_COLONNE_ADMIN[type];
  if (!colonne) return { error: "Type d'image inconnu." };

  const ext = fichier.name.split(".").pop() || "jpg";
  const chemin = `${cabinetId}/${type}-${Date.now()}.${ext}`;

  const { error: eUpload } = await admin.storage
    .from("cabinet-media")
    .upload(chemin, fichier, { contentType: fichier.type, upsert: true });
  if (eUpload) return { error: "Échec de l'envoi : " + eUpload.message };

  const { data: pub } = admin.storage.from("cabinet-media").getPublicUrl(chemin);

  const { error: eUpdate } = await admin.from("cabinets").update({ [colonne]: pub.publicUrl }).eq("id", cabinetId);
  if (eUpdate) return { error: eUpdate.message };

  revalidatePath(`/admin/cabinets/${cabinetId}`);
  revalidatePath("/[slug]");
  return { error: null, url: pub.publicUrl };
}

export async function retirerImageCabinetAdmin(cabinetId: string, type: "logo" | "photo") {
  await verifierSuperAdmin();
  const admin = createAdminClient();
  const colonne = CHAMP_VERS_COLONNE_ADMIN[type];
  const { error } = await admin.from("cabinets").update({ [colonne]: null }).eq("id", cabinetId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/cabinets/${cabinetId}`);
  revalidatePath("/[slug]");
  return { error: null };
}

export async function uploaderPhotoPraticienAdmin(cabinetId: string, praticienId: string, formData: FormData) {
  await verifierSuperAdmin();
  const admin = createAdminClient();

  const fichier = formData.get("fichier") as File | null;
  if (!fichier || fichier.size === 0) return { error: "Aucun fichier reçu." };
  if (!fichier.type.startsWith("image/")) return { error: "Le fichier doit être une image." };
  if (fichier.size > 5 * 1024 * 1024) return { error: "L'image dépasse la taille maximale (5 Mo)." };

  const ext = fichier.name.split(".").pop() || "jpg";
  const chemin = `${cabinetId}/praticien-${praticienId}-${Date.now()}.${ext}`;

  const { error: eUpload } = await admin.storage
    .from("cabinet-media")
    .upload(chemin, fichier, { contentType: fichier.type, upsert: true });
  if (eUpload) return { error: "Échec de l'envoi : " + eUpload.message };

  const { data: pub } = admin.storage.from("cabinet-media").getPublicUrl(chemin);

  const { error: eUpdate } = await admin.from("praticiens").update({ photo_url: pub.publicUrl }).eq("id", praticienId);
  if (eUpdate) return { error: eUpdate.message };

  revalidatePath(`/admin/cabinets/${cabinetId}`);
  revalidatePath("/[slug]");
  return { error: null, url: pub.publicUrl };
}

export async function retirerPhotoPraticienAdmin(cabinetId: string, praticienId: string) {
  await verifierSuperAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("praticiens").update({ photo_url: null }).eq("id", praticienId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/cabinets/${cabinetId}`);
  revalidatePath("/[slug]");
  return { error: null };
}

export async function basculerStatutDemande(demandeId: string, statut: "nouveau" | "contacte" | "traite") {
  await verifierSuperAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("demandes_demo").update({ statut }).eq("id", demandeId);
  if (error) return { error: error.message };
  revalidatePath("/admin/demandes");
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
  lienAvisGoogle: string;
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
  smsForfaitMensuel: number;
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
    if (!process.env.VAPI_API_KEY || !process.env.VAPI_WEBHOOK_SECRET || !process.env.NEXT_PUBLIC_APP_URL) {
      return { error: "Vapi n'est pas configuré, impossible d'activer la voix sur un nouveau numéro." };
    }
    try {
      const twilio = (await import("twilio")).default;
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      // Twilio ne propose pas de numéros fixes belges en achat libre-service,
      // seulement des mobiles (+32 4xx) — parfait ici : ça sonne comme un vrai
      // numéro belge pour le patient (pas de surcoût international, pas de
      // méfiance liée à un indicatif étranger).
      const disponibles = await client.availablePhoneNumbers("BE").mobile.list({ smsEnabled: true, voiceEnabled: true, limit: 1 });
      if (disponibles.length === 0) return { error: "Aucun numéro belge disponible à l'achat pour le moment." };
      const achete = await client.incomingPhoneNumbers.create({
        phoneNumber: disponibles[0].phoneNumber,
        // Vapi enregistre normalement ce webhook lui-même à l'import, mais on le
        // fixe aussi ici en filet de sécurité : sans lui, le numéro sonne dans le
        // vide côté Twilio même si tout le reste est correct.
        voiceUrl: "https://api.vapi.ai/twilio/inbound_call",
        voiceMethod: "POST",
      });
      numeroTwilio = achete.phoneNumber;

      const resVapi = await fetch("https://api.vapi.ai/phone-number", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "twilio",
          number: numeroTwilio,
          twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
          twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
          name: `${nom} (auto)`,
          server: { url: `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/webhook`, secret: process.env.VAPI_WEBHOOK_SECRET },
        }),
      });
      if (!resVapi.ok) {
        const detail = await resVapi.text();
        return {
          error: null,
          avertissement: `Numéro Twilio acheté (${numeroTwilio}) mais l'enregistrement chez Vapi a échoué — la voix ne fonctionnera pas tant que ce n'est pas corrigé. Détail : ${detail}`,
        };
      }
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
      lien_avis_google: input.lienAvisGoogle.trim() || null,
      numero_twilio: numeroTwilio,
      statut_abonnement: "essai",
      sms_forfait_mensuel: input.smsForfaitMensuel,
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

  // Supabase renvoie parfois une erreur transitoire de vérification de clé JWT
  // sur cet appel précis (souci ponctuel côté plateforme) — on retente avant d'abandonner.
  // On utilise generateLink (pas inviteUserByEmail) pour récupérer le lien directement :
  // ça évite de dépendre de la délivrabilité de l'email Supabase, le lien peut être
  // partagé à la main (WhatsApp, SMS...) juste après la création du cabinet.
  let derniereErreur: string | undefined;
  let userId: string | null = null;
  let lienEspacePraticien: string | null = null;
  for (let tentative = 0; tentative < 3 && !userId; tentative++) {
    const { data: lienData, error: eAuth } = await admin.auth.admin.generateLink({
      type: "invite",
      email: emailAdmin,
      options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/auth/set-password` },
    });
    if (!eAuth && lienData?.user) {
      userId = lienData.user.id;
      lienEspacePraticien = lienData.properties.action_link;
    } else {
      derniereErreur = eAuth?.message;
      await new Promise((r) => setTimeout(r, 800));
    }
  }
  if (!userId) {
    return { error: null, avertissement: "Cabinet créé mais l'invitation du compte a échoué : " + derniereErreur, slug };
  }

  await admin.from("users").insert({ id: userId, cabinet_id: cabinet.id, email: emailAdmin, role: "admin" });

  revalidatePath("/admin");
  return { error: null, slug, cabinetId: cabinet.id, numeroTwilio, lienEspacePraticien };
}
