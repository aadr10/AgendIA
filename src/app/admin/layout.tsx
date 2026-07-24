import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";

const NAV = [
  { label: "Cabinets", href: "/admin" },
  { label: "Nouveau cabinet", href: "/admin/nouveau" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen text-slate-800" style={{ background: "#0F172A", fontFamily: "system-ui, sans-serif" }}>
      <div className="mx-auto flex max-w-6xl gap-6 p-4 lg:p-6">
        <aside className="hidden w-52 flex-shrink-0 md:block">
          <div className="mb-6 px-2">
            <div className="text-lg font-semibold text-white">Secrétaire IA</div>
            <div className="text-xs text-slate-400">Espace administrateur</div>
          </div>
          <nav className="space-y-1">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                {n.label}
              </Link>
            ))}
          </nav>
          <form action={logout} className="mt-8">
            <button type="submit" className="w-full rounded-lg border border-white/10 px-3 py-2 text-left text-xs text-slate-400 hover:text-white">
              Se déconnecter
            </button>
          </form>
        </aside>
        <main className="min-w-0 flex-1 rounded-2xl bg-slate-50 p-6">{children}</main>
      </div>
    </div>
  );
}
