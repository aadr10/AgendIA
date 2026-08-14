import { getSessionContext } from "@/lib/cabinet";
import PageHeader from "@/components/page-header";
import PraticiensClient from "./praticiens-client";

const JOURS_LABEL = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export default async function PraticiensPage() {
  const { supabase, cabinet } = await getSessionContext();

  const { data: praticiensData } = await supabase
    .from("praticiens")
    .select("id, nom, role, couleur_agenda, photo_url, actif")
    .eq("cabinet_id", cabinet.id)
    .eq("actif", true)
    .order("nom");

  const { data: horaires } = await supabase
    .from("horaires")
    .select("praticien_id, jour_semaine, heure_debut, heure_fin")
    .eq("cabinet_id", cabinet.id);

  const praticiens = (praticiensData ?? []).map((p) => ({
    id: p.id,
    nom: p.nom,
    role: p.role ?? "",
    couleurAgenda: p.couleur_agenda,
    photoUrl: p.photo_url,
    horaires: (horaires ?? [])
      .filter((h) => h.praticien_id === p.id)
      .sort((a, b) => a.jour_semaine - b.jour_semaine)
      .map((h) => `${JOURS_LABEL[h.jour_semaine]} ${h.heure_debut.slice(0, 5)}-${h.heure_fin.slice(0, 5)}`),
  }));

  return (
    <div className="space-y-4">
      <PageHeader title="Praticiens" />
      <PraticiensClient praticiens={praticiens} couleurPrimaire={cabinet.couleur_primaire} />
    </div>
  );
}
