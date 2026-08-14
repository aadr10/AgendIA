import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/cabinet";
import PageHeader from "@/components/page-header";
import EquipeClient from "./equipe-client";

export default async function EquipePage() {
  const { supabase, profil, cabinet, user } = await getSessionContext();

  if (profil?.role !== "admin") redirect("/dashboard");

  const { data: membres } = await supabase
    .from("users")
    .select("id, email, role, cree_le")
    .eq("cabinet_id", cabinet.id)
    .order("cree_le");

  return (
    <div className="space-y-4">
      <PageHeader title="Accès équipe" />
      <EquipeClient membres={membres ?? []} monId={user.id} couleurPrimaire={cabinet.couleur_primaire} />
    </div>
  );
}
