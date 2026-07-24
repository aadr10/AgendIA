import { getSessionContext } from "@/lib/cabinet";
import PageHeader from "@/components/page-header";
import ConfigClient from "./config-client";

export default async function SecretaireIAPage() {
  const { supabase, cabinet } = await getSessionContext();

  const { data: regles } = await supabase
    .from("regles")
    .select("*")
    .eq("cabinet_id", cabinet.id)
    .single();

  const { data: faq } = await supabase
    .from("faq")
    .select("id, question, reponse")
    .eq("cabinet_id", cabinet.id)
    .order("question");

  return (
    <div className="space-y-4">
      <PageHeader title="Secrétaire IA" />
      <ConfigClient
        cabinet={{
          iaPrenom: cabinet.ia_prenom,
          iaTon: cabinet.ia_ton,
          iaMessageAccueil: cabinet.ia_message_accueil ?? "",
        }}
        regles={{
          delaiMinReservationHeures: regles?.delai_min_reservation_heures ?? 2,
          delaiAnnulationHeures: regles?.delai_annulation_heures ?? 24,
          accepteNouveauxPatients: regles?.accepte_nouveaux_patients ?? true,
          confirmationAuto: regles?.confirmation_auto ?? true,
        }}
        faqInitiale={faq ?? []}
      />
    </div>
  );
}
