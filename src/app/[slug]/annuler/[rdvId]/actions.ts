"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function annulerRdvPatient(cabinetId: string, rdvId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("rendez_vous")
    .update({ statut: "annule" })
    .eq("id", rdvId)
    .eq("cabinet_id", cabinetId)
    .eq("statut", "confirme");
  if (error) return { error: "Impossible d'annuler ce rendez-vous. Merci d'appeler le cabinet." };
  return { error: null };
}
