"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/lib/cabinet";
import { createAdminClient } from "@/lib/supabase/admin";

const COULEURS = ["#0E5E63", "#C4762A", "#6B4C9A", "#2E6DA4", "#A43E5C", "#3F7A4E"];

export async function ajouterPraticien(input: { nom: string; role: string }) {
  const { supabase, cabinet } = await getSessionContext();

  const { count } = await supabase
    .from("praticiens")
    .select("*", { count: "exact", head: true })
    .eq("cabinet_id", cabinet.id);

  const couleur = COULEURS[(count ?? 0) % COULEURS.length];

  const { data: praticien, error } = await supabase
    .from("praticiens")
    .insert({ cabinet_id: cabinet.id, nom: input.nom, role: input.role, couleur_agenda: couleur, actif: true })
    .select("id")
    .single();
  if (error || !praticien) return { error: error?.message ?? "Erreur inconnue" };

  const horaires = [1, 2, 3, 4, 5].map((jour) => ({
    cabinet_id: cabinet.id,
    praticien_id: praticien.id,
    jour_semaine: jour,
    heure_debut: "08:00",
    heure_fin: "18:00",
  }));
  await supabase.from("horaires").insert(horaires);

  revalidatePath("/dashboard/praticiens");
  return { error: null };
}

export async function renommerPraticien(id: string, nom: string) {
  const { supabase, cabinet } = await getSessionContext();
  const { error } = await supabase
    .from("praticiens")
    .update({ nom })
    .eq("id", id)
    .eq("cabinet_id", cabinet.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/praticiens");
  return { error: null };
}

export async function desactiverPraticien(id: string) {
  const { supabase, cabinet } = await getSessionContext();
  const { error } = await supabase
    .from("praticiens")
    .update({ actif: false })
    .eq("id", id)
    .eq("cabinet_id", cabinet.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/praticiens");
  return { error: null };
}

export async function uploaderPhotoPraticien(praticienId: string, formData: FormData) {
  const { supabase, cabinet } = await getSessionContext();

  const fichier = formData.get("fichier") as File | null;
  if (!fichier || fichier.size === 0) return { error: "Aucun fichier reçu." };
  if (!fichier.type.startsWith("image/")) return { error: "Le fichier doit être une image." };
  if (fichier.size > 5 * 1024 * 1024) return { error: "L'image dépasse la taille maximale (5 Mo)." };

  const ext = fichier.name.split(".").pop() || "jpg";
  const chemin = `${cabinet.id}/praticien-${praticienId}-${Date.now()}.${ext}`;

  const admin = createAdminClient();
  const { error: eUpload } = await admin.storage
    .from("cabinet-media")
    .upload(chemin, fichier, { contentType: fichier.type, upsert: true });
  if (eUpload) return { error: "Échec de l'envoi : " + eUpload.message };

  const { data: pub } = admin.storage.from("cabinet-media").getPublicUrl(chemin);

  const { error: eUpdate } = await supabase
    .from("praticiens")
    .update({ photo_url: pub.publicUrl })
    .eq("id", praticienId)
    .eq("cabinet_id", cabinet.id);
  if (eUpdate) return { error: eUpdate.message };

  revalidatePath("/dashboard/praticiens");
  revalidatePath("/[slug]");
  return { error: null, url: pub.publicUrl };
}

export async function retirerPhotoPraticien(praticienId: string) {
  const { supabase, cabinet } = await getSessionContext();
  const { error } = await supabase
    .from("praticiens")
    .update({ photo_url: null })
    .eq("id", praticienId)
    .eq("cabinet_id", cabinet.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/praticiens");
  revalidatePath("/[slug]");
  return { error: null };
}
