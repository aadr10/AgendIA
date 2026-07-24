"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { creneauxDisponiblesJour } from "@/lib/disponibilites";
import { envoyerConfirmationRdv } from "@/lib/notifications";

export async function creneauxPourReplanification(input: {
  cabinetId: string;
  prestationId: string;
  praticienId: string;
  jourISO: string;
  dureeMinutes: number;
}) {
  const supabase = createAdminClient();
  const { data: regles } = await supabase
    .from("regles")
    .select("delai_min_reservation_heures")
    .eq("cabinet_id", input.cabinetId)
    .single();

  return creneauxDisponiblesJour(supabase, {
    cabinetId: input.cabinetId,
    prestationId: input.prestationId,
    praticienId: input.praticienId,
    jour: new Date(input.jourISO + "T00:00:00"),
    dureeMinutes: input.dureeMinutes,
    delaiMinHeures: regles?.delai_min_reservation_heures ?? 0,
  });
}

export async function confirmerReplanification(input: {
  rdvAnnuleId: string;
  cabinetId: string;
  patientId: string;
  praticienId: string;
  prestationId: string;
  dureeMinutes: number;
  jourISO: string;
  heure: string;
}) {
  const supabase = createAdminClient();

  const [hh, mm] = input.heure.split(":").map(Number);
  const debut = new Date(input.jourISO + "T00:00:00");
  debut.setHours(hh, mm, 0, 0);
  const fin = new Date(debut.getTime() + input.dureeMinutes * 60000);

  const { data: conflitsRdv } = await supabase
    .from("rendez_vous")
    .select("id")
    .eq("cabinet_id", input.cabinetId)
    .eq("praticien_id", input.praticienId)
    .neq("statut", "annule")
    .lt("debut", fin.toISOString())
    .gt("fin", debut.toISOString());
  if (conflitsRdv && conflitsRdv.length > 0) {
    return { error: "Ce créneau vient d'être pris. Merci d'en choisir un autre." };
  }

  const { data: conflitsBlocage } = await supabase
    .from("blocages")
    .select("id")
    .eq("cabinet_id", input.cabinetId)
    .or(`praticien_id.eq.${input.praticienId},praticien_id.is.null`)
    .lt("debut", fin.toISOString())
    .gt("fin", debut.toISOString());
  if (conflitsBlocage && conflitsBlocage.length > 0) {
    return { error: "Ce créneau n'est plus disponible. Merci d'en choisir un autre." };
  }

  const { data: patient } = await supabase
    .from("patients")
    .select("nom, email, telephone")
    .eq("id", input.patientId)
    .single();
  if (!patient) return { error: "Fiche patient introuvable." };

  const { error: er } = await supabase.from("rendez_vous").insert({
    cabinet_id: input.cabinetId,
    patient_id: input.patientId,
    praticien_id: input.praticienId,
    prestation_id: input.prestationId,
    debut: debut.toISOString(),
    fin: fin.toISOString(),
    statut: "confirme",
    origine: "site",
  });
  if (er) return { error: "Impossible de créer le rendez-vous : " + er.message };

  const [{ data: cabinet }, { data: praticien }, { data: prestation }] = await Promise.all([
    supabase.from("cabinets").select("nom, couleur_primaire, ia_prenom").eq("id", input.cabinetId).single(),
    supabase.from("praticiens").select("nom").eq("id", input.praticienId).single(),
    supabase.from("prestations").select("nom").eq("id", input.prestationId).single(),
  ]);

  if (cabinet && praticien && prestation && patient.email) {
    await envoyerConfirmationRdv({
      cabinetId: input.cabinetId,
      cabinetNom: cabinet.nom,
      couleurPrimaire: cabinet.couleur_primaire,
      iaPrenom: cabinet.ia_prenom,
      patientId: input.patientId,
      patientNom: patient.nom,
      patientEmail: patient.email,
      patientTelephone: patient.telephone,
      prestationNom: prestation.nom,
      praticienNom: praticien.nom,
      debut,
    });
  }

  return { error: null };
}
