"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/lib/cabinet";
import { createAdminClient } from "@/lib/supabase/admin";

// Champs volontairement exclus de cette page (réservés à la plateforme,
// jamais modifiables par un praticien) : slug, numero_twilio,
// statut_abonnement, minutes_incluses, minutes_consommees.

export async function majApparence(input: {
  nom: string;
  adresse: string;
  ville: string;
  telephoneAffiche: string;
  horairesTexte: string;
  couleurPrimaire: string;
  couleurDouce: string;
}) {
  const { supabase, cabinet } = await getSessionContext();
  const { error } = await supabase
    .from("cabinets")
    .update({
      nom: input.nom,
      adresse: input.adresse,
      ville: input.ville,
      telephone_affiche: input.telephoneAffiche,
      horaires_texte: input.horairesTexte,
      couleur_primaire: input.couleurPrimaire,
      couleur_douce: input.couleurDouce,
    })
    .eq("id", cabinet.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/site-internet");
  revalidatePath("/[slug]");
  return { error: null };
}

const CHAMP_VERS_COLONNE = {
  logo: "logo_url",
  photo: "photo_hero_url",
} as const;

export async function uploaderImage(formData: FormData) {
  const { supabase, cabinet } = await getSessionContext();

  const type = formData.get("type") as "logo" | "photo";
  const fichier = formData.get("fichier") as File | null;
  if (!fichier || fichier.size === 0) return { error: "Aucun fichier reçu." };
  if (!fichier.type.startsWith("image/")) return { error: "Le fichier doit être une image." };

  const colonne = CHAMP_VERS_COLONNE[type];
  if (!colonne) return { error: "Type d'image inconnu." };

  const ext = fichier.name.split(".").pop() || "jpg";
  const chemin = `${cabinet.id}/${type}-${Date.now()}.${ext}`;

  const admin = createAdminClient();
  const { error: eUpload } = await admin.storage
    .from("cabinet-media")
    .upload(chemin, fichier, { contentType: fichier.type, upsert: true });
  if (eUpload) return { error: "Échec de l'envoi : " + eUpload.message };

  const { data: pub } = admin.storage.from("cabinet-media").getPublicUrl(chemin);

  const { error: eUpdate } = await supabase
    .from("cabinets")
    .update({ [colonne]: pub.publicUrl })
    .eq("id", cabinet.id);
  if (eUpdate) return { error: eUpdate.message };

  revalidatePath("/dashboard/site-internet");
  revalidatePath("/[slug]");
  return { error: null, url: pub.publicUrl };
}

export async function retirerImage(type: "logo" | "photo") {
  const { supabase, cabinet } = await getSessionContext();
  const colonne = CHAMP_VERS_COLONNE[type];
  const { error } = await supabase
    .from("cabinets")
    .update({ [colonne]: null })
    .eq("id", cabinet.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/site-internet");
  revalidatePath("/[slug]");
  return { error: null };
}
