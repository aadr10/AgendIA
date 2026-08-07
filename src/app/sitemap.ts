import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://secretaire-ia.vercel.app";
  const supabase = createAdminClient();
  const { data: cabinets } = await supabase.from("cabinets").select("slug").eq("statut_abonnement", "actif");

  const pagesCabinets: MetadataRoute.Sitemap = (cabinets ?? []).map((c) => ({
    url: `${base}/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: base, changeFrequency: "monthly", priority: 1 },
    ...pagesCabinets,
  ];
}
