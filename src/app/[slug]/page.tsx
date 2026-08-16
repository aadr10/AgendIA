import { notFound } from "next/navigation";
import type { Metadata, Viewport } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import SitePatientClient from "./site-client";
import { METIER_LABELS, metierConfig } from "@/lib/metiers";

// Le thème de couleur de la barre navigateur/fenêtre PWA (viewport) est un
// export séparé de "metadata" dans cette version de Next.js — les deux
// exports ne peuvent pas coexister à l'intérieur du même objet.
export async function generateViewport({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Viewport> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data: cabinet } = await supabase.from("cabinets").select("couleur_primaire").eq("slug", slug).single();
  return { themeColor: cabinet?.couleur_primaire || "#0E5E63" };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data: cabinet } = await supabase
    .from("cabinets")
    .select("nom, metier, ville")
    .eq("slug", slug)
    .single();

  if (!cabinet) return { title: "Cabinet introuvable" };

  const metier = METIER_LABELS[cabinet.metier] ?? cabinet.metier;
  const titre = `${cabinet.nom} — Prendre rendez-vous${cabinet.ville ? ` à ${cabinet.ville}` : ""}`;
  const description = `Réservez votre rendez-vous chez ${cabinet.nom} (${metier}) en ligne 24h/24, ou appelez directement — notre secrétaire répond à toute heure.`;

  return {
    title: titre,
    description,
    openGraph: { title: titre, description, type: "website" },
  };
}

export default async function CabinetPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ admin?: string }>;
}) {
  const { slug } = await params;
  const { admin: depuisAdmin } = await searchParams;
  const supabase = createAdminClient();

  const { data: cabinet } = await supabase
    .from("cabinets")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!cabinet) notFound();

  const [{ data: prestations }, { data: praticiens }, { data: liaisons }] = await Promise.all([
    supabase
      .from("prestations")
      .select("id, nom, duree_minutes, prix")
      .eq("cabinet_id", cabinet.id)
      .eq("actif", true)
      .order("prix"),
    supabase
      .from("praticiens")
      .select("id, nom, couleur_agenda, photo_url")
      .eq("cabinet_id", cabinet.id)
      .eq("actif", true)
      .order("nom"),
    supabase
      .from("praticien_prestations")
      .select("praticien_id, prestation_id")
      .eq("cabinet_id", cabinet.id),
  ]);

  return (
    <SitePatientClient
      cabinet={{
        id: cabinet.id,
        slug: cabinet.slug,
        nom: cabinet.nom,
        metier: METIER_LABELS[cabinet.metier] ?? cabinet.metier,
        seance: metierConfig(cabinet.metier).seance,
        ville: cabinet.ville ?? "",
        adresse: cabinet.adresse ?? "",
        telephoneAffiche: cabinet.telephone_affiche ?? "",
        horairesTexte: cabinet.horaires_texte ?? "",
        iaPrenom: cabinet.ia_prenom,
        couleurPrimaire: cabinet.couleur_primaire,
        couleurDouce: cabinet.couleur_douce,
        logoUrl: cabinet.logo_url,
        photoHeroUrl: cabinet.photo_hero_url,
        email: cabinet.email ?? "",
        instagramUrl: cabinet.instagram_url ?? "",
        facebookUrl: cabinet.facebook_url ?? "",
        tiktokUrl: cabinet.tiktok_url ?? "",
        aVocal: !!cabinet.numero_twilio,
      }}
      depuisAdmin={depuisAdmin === "1"}
      prestations={prestations ?? []}
      praticiens={praticiens ?? []}
      liaisons={liaisons ?? []}
    />
  );
}
