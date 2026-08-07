import { createAdminClient } from "@/lib/supabase/admin";
import type { ContexteChat } from "./types";

async function construireDepuisCabinet(cabinet: {
  id: string;
  slug: string;
  nom: string;
  couleur_primaire: string;
  metier: string;
  ville: string | null;
  adresse: string | null;
  telephone_affiche: string | null;
  horaires_texte: string | null;
  ia_prenom: string;
  ia_ton: string;
  ia_message_accueil: string | null;
}): Promise<ContexteChat> {
  const supabase = createAdminClient();

  const [{ data: regles }, { data: prestations }, { data: praticiens }, { data: liaisons }, { data: faq }] = await Promise.all([
    supabase.from("regles").select("*").eq("cabinet_id", cabinet.id).single(),
    supabase.from("prestations").select("id, nom, duree_minutes, prix").eq("cabinet_id", cabinet.id).eq("actif", true),
    supabase.from("praticiens").select("id, nom").eq("cabinet_id", cabinet.id).eq("actif", true),
    supabase.from("praticien_prestations").select("praticien_id, prestation_id").eq("cabinet_id", cabinet.id),
    supabase.from("faq").select("question, reponse").eq("cabinet_id", cabinet.id),
  ]);

  return {
    cabinet: {
      id: cabinet.id,
      slug: cabinet.slug,
      nom: cabinet.nom,
      couleurPrimaire: cabinet.couleur_primaire,
      metier: cabinet.metier,
      ville: cabinet.ville ?? "",
      adresse: cabinet.adresse ?? "",
      telephoneAffiche: cabinet.telephone_affiche ?? "",
      horairesTexte: cabinet.horaires_texte ?? "",
      iaPrenom: cabinet.ia_prenom,
      iaTon: cabinet.ia_ton,
      iaMessageAccueil: cabinet.ia_message_accueil ?? "",
    },
    regles: {
      delaiMinReservationHeures: regles?.delai_min_reservation_heures ?? 2,
      delaiAnnulationHeures: regles?.delai_annulation_heures ?? 24,
      accepteNouveauxPatients: regles?.accepte_nouveaux_patients ?? true,
      transfertHumainNumero: regles?.transfert_humain_numero ?? null,
    },
    prestations: (prestations ?? []).map((p) => ({ id: p.id, nom: p.nom, dureeMinutes: p.duree_minutes, prix: p.prix })),
    praticiens: praticiens ?? [],
    liaisons: liaisons ?? [],
    faq: faq ?? [],
  };
}

export async function construireContexteParSlug(slug: string): Promise<ContexteChat | null> {
  const supabase = createAdminClient();
  const { data: cabinet } = await supabase.from("cabinets").select("*").eq("slug", slug).single();
  if (!cabinet) return null;
  return construireDepuisCabinet(cabinet);
}

export async function construireContexteParNumeroTwilio(numero: string): Promise<ContexteChat | null> {
  const supabase = createAdminClient();
  const { data: cabinet } = await supabase.from("cabinets").select("*").eq("numero_twilio", numero).single();
  if (!cabinet) return null;
  return construireDepuisCabinet(cabinet);
}

export async function construireContexteParCabinetId(cabinetId: string): Promise<ContexteChat | null> {
  const supabase = createAdminClient();
  const { data: cabinet } = await supabase.from("cabinets").select("*").eq("id", cabinetId).single();
  if (!cabinet) return null;
  return construireDepuisCabinet(cabinet);
}
