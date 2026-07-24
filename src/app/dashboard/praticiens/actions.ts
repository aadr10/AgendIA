"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/lib/cabinet";

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
