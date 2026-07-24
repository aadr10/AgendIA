"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { creneauxDisponiblesJour } from "@/lib/disponibilites";
import { envoyerConfirmationRdv } from "@/lib/notifications";

export async function creneauxPourJour(input: {
  cabinetId: string;
  prestationId: string;
  praticienId: string | null;
  jourISO: string; // YYYY-MM-DD, local
  dureeMinutes: number;
}) {
  const supabase = createAdminClient();

  const { data: regles } = await supabase
    .from("regles")
    .select("delai_min_reservation_heures")
    .eq("cabinet_id", input.cabinetId)
    .single();

  const jour = new Date(input.jourISO + "T00:00:00");

  return creneauxDisponiblesJour(supabase, {
    cabinetId: input.cabinetId,
    prestationId: input.prestationId,
    praticienId: input.praticienId,
    jour,
    dureeMinutes: input.dureeMinutes,
    delaiMinHeures: regles?.delai_min_reservation_heures ?? 0,
  });
}

export async function reserverRdv(input: {
  cabinetId: string;
  prestationId: string;
  praticienId: string;
  dureeMinutes: number;
  jourISO: string;
  heure: string; // "HH:MM"
  nom: string;
  telephone: string;
  email: string;
}) {
  const supabase = createAdminClient();

  const nom = input.nom.trim();
  const telephone = input.telephone.trim();
  const email = input.email.trim();
  if (!nom || !telephone || !email) {
    return { error: "Merci de renseigner votre nom, téléphone et email." };
  }

  const { data: regles } = await supabase
    .from("regles")
    .select("delai_min_reservation_heures, accepte_nouveaux_patients")
    .eq("cabinet_id", input.cabinetId)
    .single();

  const [hh, mm] = input.heure.split(":").map(Number);
  const debut = new Date(input.jourISO + "T00:00:00");
  debut.setHours(hh, mm, 0, 0);
  const fin = new Date(debut.getTime() + input.dureeMinutes * 60000);

  const seuil = new Date(Date.now() + (regles?.delai_min_reservation_heures ?? 0) * 3600000);
  if (debut < seuil) {
    return { error: "Ce créneau n'est plus disponible. Merci de choisir un autre horaire." };
  }

  const { data: conflitsRdv } = await supabase
    .from("rendez_vous")
    .select("id")
    .eq("cabinet_id", input.cabinetId)
    .eq("praticien_id", input.praticienId)
    .neq("statut", "annule")
    .lt("debut", fin.toISOString())
    .gt("fin", debut.toISOString());
  if (conflitsRdv && conflitsRdv.length > 0) {
    return { error: "Ce créneau vient d'être réservé par quelqu'un d'autre. Merci de choisir un autre horaire." };
  }

  const { data: conflitsBlocage } = await supabase
    .from("blocages")
    .select("id")
    .eq("cabinet_id", input.cabinetId)
    .or(`praticien_id.eq.${input.praticienId},praticien_id.is.null`)
    .lt("debut", fin.toISOString())
    .gt("fin", debut.toISOString());
  if (conflitsBlocage && conflitsBlocage.length > 0) {
    return { error: "Ce créneau n'est plus disponible. Merci de choisir un autre horaire." };
  }

  const { data: patientExistant } = await supabase
    .from("patients")
    .select("id")
    .eq("cabinet_id", input.cabinetId)
    .eq("telephone", telephone)
    .maybeSingle();

  if (!patientExistant && regles?.accepte_nouveaux_patients === false) {
    return { error: "Ce cabinet n'accepte pas de nouveaux patients pour le moment. Merci de nous appeler." };
  }

  const { data: patient, error: ep } = await supabase
    .from("patients")
    .upsert(
      { cabinet_id: input.cabinetId, nom, telephone, email },
      { onConflict: "cabinet_id,telephone" }
    )
    .select("id")
    .single();
  if (ep || !patient) return { error: "Impossible d'enregistrer votre fiche patient." };

  const { error: er } = await supabase.from("rendez_vous").insert({
    cabinet_id: input.cabinetId,
    patient_id: patient.id,
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

  if (cabinet && praticien && prestation) {
    await envoyerConfirmationRdv({
      cabinetId: input.cabinetId,
      cabinetNom: cabinet.nom,
      couleurPrimaire: cabinet.couleur_primaire,
      iaPrenom: cabinet.ia_prenom,
      patientId: patient.id,
      patientNom: nom,
      patientEmail: email,
      patientTelephone: telephone,
      prestationNom: prestation.nom,
      praticienNom: praticien.nom,
      debut,
    });
  }

  return { error: null };
}
