import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminCabinetsClient from "./cabinets-client";
import { metierConfig } from "@/lib/metiers";
import type { Offre } from "@/lib/offres";

export default async function AdminPage() {
  const supabase = createAdminClient();

  const { data: cabinets } = await supabase
    .from("cabinets")
    .select("id, slug, nom, metier, ville, offre, statut_abonnement, cree_le")
    .order("cree_le", { ascending: false });

  const lignes = (cabinets ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    nom: c.nom,
    metier: metierConfig(c.metier).label,
    metierCouleur: metierConfig(c.metier).couleur,
    ville: c.ville ?? "",
    offre: (c.offre ?? "site") as Offre,
    statut: c.statut_abonnement,
    creeLe: c.cree_le,
  }));

  const total = lignes.length;
  const actifs = lignes.filter((l) => l.statut === "actif").length;
  const essai = lignes.filter((l) => l.statut === "essai").length;
  const premium = lignes.filter((l) => l.offre === "premium").length;
  const intermediaire = lignes.filter((l) => l.offre === "intermediaire").length;

  const stats = [
    { label: "Cabinets clients", valeur: total, couleur: "#0E5E63" },
    { label: "Abonnements actifs", valeur: actifs, couleur: "#0E7C86" },
    { label: "En essai", valeur: essai, couleur: "#B8792F" },
    { label: "Offre Premium", valeur: premium, couleur: "#2E5FA4" },
    { label: "Offre Intermédiaire", valeur: intermediaire, couleur: "#6B4C9A" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Cabinets clients</h1>
          <p className="text-sm text-slate-500">Vue d&apos;ensemble de tous les cabinets, tous métiers confondus</p>
        </div>
        <Link
          href="/admin/nouveau"
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
          style={{ background: "linear-gradient(135deg, #14B8A6, #0E5E63)" }}
        >
          + Nouveau cabinet
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-2xl font-bold" style={{ color: s.couleur }}>{s.valeur}</div>
            <div className="mt-0.5 text-xs font-medium text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      <AdminCabinetsClient lignes={lignes} />
    </div>
  );
}
