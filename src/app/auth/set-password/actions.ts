"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function definirMotDePasse(motDePasse: string) {
  if (motDePasse.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session invalide, redemandez une invitation." };

  const { error } = await supabase.auth.updateUser({ password: motDePasse });
  if (error) return { error: error.message };

  console.log(
    "[set-password] email utilisateur =",
    JSON.stringify(user.email),
    "| SUPER_ADMIN_EMAIL =",
    JSON.stringify(process.env.SUPER_ADMIN_EMAIL),
    "| correspond =",
    user.email === process.env.SUPER_ADMIN_EMAIL
  );

  if (user.email === process.env.SUPER_ADMIN_EMAIL) {
    redirect("/admin");
  }
  redirect("/dashboard");
}
