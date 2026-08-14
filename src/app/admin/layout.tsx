import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logout } from "@/app/login/actions";

export const metadata: Metadata = {
  title: "AgendIA — Admin",
  manifest: "/manifest-admin.json",
};

const NAV = [
  { label: "Cabinets", href: "/admin", icone: "🏢" },
  { label: "Nouveau cabinet", href: "/admin/nouveau", icone: "✦" },
  { label: "Demandes de démo", href: "/admin/demandes", icone: "📥" },
  { label: "Rentabilité", href: "/admin/rentabilite", icone: "💶" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL) {
    redirect("/login");
  }

  const admin = createAdminClient();
  const { count: nouvellesDemandes } = await admin
    .from("demandes_demo")
    .select("id", { count: "exact", head: true })
    .eq("statut", "nouveau");

  return (
    <div
      className="min-h-screen text-slate-800"
      style={{
        fontFamily: "system-ui, sans-serif",
        background:
          "radial-gradient(circle at 12% 8%, rgba(20,184,166,0.25), transparent 40%), radial-gradient(circle at 88% 0%, rgba(99,102,241,0.22), transparent 45%), radial-gradient(circle at 50% 100%, rgba(14,94,99,0.35), transparent 55%), linear-gradient(160deg, #060B18 0%, #0B1526 45%, #0F172A 100%)",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="mx-auto flex max-w-7xl gap-6 p-4 lg:p-6">
        <aside className="hidden w-56 flex-shrink-0 md:block">
          <div className="sticky top-6 flex h-[calc(100vh-3rem)] flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
            <div className="mb-6 flex items-center gap-2 px-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white shadow-lg"
                style={{ background: "linear-gradient(135deg, #14B8A6, #0E5E63)" }}
              >
                IA
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight text-white">Secrétaire IA</div>
                <div className="text-[11px] leading-tight text-slate-400">Espace administrateur</div>
              </div>
            </div>
            <nav className="space-y-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <span className="text-base">{n.icone}</span>
                  <span className="flex-1">{n.label}</span>
                  {n.href === "/admin/demandes" && !!nouvellesDemandes && (
                    <span className="rounded-full bg-[#14B8A6] px-2 py-0.5 text-[11px] font-semibold text-white">
                      {nouvellesDemandes}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
            <div className="mt-auto space-y-1 pt-6">
              <Link
                href="/auth/set-password"
                className="block rounded-xl border border-white/10 px-3 py-2.5 text-left text-xs font-medium text-slate-400 transition hover:border-white/20 hover:text-white"
              >
                Changer mon mot de passe
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full rounded-xl border border-white/10 px-3 py-2.5 text-left text-xs font-medium text-slate-400 transition hover:border-white/20 hover:text-white"
                >
                  ↩ Se déconnecter
                </button>
              </form>
            </div>
          </div>
        </aside>
        <main className="min-w-0 flex-1 rounded-3xl border border-white/10 bg-slate-50/[0.97] p-6 shadow-2xl backdrop-blur-sm">
          {children}
        </main>
      </div>
    </div>
  );
}
