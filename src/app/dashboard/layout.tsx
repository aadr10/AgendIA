import Link from "next/link";
import { getSessionContext, METIER_LABELS } from "@/lib/cabinet";
import { logout } from "@/app/login/actions";
import { quitterVueDashboard } from "@/app/admin/actions";
import NavLinks from "./nav-links";
import MobileNav from "./mobile-nav";

const NAV_BASE = [
  { label: "Tableau de bord", href: "/dashboard" },
  { label: "Agenda", href: "/dashboard/agenda" },
  { label: "Liste d'attente", href: "/dashboard/liste-attente" },
  { label: "Appels", href: "/dashboard/appels" },
  { label: "Secrétaire IA", href: "/dashboard/secretaire-ia" },
  { label: "Praticiens", href: "/dashboard/praticiens" },
  { label: "Prestations", href: "/dashboard/prestations" },
  { label: "Site internet", href: "/dashboard/site-internet" },
];

const NAV_ADMIN = [{ label: "Accès équipe", href: "/dashboard/equipe" }];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { cabinet, profil, vueAdmin } = await getSessionContext();
  const NAV = profil?.role === "admin" ? [...NAV_BASE, ...NAV_ADMIN] : NAV_BASE;

  return (
    <div
      className="min-h-screen text-slate-800"
      style={{ background: "#F1F4F3", fontFamily: "system-ui, sans-serif" }}
    >
      {vueAdmin && (
        <div className="flex items-center justify-center gap-3 px-4 py-2 text-xs font-medium text-white" style={{ background: "#0E5E63" }}>
          <span>👁️ Vous consultez le dashboard de {cabinet.nom} en tant qu&apos;admin</span>
          <form action={quitterVueDashboard}>
            <button type="submit" className="underline hover:no-underline">
              Quitter cette vue
            </button>
          </form>
        </div>
      )}
      <div className="mx-auto flex max-w-6xl gap-6 p-4 lg:p-6">
        <aside className="hidden w-52 flex-shrink-0 md:block">
          <div className="mb-6 px-2">
            <Link href="/dashboard">
              <div className="text-lg font-semibold" style={{ color: cabinet.couleur_primaire }}>
                {cabinet.nom}
              </div>
            </Link>
            <div className="text-xs text-slate-400">
              {METIER_LABELS[cabinet.metier] ?? cabinet.metier} · {cabinet.ville}
            </div>
          </div>
          <NavLinks nav={NAV} couleurPrimaire={cabinet.couleur_primaire} />
          <div
            className="mt-8 rounded-xl p-4 text-xs"
            style={{ background: cabinet.couleur_douce, color: cabinet.couleur_primaire }}
          >
            <div className="mb-1 font-semibold">{cabinet.ia_prenom} est en ligne</div>
            Interface connectée à vos données réelles.
          </div>

          {!vueAdmin && (
            <div className="mt-6 space-y-1 border-t border-slate-200 pt-4">
              <Link
                href="/auth/set-password"
                className="block rounded-lg px-3 py-2 text-left text-xs text-slate-400 transition hover:text-slate-600"
              >
                Changer mon mot de passe
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full rounded-lg px-3 py-2 text-left text-xs text-slate-400 transition hover:text-slate-600"
                >
                  ↩ Se déconnecter
                </button>
              </form>
            </div>
          )}
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-4 flex items-center gap-2 md:hidden">
            <div className="flex-1">
              <MobileNav nav={NAV} />
            </div>
            {!vueAdmin && (
              <form action={logout}>
                <button
                  type="submit"
                  className="flex-shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500"
                >
                  ↩ Déconnexion
                </button>
              </form>
            )}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
