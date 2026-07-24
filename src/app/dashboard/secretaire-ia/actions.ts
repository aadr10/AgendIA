"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/lib/cabinet";

export async function majIdentite(input: {
  iaPrenom: string;
  iaTon: string;
  iaMessageAccueil: string;
}) {
  const { supabase, cabinet } = await getSessionContext();
  const { error } = await supabase
    .from("cabinets")
    .update({
      ia_prenom: input.iaPrenom,
      ia_ton: input.iaTon,
      ia_message_accueil: input.iaMessageAccueil,
    })
    .eq("id", cabinet.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/secretaire-ia");
  return { error: null };
}

export async function majRegles(input: {
  delaiMinReservationHeures: number;
  delaiAnnulationHeures: number;
  accepteNouveauxPatients: boolean;
  confirmationAuto: boolean;
}) {
  const { supabase, cabinet } = await getSessionContext();
  const { error } = await supabase
    .from("regles")
    .update({
      delai_min_reservation_heures: input.delaiMinReservationHeures,
      delai_annulation_heures: input.delaiAnnulationHeures,
      accepte_nouveaux_patients: input.accepteNouveauxPatients,
      confirmation_auto: input.confirmationAuto,
    })
    .eq("cabinet_id", cabinet.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/secretaire-ia");
  return { error: null };
}

export async function ajouterFaq(input: { question: string; reponse: string }) {
  const { supabase, cabinet } = await getSessionContext();
  const { error } = await supabase.from("faq").insert({
    cabinet_id: cabinet.id,
    question: input.question,
    reponse: input.reponse,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/secretaire-ia");
  return { error: null };
}

export async function supprimerFaq(id: string) {
  const { supabase, cabinet } = await getSessionContext();
  const { error } = await supabase.from("faq").delete().eq("id", id).eq("cabinet_id", cabinet.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/secretaire-ia");
  return { error: null };
}
