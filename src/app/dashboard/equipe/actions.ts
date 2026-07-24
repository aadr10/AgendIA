"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/lib/cabinet";
import { createAdminClient } from "@/lib/supabase/admin";

export async function inviterMembre(input: { email: string; role: "admin" | "praticien" }) {
  const { profil, cabinet } = await getSessionContext();
  if (profil?.role !== "admin") return { error: "Seul un administrateur peut inviter un membre." };

  const email = input.email.trim().toLowerCase();
  if (!email) return { error: "Email requis." };

  const admin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/auth/set-password`,
  });
  if (error) return { error: error.message };

  const { error: eProfil } = await admin.from("users").insert({
    id: data.user.id,
    cabinet_id: cabinet.id,
    email,
    role: input.role,
  });
  if (eProfil) return { error: "Compte invité mais fiche interne non créée : " + eProfil.message };

  revalidatePath("/dashboard/equipe");
  return { error: null };
}

export async function revoquerAcces(userId: string) {
  const { supabase, profil, user } = await getSessionContext();
  if (profil?.role !== "admin") return { error: "Seul un administrateur peut révoquer un accès." };
  if (userId === user.id) return { error: "Vous ne pouvez pas révoquer votre propre accès." };

  const admin = createAdminClient();
  const { error: eDelete } = await admin.auth.admin.deleteUser(userId);
  if (eDelete) return { error: eDelete.message };

  await supabase.from("users").delete().eq("id", userId);

  revalidatePath("/dashboard/equipe");
  return { error: null };
}
