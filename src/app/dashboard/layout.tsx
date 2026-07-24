import Link from "next/link";
import { getSessionContext, METIER_LABELS } from "@/lib/cabinet";
import NavLinks from "./nav-links";
import MobileNav from "./mobile-nav";

const NAV_BASE = [
  { label: "Tableau de bord", href: "/dashboard" },
  { label: "Agenda", href: "/dashboard/agenda" },
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
  const { cabinet, profil } = await getSessionContext();
  const NAV = profil?.role === "admin" ? [...NAV_BASE, ...NAV_ADMIN] : NAV_BASE;

  return (
    <div
      className="min-h-screen text-slate-800"
      style={{ background: "#F1F4F3", fontFamily: "system-ui, sans-serif" }}
    >
      <div className="mx-auto flex max-w-6xl gap-6 p-4 lg:p-6">
        <aside className="hidden w-52 flex-shrink-0 md:block">
          <div className="mb-6 px-2">
            <Link href="/dashboard">
              <div className="text-lg font-semibold" style={{ color: "#0E5E63" }}>
                {cabinet.nom}
              </div>
            </Link>
            <div className="text-xs text-slate-400">
              {METIER_LABELS[cabinet.metier] ?? cabinet.metier} · {cabinet.ville}
            </div>
          </div>
          <NavLinks nav={NAV} />
          <div
            className="mt-8 rounded-xl p-4 text-xs"
            style={{ background: "#E3F2EC", color: "#0E5E63" }}
          >
            <div className="mb-1 font-semibold">{cabinet.ia_prenom} est en ligne</div>
            Interface connectée à vos données réelles.
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-4 md:hidden">
            <MobileNav nav={NAV} />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
