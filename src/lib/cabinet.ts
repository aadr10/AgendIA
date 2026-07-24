import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getSessionContext() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profil } = await supabase
    .from("users")
    .select("email, role, cabinet_id")
    .eq("id", user.id)
    .single();

  if (!profil) redirect("/login");

  const { data: cabinet } = await supabase
    .from("cabinets")
    .select("*")
    .eq("id", profil.cabinet_id)
    .single();

  return { supabase, user, profil, cabinet: cabinet! };
}

export const METIER_LABELS: Record<string, string> = {
  kine: "Kinésithérapie",
  osteo: "Ostéopathie",
  dentiste: "Dentisterie",
  barber: "Barbier",
  veto: "Vétérinaire",
};
