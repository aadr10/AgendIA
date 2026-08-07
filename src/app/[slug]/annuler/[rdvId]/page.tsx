import { createAdminClient } from "@/lib/supabase/admin";
import AnnulerClient from "./annuler-client";

export default async function AnnulerPage({
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
          Ce lien n&apos;est plus valide. Contactez directement le cabinet si besoin.
        </p>
      </div>
    </div>
  );

  if (!cabinet) return introuvable;

  const { data: rdv } = await supabase
    .from("rendez_vous")
    .select("id, debut, statut, prestations(nom), praticiens(nom)")
    .eq("id", rdvId)
    .eq("cabinet_id", cabinet.id)
    .single();

  if (!rdv) return introuvable;

  const prestation = rdv.prestations as unknown as { nom: string } | null;
  const praticien = rdv.praticiens as unknown as { nom: string } | null;

  return (
    <AnnulerClient
      cabinet={{ id: cabinet.id, slug: cabinet.slug, nom: cabinet.nom, couleurPrimaire: cabinet.couleur_primaire }}
      rdv={{
        id: rdv.id,
        debut: rdv.debut,
        statut: rdv.statut,
        prestationNom: prestation?.nom ?? "",
        praticienNom: praticien?.nom ?? "",
      }}
    />
  );
}
