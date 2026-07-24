import { getSessionContext } from "@/lib/cabinet";
import PageHeader from "@/components/page-header";
import PrestationsClient from "./prestations-client";

export default async function PrestationsPage() {
  const { supabase, cabinet } = await getSessionContext();

  const { data: prestationsData } = await supabase
    .from("prestations")
    .select("id, nom, duree_minutes, prix")
    .eq("cabinet_id", cabinet.id)
    .eq("actif", true)
    .order("prix");

  const { data: liaisons } = await supabase
    .from("praticien_prestations")
    .select("prestation_id, praticiens(nom)")
    .eq("cabinet_id", cabinet.id);

  const prestations = (prestationsData ?? []).map((p) => ({
    id: p.id,
    nom: p.nom,
    dureeMinutes: p.duree_minutes,
    prix: p.prix,
    praticiens: (liaisons ?? [])
      .filter((l) => l.prestation_id === p.id)
      .map((l) => (l.praticiens as unknown as { nom: string } | null)?.nom ?? "")
      .filter(Boolean),
  }));

  return (
    <div className="space-y-4">
      <PageHeader title="Prestations" />
      <PrestationsClient prestations={prestations} />
    </div>
  );
}
