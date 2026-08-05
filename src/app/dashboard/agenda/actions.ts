"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/lib/cabinet";
import { creneauLibre, prochainCreneauLibre } from "@/lib/availability";
import { envoyerConfirmationRdv, envoyerLienReplanification } from "@/lib/notifications";

export async function toggleMasquerRdvAnciens(actif: boolean) {
  const { supabase, cabinet } = await getSessionContext();
  const { error } = await supabase.from("cabinets").update({ masquer_rdv_anciens: actif }).eq("id", cabinet.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/agenda");
  return { error: null };
}

export async function creerRdv(input: {
  patientNom: string;
  patientTelephone: string;
  patientEmail?: string;
  prestationId: string;
  praticienId: string;
  debut: string;
  dureeMinutes: number;
}) {
  const { supabase, cabinet } = await getSessionContext();

  const debut = new Date(input.debut);
  const fin = new Date(debut.getTime() + input.dureeMinutes * 60000);

  const libre = await creneauLibre(supabase, {
    cabinetId: cabinet.id,
    praticienId: input.praticienId,
    debut,
    fin,
  });
  if (!libre) return { error: "Ce créneau n'est plus disponible pour ce praticien." };

  const { data: patient, error: ep } = await supabase
    .from("patients")
    .upsert(
      {
        cabinet_id: cabinet.id,
        nom: input.patientNom,
        telephone: input.patientTelephone,
        email: input.patientEmail || null,
      },
      { onConflict: "cabinet_id,telephone,nom" }
    )
    .select("id")
    .single();
  if (ep || !patient) return { error: "Impossible d'enregistrer la fiche patient : " + ep?.message };

  const { data: rdvCree, error: er } = await supabase
    .from("rendez_vous")
    .insert({
      cabinet_id: cabinet.id,
      patient_id: patient.id,
      praticien_id: input.praticienId,
      prestation_id: input.prestationId,
      debut: debut.toISOString(),
      fin: fin.toISOString(),
      statut: "confirme",
      origine: "manuel",
    })
    .select("id")
    .single();
  if (er || !rdvCree) return { error: er?.message };

  if (input.patientEmail) {
    const { data: praticien } = await supabase.from("praticiens").select("nom").eq("id", input.praticienId).single();
    const { data: prestation } = await supabase.from("prestations").select("nom").eq("id", input.prestationId).single();
    if (praticien && prestation) {
      await envoyerConfirmationRdv({
        cabinetId: cabinet.id,
        cabinetSlug: cabinet.slug,
        rdvId: rdvCree.id,
        cabinetNom: cabinet.nom,
        couleurPrimaire: cabinet.couleur_primaire,
        iaPrenom: cabinet.ia_prenom,
        patientId: patient.id,
        patientNom: input.patientNom,
        patientEmail: input.patientEmail,
        patientTelephone: input.patientTelephone,
        prestationNom: prestation.nom,
        praticienNom: praticien.nom,
        debut,
      });
    }
  }

  revalidatePath("/dashboard/agenda");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deplacerRdv(input: {
  id: string;
  prestationId: string;
  praticienId: string;
  debut: string;
  dureeMinutes: number;
}) {
  const { supabase, cabinet } = await getSessionContext();
  const debut = new Date(input.debut);
  const fin = new Date(debut.getTime() + input.dureeMinutes * 60000);

  const libre = await creneauLibre(supabase, {
    cabinetId: cabinet.id,
    praticienId: input.praticienId,
    debut,
    fin,
    excludeRdvId: input.id,
  });
  if (!libre) return { error: "Ce créneau n'est plus disponible pour ce praticien." };

  const { error } = await supabase
    .from("rendez_vous")
    .update({
      prestation_id: input.prestationId,
      praticien_id: input.praticienId,
      debut: debut.toISOString(),
      fin: fin.toISOString(),
    })
    .eq("id", input.id)
    .eq("cabinet_id", cabinet.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/agenda");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function annulerRdv(id: string) {
  const { supabase, cabinet } = await getSessionContext();
  const { error } = await supabase
    .from("rendez_vous")
    .update({ statut: "annule" })
    .eq("id", id)
    .eq("cabinet_id", cabinet.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/agenda");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function marquerAbsentRdv(id: string) {
  const { supabase, cabinet } = await getSessionContext();
  const { error } = await supabase
    .from("rendez_vous")
    .update({ statut: "absent" })
    .eq("id", id)
    .eq("cabinet_id", cabinet.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/agenda");
  revalidatePath("/dashboard");
  return { error: null };
}

type ImpacteInfo = {
  id: string;
  patientId: string;
  patientNom: string;
  prestationId: string;
  prestationNom: string;
  dureeMinutes: number;
  praticienId: string;
  praticienNom: string;
  ancienDebut: string;
};

export async function creerBlocage(input: {
  praticienId: string | null;
  motif: string;
  jourDebutISO: string;
  jourFinISO: string;
  heureDebut: string;
  heureFin: string;
}): Promise<{ error: string | null; impactes: ImpacteInfo[] }> {
  const { supabase, cabinet } = await getSessionContext();

  const [hd, md] = input.heureDebut.split(":").map(Number);
  const [hf, mf] = input.heureFin.split(":").map(Number);

  const blocagesACreer: {
    cabinet_id: string;
    praticien_id: string | null;
    debut: string;
    fin: string;
    motif: string;
  }[] = [];

  const curseurJour = new Date(input.jourDebutISO + "T00:00:00");
  const dernierJour = new Date(input.jourFinISO + "T00:00:00");
  while (curseurJour <= dernierJour) {
    const debut = new Date(curseurJour);
    debut.setHours(hd, md, 0, 0);
    const fin = new Date(curseurJour);
    fin.setHours(hf, mf, 0, 0);
    blocagesACreer.push({
      cabinet_id: cabinet.id,
      praticien_id: input.praticienId,
      debut: debut.toISOString(),
      fin: fin.toISOString(),
      motif: input.motif,
    });
    curseurJour.setDate(curseurJour.getDate() + 1);
  }

  const { error: eb } = await supabase.from("blocages").insert(blocagesACreer);
  if (eb) return { error: eb.message, impactes: [] };

  const { data: candidats } = await supabase
    .from("rendez_vous")
    .select(
      "id, patient_id, prestation_id, praticien_id, debut, fin, patients(nom, email, telephone), prestations(nom, duree_minutes), praticiens(nom)"
    )
    .eq("cabinet_id", cabinet.id)
    .neq("statut", "annule")
    .gte("debut", blocagesACreer[0].debut)
    .lte("debut", blocagesACreer[blocagesACreer.length - 1].fin);

  const impactesRows = (candidats ?? []).filter((r) =>
    blocagesACreer.some(
      (b) =>
        (b.praticien_id === null || b.praticien_id === r.praticien_id) &&
        new Date(r.debut) < new Date(b.fin) &&
        new Date(b.debut) < new Date(r.fin)
    )
  );

  if (impactesRows.length > 0) {
    await supabase
      .from("rendez_vous")
      .update({ statut: "annule" })
      .in(
        "id",
        impactesRows.map((r) => r.id)
      );
  }

  revalidatePath("/dashboard/agenda");
  revalidatePath("/dashboard");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const impactes: ImpacteInfo[] = impactesRows.map((r) => {
    const patient = r.patients as unknown as { nom: string; email: string | null; telephone: string } | null;
    const prestation = r.prestations as unknown as { nom: string; duree_minutes: number } | null;
    const praticien = r.praticiens as unknown as { nom: string } | null;
    return {
      id: r.id,
      patientId: r.patient_id,
      patientNom: patient?.nom ?? "Patient",
      prestationId: r.prestation_id,
      prestationNom: prestation?.nom ?? "",
      dureeMinutes: prestation?.duree_minutes ?? 30,
      praticienId: r.praticien_id,
      praticienNom: praticien?.nom ?? "",
      ancienDebut: r.debut,
    };
  });

  await Promise.all(
    impactesRows.map((r) => {
      const patient = r.patients as unknown as { nom: string; email: string | null; telephone: string } | null;
      const prestation = r.prestations as unknown as { nom: string } | null;
      if (!patient?.email) return Promise.resolve();
      return envoyerLienReplanification({
        cabinetId: cabinet.id,
        cabinetNom: cabinet.nom,
        couleurPrimaire: cabinet.couleur_primaire,
        patientId: r.patient_id,
        patientNom: patient.nom,
        patientEmail: patient.email,
        patientTelephone: patient.telephone,
        prestationNom: prestation?.nom ?? "",
        ancienDebut: new Date(r.debut),
        lienUrl: `${appUrl}/r/${r.id}`,
      });
    })
  );

  return { error: null, impactes };
}

export async function supprimerBlocage(id: string) {
  const { supabase, cabinet } = await getSessionContext();
  const { error } = await supabase.from("blocages").delete().eq("id", id).eq("cabinet_id", cabinet.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/agenda");
  return { error: null };
}

export async function replanifierPatient(input: {
  patientId: string;
  praticienId: string;
  prestationId: string;
  dureeMinutes: number;
}) {
  const { supabase, cabinet } = await getSessionContext();

  const creneau = await prochainCreneauLibre(supabase, {
    cabinetId: cabinet.id,
    praticienId: input.praticienId,
    dureeMinutes: input.dureeMinutes,
    apartirDe: new Date(),
  });

  if (!creneau) return { error: "Aucun créneau libre trouvé dans les 3 prochaines semaines." };

  const { error } = await supabase.from("rendez_vous").insert({
    cabinet_id: cabinet.id,
    patient_id: input.patientId,
    praticien_id: input.praticienId,
    prestation_id: input.prestationId,
    debut: creneau.debut.toISOString(),
    fin: creneau.fin.toISOString(),
    statut: "confirme",
    origine: "site",
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/agenda");
  revalidatePath("/dashboard");
  return { error: null };
}
