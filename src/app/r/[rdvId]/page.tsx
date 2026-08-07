import { redirect, notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

// Lien court utilisé dans les SMS de replanification (au lieu de
// /{slug}/replanifier/{rdvId}, qui peut dépasser 160 caractères avec un nom de
// cabinet long et faire payer 2 SMS au lieu d'1). Redirige vers la vraie page.
export default async function LienCourtReplanification({
  params,
}: {
  params: Promise<{ rdvId: string }>;
}) {
  const { rdvId } = await params;
  const supabase = createAdminClient();

  const { data: rdv } = await supabase
    .from("rendez_vous")
    .select("cabinets(slug)")
    .eq("id", rdvId)
    .single();

  const slug = (rdv?.cabinets as unknown as { slug: string } | null)?.slug;
  if (!slug) notFound();

  redirect(`/${slug}/replanifier/${rdvId}`);
}
