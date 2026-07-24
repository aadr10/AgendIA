"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/lib/cabinet";

export async function ajouterPrestation(input: { nom: string; dureeMinutes: number; prix: number }) {
  const { supabase, cabinet } = await getSessionContext();
  const { error } = await supabase.from("prestations").insert({
    cabinet_id: cabinet.id,
    nom: input.nom,
    duree_minutes: input.dureeMinutes,
    prix: input.prix,
    actif: true,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/prestations");
  return { error: null };
}

export async function desactiverPrestation(id: string) {
  const { supabase, cabinet } = await getSessionContext();
  const { error } = await supabase
    .from("prestations")
    .update({ actif: false })
    .eq("id", id)
    .eq("cabinet_id", cabinet.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/prestations");
  return { error: null };
}
