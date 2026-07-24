import { getSessionContext } from "@/lib/cabinet";
import PageHeader from "@/components/page-header";
import { StatCard, STATUT_LABELS } from "@/components/ui";

function initiales(nom: string) {
  return nom
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function DashboardPage() {
  const { supabase, cabinet } = await getSessionContext();

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

  const [
    { count: rdvAujourdhui },
    { count: appelsSemaine },
    { count: annulations },
    { count: patients },
    { data: rdvRecents },
    { data: appelsRecents },
    { data: prochains },
  ] = await Promise.all([
    supabase
      .from("rendez_vous")
      .select("*", { count: "exact", head: true })
      .eq("cabinet_id", cabinet.id)
      .gte("debut", todayStart.toISOString())
      .lt("debut", todayEnd.toISOString())
      .neq("statut", "annule"),
    supabase
      .from("appels")
      .select("*", { count: "exact", head: true })
      .eq("cabinet_id", cabinet.id)
      .gte("debut", sevenDaysAgo.toISOString()),
    supabase
      .from("rendez_vous")
      .select("*", { count: "exact", head: true })
      .eq("cabinet_id", cabinet.id)
      .eq("statut", "annule"),
    supabase
      .from("patients")
      .select("*", { count: "exact", head: true })
      .eq("cabinet_id", cabinet.id),
    supabase
      .from("rendez_vous")
      .select("cree_le, statut, origine, debut, patients(nom), prestations(nom)")
      .eq("cabinet_id", cabinet.id)
      .order("cree_le", { ascending: false })
      .limit(6),
    supabase
      .from("appels")
      .select("debut, resultat, patients(nom)")
      .eq("cabinet_id", cabinet.id)
      .order("debut", { ascending: false })
      .limit(4),
    supabase
      .from("rendez_vous")
      .select("debut, patients(nom), prestations(nom), praticiens(nom, couleur_agenda)")
      .eq("cabinet_id", cabinet.id)
      .eq("statut", "confirme")
      .gte("debut", now.toISOString())
      .order("debut", { ascending: true })
      .limit(6),
  ]);

  type Activite = { t: string; texte: string; couleur: string };
  const activite: Activite[] = [
    ...(rdvRecents ?? []).map((r): Activite => {
      const patient = (r.patients as unknown as { nom: string } | null)?.nom ?? "Patient";
      const presta = (r.prestations as unknown as { nom: string } | null)?.nom ?? "";
      const libelle =
        r.statut === "annule"
          ? `RDV annulé — ${patient} (${presta})`
          : r.statut === "deplace"
          ? `RDV déplacé — ${patient} (${presta})`
          : `RDV créé pour ${patient} — ${presta}`;
      return {
        t: new Date(r.cree_le).toLocaleString("fr-BE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
        texte: libelle,
        couleur: r.statut === "annule" ? "#C05E4E" : r.statut === "deplace" ? "#C4762A" : "#0E5E63",
      };
    }),
    ...(appelsRecents ?? []).map((a): Activite => {
      const patient = (a.patients as unknown as { nom: string } | null)?.nom ?? "Appelant inconnu";
      return {
        t: new Date(a.debut).toLocaleString("fr-BE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
        texte: `Appel de ${patient} — ${STATUT_LABELS[a.resultat] ?? a.resultat}`,
        couleur: "#40515C",
      };
    }),
  ]
    .sort((a, b) => (a.t < b.t ? 1 : -1))
    .slice(0, 7);

  return (
    <div className="space-y-6">
      <PageHeader title="Tableau de bord" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="RDV aujourd'hui" value={rdvAujourdhui ?? 0} sub="hors annulés" accent="#0E5E63" />
        <StatCard label="Appels traités (7 j)" value={appelsSemaine ?? 0} accent="#0E5E63" />
        <StatCard label="Annulations totales" value={annulations ?? 0} />
        <StatCard label="Patients enregistrés" value={patients ?? 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white lg:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="font-medium text-slate-800">
              Ce que {cabinet.ia_prenom} a fait pendant que vous soigniez
            </div>
            <span
              className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: "#E3F2EC", color: "#0E5E63" }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: "#0E5E63" }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#0E5E63" }} />
              </span>
              En ligne 24h/24
            </span>
          </div>
          <ul className="divide-y divide-slate-100">
            {activite.length === 0 && (
              <li className="px-5 py-4 text-sm text-slate-400">Aucune activité pour le moment.</li>
            )}
            {activite.map((a, i) => (
              <li key={i} className="flex items-start gap-3 px-5 py-3">
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: a.couleur }} />
                <div className="min-w-0">
                  <div className="text-sm text-slate-700">{a.texte}</div>
                  <div className="text-xs text-slate-400">{a.t}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white lg:col-span-2">
          <div className="border-b border-slate-100 px-5 py-4 font-medium text-slate-800">
            Prochains rendez-vous
          </div>
          <ul className="divide-y divide-slate-100">
            {(prochains ?? []).length === 0 && (
              <li className="px-5 py-4 text-sm text-slate-400">Aucun rendez-vous à venir.</li>
            )}
            {(prochains ?? []).map((r, i) => {
              const patient = (r.patients as unknown as { nom: string } | null)?.nom ?? "Patient";
              const presta = (r.prestations as unknown as { nom: string } | null)?.nom ?? "";
              const prat = r.praticiens as unknown as { nom: string; couleur_agenda: string } | null;
              const d = new Date(r.debut);
              return (
                <li key={i} className="flex items-center gap-3 px-5 py-3">
                  <span
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ background: prat?.couleur_agenda ?? "#0E5E63" }}
                  >
                    {prat ? initiales(prat.nom) : "?"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-800">{patient}</div>
                    <div className="text-xs text-slate-500">
                      {presta} · {d.toLocaleDateString("fr-BE", { weekday: "short", day: "numeric" })} · {d.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
