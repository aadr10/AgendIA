import { createAdminClient } from "@/lib/supabase/admin";
import ReplanifierClient from "./replanifier-client";

export default async function ReplanifierPage({
  params,
}: {
  params: Promise<{ slug: string; rdvId: string }>;
}) {
  const { slug, rdvId } = await params;
  const supabase = createAdminClient();

  const { data: cabinet } = await supabase.from("cabinets").select("*").eq("slug", slug).single();

  const introuvable = (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-sm rounded-xl border border-slate-200 bg-white p-6 text-center">
        <p className="text-sm text-slate-600">
          Ce lien n&apos;est plus valide. Contactez directement le cabinet pour reprendre un rendez-vous.
        </p>
      </div>
    </div>
  );

  if (!cabinet) return introuvable;

  const { data: rdv } = await supabase
    .from("rendez_vous")
    .select("id, patient_id, praticien_id, prestation_id, debut, statut, patients(nom), prestations(nom, duree_minutes), praticiens(nom)")
    .eq("id", rdvId)
    .eq("cabinet_id", cabinet.id)
    .single();

  if (!rdv || rdv.statut !== "annule") return introuvable;

  const patient = rdv.patients as unknown as { nom: string } | null;
  const prestation = rdv.prestations as unknown as { nom: string; duree_minutes: number } | null;
  const praticien = rdv.praticiens as unknown as { nom: string } | null;

  return (
    <ReplanifierClient
      cabinet={{
        id: cabinet.id,
        nom: cabinet.nom,
        couleurPrimaire: cabinet.couleur_primaire,
        couleurDouce: cabinet.couleur_douce,
      }}
      rdvAnnule={{
        id: rdv.id,
        patientId: rdv.patient_id,
        patientNom: patient?.nom ?? "",
        praticienId: rdv.praticien_id,
        praticienNom: praticien?.nom ?? "",
        prestationId: rdv.prestation_id,
        prestationNom: prestation?.nom ?? "",
        dureeMinutes: prestation?.duree_minutes ?? 30,
        ancienDebut: rdv.debut,
      }}
    />
  );
}
