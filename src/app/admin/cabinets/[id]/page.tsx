import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { metierConfig } from "@/lib/metiers";
import { StatCard, badgeStyle, STATUT_LABELS } from "@/components/ui";
import EditionCabinetAdmin from "./edition-client";
import { voirDashboardCabinet } from "../../actions";

function initiales(nom: string) {
  return nom.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

export default async function AdminCabinetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: cabinet } = await supabase.from("cabinets").select("*").eq("id", id).single();
  if (!cabinet) notFound();

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    { count: rdvAujourdhui },
    { count: appelsSemaine },
    { count: patients },
    { data: praticiens },
    { data: prestations },
    { data: prochains },
    { data: appelsData },
    { data: notifications },
  ] = await Promise.all([
    supabase.from("rendez_vous").select("*", { count: "exact", head: true }).eq("cabinet_id", id).gte("debut", todayStart.toISOString()).lt("debut", todayEnd.toISOString()).neq("statut", "annule"),
    supabase.from("appels").select("*", { count: "exact", head: true }).eq("cabinet_id", id).gte("debut", sevenDaysAgo.toISOString()),
    supabase.from("patients").select("*", { count: "exact", head: true }).eq("cabinet_id", id),
    supabase.from("praticiens").select("id, nom, role, actif").eq("cabinet_id", id).order("nom"),
    supabase.from("prestations").select("id, nom, duree_minutes, prix, actif").eq("cabinet_id", id).order("prix"),
    supabase.from("rendez_vous").select("debut, patients(nom), prestations(nom), praticiens(nom, couleur_agenda)").eq("cabinet_id", id).eq("statut", "confirme").gte("debut", now.toISOString()).order("debut", { ascending: true }).limit(8),
    supabase.from("appels").select("id, debut, resultat, patients(nom)").eq("cabinet_id", id).order("debut", { ascending: false }).limit(8),
    supabase.from("notifications").select("canal, statut").eq("cabinet_id", id).gte("envoye_le", sevenDaysAgo.toISOString()),
  ]);

  const { data: appelsMoisData } = await supabase
    .from("appels")
    .select("duree_secondes")
    .eq("cabinet_id", id)
    .gte("debut", debutMois.toISOString());
  const secondesConsommees = (appelsMoisData ?? []).reduce((total, a) => total + (a.duree_secondes ?? 0), 0);
  const minutesConsommees = Math.round(secondesConsommees / 60);
  const minutesIncluses = cabinet.minutes_incluses ?? 800;
  const tauxConsommation = minutesIncluses > 0 ? Math.round((minutesConsommees / minutesIncluses) * 100) : 0;

  // Projection : au rythme actuel, combien de minutes seront consommées d'ici la fin du mois.
  const joursEcoules = now.getDate();
  const joursDansLeMois = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const minutesProjetees = joursEcoules > 0 ? Math.round((minutesConsommees / joursEcoules) * joursDansLeMois) : 0;
  const tauxProjete = minutesIncluses > 0 ? Math.round((minutesProjetees / minutesIncluses) * 100) : 0;

  const appels = (appelsData ?? []).map((a) => ({
    id: a.id,
    patientNom: (a.patients as unknown as { nom: string } | null)?.nom ?? "Numéro inconnu",
    debut: a.debut,
    resultat: a.resultat,
  }));

  const notifTotal = (notifications ?? []).length;
  const notifEnvoyees = (notifications ?? []).filter((n) => n.statut === "envoye").length;
  const notifTauxReussite = notifTotal > 0 ? Math.round((notifEnvoyees / notifTotal) * 100) : null;

  const metier = metierConfig(cabinet.metier);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-xs text-slate-400 hover:underline">← Retour aux cabinets</Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">{cabinet.nom}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full px-2.5 py-0.5 font-medium" style={{ background: `${metier.couleur}1A`, color: metier.couleur }}>
              {metier.label}
            </span>
            {cabinet.ville && <span className="text-slate-400">{cabinet.ville}</span>}
            {cabinet.numero_twilio ? (
              <span className="rounded-full px-2.5 py-0.5 font-semibold" style={{ background: "#DCE9FB", color: "#1D4ED8" }}>★ Premium</span>
            ) : (
              <span className="rounded-full px-2.5 py-0.5 font-semibold" style={{ background: "#FCE3E1", color: "#B42318" }}>Site seul</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <form action={voirDashboardCabinet.bind(null, cabinet.id)}>
            <button type="submit" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300">
              Voir son dashboard →
            </button>
          </form>
          <a href={`/${cabinet.slug}`} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300">
            Voir son site ↗
          </a>
        </div>
      </div>

      <EditionCabinetAdmin
        cabinet={{
          id: cabinet.id,
          slug: cabinet.slug,
          nom: cabinet.nom,
          adresse: cabinet.adresse ?? "",
          ville: cabinet.ville ?? "",
          telephoneAffiche: cabinet.telephone_affiche ?? "",
          horairesTexte: cabinet.horaires_texte ?? "",
          couleurPrimaire: cabinet.couleur_primaire,
          couleurDouce: cabinet.couleur_douce,
          logoUrl: cabinet.logo_url,
          photoHeroUrl: cabinet.photo_hero_url,
          lienAvisGoogle: cabinet.lien_avis_google ?? "",
          iaPrenom: cabinet.ia_prenom,
          iaTon: cabinet.ia_ton,
          smsRappelActif: cabinet.sms_rappel_actif ?? true,
          smsForfaitMensuel: cabinet.sms_forfait_mensuel ?? 250,
        }}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="RDV aujourd'hui" value={rdvAujourdhui ?? 0} accent={metier.couleur} />
        <StatCard label="Appels traités (7 j)" value={appelsSemaine ?? 0} accent={metier.couleur} />
        <StatCard label="Patients enregistrés" value={patients ?? 0} />
        <StatCard label="Praticiens actifs" value={(praticiens ?? []).filter((p) => p.actif).length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white lg:col-span-3">
          <div className="border-b border-slate-100 px-5 py-4 font-medium text-slate-800">Prochains rendez-vous</div>
          <ul className="divide-y divide-slate-100">
            {(prochains ?? []).length === 0 && <li className="px-5 py-4 text-sm text-slate-400">Aucun rendez-vous à venir.</li>}
            {(prochains ?? []).map((r, i) => {
              const patient = (r.patients as unknown as { nom: string } | null)?.nom ?? "Patient";
              const presta = (r.prestations as unknown as { nom: string } | null)?.nom ?? "";
              const prat = r.praticiens as unknown as { nom: string; couleur_agenda: string } | null;
              const d = new Date(r.debut);
              return (
                <li key={i} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: prat?.couleur_agenda ?? metier.couleur }}>
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

        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <div className="mb-3 font-medium text-slate-800">Performance de l&apos;IA (7 derniers jours)</div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Appels traités</span>
              <span className="font-semibold text-slate-800">{appelsSemaine ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Notifications envoyées</span>
              <span className="font-semibold text-slate-800">
                {notifTauxReussite === null ? "—" : `${notifTauxReussite}% réussite`}
                {notifTotal > 0 && <span className="ml-1 font-normal text-slate-400">({notifEnvoyees}/{notifTotal})</span>}
              </span>
            </div>
            {notifTauxReussite !== null && notifTauxReussite < 90 && (
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Taux de réussite en dessous de 90% — vérifie la config email/SMS de ce cabinet.
              </div>
            )}
            {cabinet.numero_twilio && (
              <>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-slate-500">Minutes vocales consommées</span>
                  <span className="font-semibold text-slate-800">
                    {minutesConsommees} / {minutesIncluses} min
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Projection fin de mois</span>
                  <span className={`font-semibold ${tauxProjete >= 100 ? "text-amber-700" : "text-slate-800"}`}>
                    ~{minutesProjetees} min ({tauxProjete}%)
                  </span>
                </div>
                {tauxProjete >= 100 && (
                  <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    Au rythme actuel, ce cabinet va dépasser son forfait ce mois-ci — anticipe un ajustement
                    de prix au renouvellement, plutôt que d'attendre la fin du mois.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4 font-medium text-slate-800">Ce que l&apos;IA a traité récemment</div>
        <ul className="divide-y divide-slate-100">
          {appels.length === 0 && <li className="px-5 py-4 text-sm text-slate-400">Aucun appel pour le moment.</li>}
          {appels.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm text-slate-700">{a.patientNom}</div>
                <div className="text-xs text-slate-400">
                  {new Date(a.debut).toLocaleString("fr-BE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <span className="flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium" style={badgeStyle(a.resultat)}>
                {STATUT_LABELS[a.resultat] ?? a.resultat}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 font-medium text-slate-800">Praticiens</div>
          {(praticiens ?? []).length === 0 && <p className="text-sm text-slate-400">Aucun praticien.</p>}
          <ul className="space-y-2">
            {(praticiens ?? []).map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{p.nom} <span className="text-slate-400">· {p.role}</span></span>
                {!p.actif && <span className="text-xs text-slate-400">inactif</span>}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 font-medium text-slate-800">Prestations</div>
          {(prestations ?? []).length === 0 && <p className="text-sm text-slate-400">Aucune prestation.</p>}
          <ul className="space-y-2">
            {(prestations ?? []).map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{p.nom} <span className="text-slate-400">· {p.duree_minutes} min</span></span>
                <span className="font-medium text-slate-600">{p.prix.toFixed(2)} €</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
