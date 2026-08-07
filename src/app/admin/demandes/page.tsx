import { createAdminClient } from "@/lib/supabase/admin";
import { metierConfig } from "@/lib/metiers";
import DemandesClient from "./demandes-client";

export default async function DemandesPage() {
  const supabase = createAdminClient();

  const { data: demandes } = await supabase
    .from("demandes_demo")
    .select("*")
    .order("cree_le", { ascending: false });

  const lignes = (demandes ?? []).map((d) => ({
    id: d.id,
    nom: d.nom,
    email: d.email,
    telephone: d.telephone ?? "",
    metier: d.metier ? metierConfig(d.metier).label : "",
    metierCouleur: d.metier ? metierConfig(d.metier).couleur : "#94A3B8",
    cabinetNom: d.cabinet_nom ?? "",
    message: d.message ?? "",
    statut: d.statut as "nouveau" | "contacte" | "traite",
    creeLe: d.cree_le,
  }));

  const nouveaux = lignes.filter((l) => l.statut === "nouveau").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Demandes de démo</h1>
        <p className="text-sm text-slate-500">
          {lignes.length} demande{lignes.length > 1 ? "s" : ""} au total
          {nouveaux > 0 ? ` · ${nouveaux} nouvelle${nouveaux > 1 ? "s" : ""}` : ""}
        </p>
      </div>

      <DemandesClient lignes={lignes} />
    </div>
  );
}
