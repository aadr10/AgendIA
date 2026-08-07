"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { limiteAtteinte } from "@/lib/rate-limit";

export async function creerDemandeDemo(input: {
  nom: string;
  email: string;
  telephone: string;
  metier: string;
  cabinetNom: string;
  message: string;
}) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "inconnu";
  if (limiteAtteinte(`demo:${ip}`, 5, 10 * 60 * 1000)) {
    return { error: "Trop de tentatives, réessayez dans quelques minutes." };
  }

  const nom = input.nom.trim();
  const email = input.email.trim();
  if (!nom || !email) {
    return { error: "Merci de renseigner au moins ton nom et ton email." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "L'adresse email ne semble pas valide." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("demandes_demo").insert({
    nom,
    email,
    telephone: input.telephone.trim() || null,
    metier: input.metier || null,
    cabinet_nom: input.cabinetNom.trim() || null,
    message: input.message.trim() || null,
  });

  if (error) return { error: "Impossible d'enregistrer ta demande. Merci de réessayer." };
  return { error: null };
}
