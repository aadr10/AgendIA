import { getSessionContext } from "@/lib/cabinet";
import PageHeader from "@/components/page-header";
import AppelsClient from "./appels-client";

export default async function AppelsPage() {
  const { supabase, cabinet } = await getSessionContext();

  const { data } = await supabase
    .from("appels")
    .select("id, numero_appelant, debut, duree_secondes, resultat, transcription, patients(nom)")
    .eq("cabinet_id", cabinet.id)
    .order("debut", { ascending: false });

  const appels = (data ?? []).map((a) => ({
    id: a.id,
    patientNom: (a.patients as unknown as { nom: string } | null)?.nom ?? "Numéro inconnu",
    numero: a.numero_appelant,
    debut: a.debut,
    dureeSecondes: a.duree_secondes,
    resultat: a.resultat,
    transcription: (a.transcription ?? []) as { qui: string; texte: string }[],
  }));

  return (
    <div className="space-y-4">
      <PageHeader title="Appels" />
      <AppelsClient appels={appels} />
    </div>
  );
}
