"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/lib/cabinet";

export async function retirerListeAttente(id: string) {
  const { supabase, cabinet } = await getSessionContext();
  const { error } = await supabase.from("liste_attente").delete().eq("id", id).eq("cabinet_id", cabinet.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/liste-attente");
  return { error: null };
}
