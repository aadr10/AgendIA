import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
export { METIER_LABELS } from "@/lib/metiers";

const COOKIE_VUE_ADMIN = "admin_vue_cabinet_id";

export async function getSessionContext() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Le super-admin n'a pas de fiche cabinet propre : s'il consulte le
  // dashboard d'un praticien depuis /admin (cookie posé par voirDashboardCabinet),
  // on lui sert directement ce cabinet-là, en lecture via le client admin
  // (il n'a pas de ligne dans `users` pointant vers ce cabinet).
  if (user.email === process.env.SUPER_ADMIN_EMAIL) {
    const cookieStore = await cookies();
    const cabinetIdVue = cookieStore.get(COOKIE_VUE_ADMIN)?.value;
    if (cabinetIdVue) {
      const admin = createAdminClient();
      const { data: cabinet } = await admin.from("cabinets").select("*").eq("id", cabinetIdVue).single();
      if (cabinet) {
        return {
          supabase: admin,
          user,
          profil: { email: user.email, role: "admin" as const, cabinet_id: cabinet.id },
          cabinet,
          vueAdmin: true as const,
        };
      }
    }
    redirect("/admin");
  }

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

  return { supabase, user, profil, cabinet: cabinet!, vueAdmin: false as const };
}
