import { getSessionContext } from "@/lib/cabinet";
import PageHeader from "@/components/page-header";
import ListeAttenteClient from "./liste-attente-client";

export default async function ListeAttentePage() {
  const { supabase, cabinet } = await getSessionContext();

  const { data: lignesData } = await supabase
    .from("liste_attente")
    .select(
      "id, disponibilites_souhaitees, cree_le, patients(nom, telephone), prestations(nom), praticiens(nom)"
    )
    .eq("cabinet_id", cabinet.id)
    .order("cree_le", { ascending: true });

  const lignes = (lignesData ?? []).map((l) => ({
    id: l.id,
    patientNom: (l.patients as unknown as { nom: string; telephone: string } | null)?.nom ?? "",
    patientTelephone: (l.patients as unknown as { nom: string; telephone: string } | null)?.telephone ?? "",
    prestationNom: (l.prestations as unknown as { nom: string } | null)?.nom ?? "",
    praticienNom: (l.praticiens as unknown as { nom: string } | null)?.nom ?? null,
    disponibilitesSouhaitees: l.disponibilites_souhaitees ?? "",
    creeLe: l.cree_le,
  }));

  return (
    <div className="space-y-4">
      <PageHeader title="Liste d'attente" />
      <ListeAttenteClient lignes={lignes} couleurPrimaire={cabinet.couleur_primaire} />
    </div>
  );
}
