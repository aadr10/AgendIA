import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminCabinetsClient from "./cabinets-client";

const METIER_LABELS: Record<string, string> = {
  kine: "Kinésithérapie",
  osteo: "Ostéopathie",
  dentiste: "Dentisterie",
  veto: "Vétérinaire",
  barber: "Barbier",
};

export default async function AdminPage() {
  const supabase = createAdminClient();

  const { data: cabinets } = await supabase
    .from("cabinets")
    .select("id, slug, nom, metier, ville, numero_twilio, statut_abonnement, cree_le")
    .order("cree_le", { ascending: false });

  const lignes = (cabinets ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    nom: c.nom,
    metier: METIER_LABELS[c.metier] ?? c.metier,
    ville: c.ville ?? "",
    offre: c.numero_twilio ? "Premium (site + téléphone)" : "Site seul",
    statut: c.statut_abonnement,
    creeLe: c.cree_le,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Cabinets clients</h1>
          <p className="text-sm text-slate-500">{lignes.length} cabinet{lignes.length > 1 ? "s" : ""}</p>
        </div>
        <Link href="/admin/nouveau" className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "#0E5E63" }}>
          + Nouveau cabinet
        </Link>
      </div>

      <AdminCabinetsClient lignes={lignes} />
    </div>
  );
}
