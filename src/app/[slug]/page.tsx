import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import SitePatientClient from "./site-client";

const METIER_LABELS: Record<string, string> = {
  kine: "Kinésithérapie",
  osteo: "Ostéopathie",
  dentiste: "Dentisterie",
  barber: "Barbier",
  veto: "Vétérinaire",
};

export default async function CabinetPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: cabinet } = await supabase
    .from("cabinets")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!cabinet) notFound();

  const [{ data: prestations }, { data: praticiens }, { data: liaisons }] = await Promise.all([
    supabase
      .from("prestations")
      .select("id, nom, duree_minutes, prix")
      .eq("cabinet_id", cabinet.id)
      .eq("actif", true)
      .order("prix"),
    supabase
      .from("praticiens")
      .select("id, nom, couleur_agenda")
      .eq("cabinet_id", cabinet.id)
      .eq("actif", true)
      .order("nom"),
    supabase
      .from("praticien_prestations")
      .select("praticien_id, prestation_id")
      .eq("cabinet_id", cabinet.id),
  ]);

  return (
    <SitePatientClient
      cabinet={{
        id: cabinet.id,
        slug: cabinet.slug,
        nom: cabinet.nom,
        metier: METIER_LABELS[cabinet.metier] ?? cabinet.metier,
        ville: cabinet.ville ?? "",
        adresse: cabinet.adresse ?? "",
        telephoneAffiche: cabinet.telephone_affiche ?? "",
        horairesTexte: cabinet.horaires_texte ?? "",
        iaPrenom: cabinet.ia_prenom,
        couleurPrimaire: cabinet.couleur_primaire,
        couleurDouce: cabinet.couleur_douce,
        photoHeroUrl: cabinet.photo_hero_url,
      }}
      prestations={prestations ?? []}
      praticiens={praticiens ?? []}
      liaisons={liaisons ?? []}
    />
  );
}
