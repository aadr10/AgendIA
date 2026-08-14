import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatCard } from "@/components/ui";
import { OFFRE_BADGE, prixOffre, type Offre } from "@/lib/offres";
import { coutSmsEur, coutVoixEur, coutChatbotEur } from "@/lib/couts";
import BoutonRafraichir from "./refresh-button";

// Toujours recalculé à chaque visite, jamais de cache statique — les chiffres
// affichés ici doivent refléter l'usage réel du mois en cours à l'instant T.
export const dynamic = "force-dynamic";

export default async function RentabilitePage() {
  const supabase = createAdminClient();

  const now = new Date();
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
  const joursEcoules = now.getDate();
  const joursDansLeMois = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const [{ data: cabinets }, { data: notifs }, { data: appels }, { data: conversations }] = await Promise.all([
    supabase
      .from("cabinets")
      .select("id, nom, offre, sms_forfait_mensuel, minutes_incluses, numero_twilio, statut_abonnement")
      .order("nom"),
    supabase
      .from("notifications")
      .select("cabinet_id")
      .eq("canal", "sms")
      .eq("statut", "envoye")
      .gte("envoye_le", debutMois.toISOString()),
    supabase.from("appels").select("cabinet_id, duree_secondes").gte("debut", debutMois.toISOString()),
    supabase.from("messages").select("cabinet_id").eq("canal", "chat").gte("cree_le", debutMois.toISOString()),
  ]);

  const smsParCabinet = new Map<string, number>();
  for (const n of notifs ?? []) {
    smsParCabinet.set(n.cabinet_id, (smsParCabinet.get(n.cabinet_id) ?? 0) + 1);
  }
  const secondesParCabinet = new Map<string, number>();
  for (const a of appels ?? []) {
    secondesParCabinet.set(a.cabinet_id, (secondesParCabinet.get(a.cabinet_id) ?? 0) + (a.duree_secondes ?? 0));
  }
  const conversationsParCabinet = new Map<string, number>();
  for (const m of conversations ?? []) {
    conversationsParCabinet.set(m.cabinet_id, (conversationsParCabinet.get(m.cabinet_id) ?? 0) + 1);
  }

  const lignes = (cabinets ?? []).map((c) => {
    const offre = (c.offre ?? "site") as Offre;
    const aNumero = !!c.numero_twilio;
    const smsForfait = c.sms_forfait_mensuel ?? 250;
    const smsEnvoyes = smsParCabinet.get(c.id) ?? 0;
    const minutesConsommees = Math.round((secondesParCabinet.get(c.id) ?? 0) / 60);
    const minutesIncluses = c.minutes_incluses ?? 800;

    const conversations = conversationsParCabinet.get(c.id) ?? 0;

    const paye = prixOffre(offre, smsForfait) ?? 0;
    const coutSms = coutSmsEur(smsEnvoyes);
    const coutVoix = coutVoixEur(minutesConsommees, aNumero);
    const coutChatbot = coutChatbotEur(conversations);
    const coutTotal = coutSms + coutVoix + coutChatbot;
    const marge = paye - coutTotal;

    const smsProjetes = joursEcoules > 0 ? Math.round((smsEnvoyes / joursEcoules) * joursDansLeMois) : 0;
    const minutesProjetees = joursEcoules > 0 ? Math.round((minutesConsommees / joursEcoules) * joursDansLeMois) : 0;
    const risqueQuota = (smsForfait > 0 && smsProjetes >= smsForfait) || (aNumero && minutesIncluses > 0 && minutesProjetees >= minutesIncluses);

    return {
      id: c.id,
      nom: c.nom,
      offre,
      statut: c.statut_abonnement,
      aNumero,
      smsEnvoyes,
      smsForfait,
      minutesConsommees,
      minutesIncluses,
      conversations,
      paye,
      coutTotal,
      marge,
      risqueQuota,
    };
  });

  const totalPaye = lignes.reduce((s, l) => s + l.paye, 0);
  const totalCout = lignes.reduce((s, l) => s + l.coutTotal, 0);
  const totalMarge = totalPaye - totalCout;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Rentabilité</h1>
          <p className="text-sm text-slate-500">
            Coûts calculés avec les tarifs Twilio/Vapi réels · usage compté depuis le {debutMois.toLocaleDateString("fr-BE", { day: "numeric", month: "long" })} ·
            recalculé à chaque chargement de la page.
          </p>
        </div>
        <BoutonRafraichir />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Payé ce mois-ci" value={`${totalPaye.toFixed(2)} €`} />
        <StatCard label="Coût réel ce mois-ci" value={`${totalCout.toFixed(2)} €`} />
        <StatCard label="Marge nette" value={`${totalMarge.toFixed(2)} €`} accent={totalMarge >= 0 ? "#0E7C86" : "#B42318"} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-medium">Cabinet</th>
              <th className="px-4 py-3 font-medium">Offre</th>
              <th className="px-4 py-3 font-medium">Payé</th>
              <th className="px-4 py-3 font-medium">SMS ce mois</th>
              <th className="px-4 py-3 font-medium">Minutes IA</th>
              <th className="px-4 py-3 font-medium">Chatbot</th>
              <th className="px-4 py-3 font-medium">Coût réel</th>
              <th className="px-4 py-3 font-medium">Marge nette</th>
              <th className="px-4 py-3 font-medium">Quota</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lignes.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-slate-400">
                  Aucun cabinet.
                </td>
              </tr>
            )}
            {lignes.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/cabinets/${l.id}`} className="font-medium text-slate-800 hover:underline">
                    {l.nom}
                  </Link>
                  <div className="text-xs text-slate-400">{l.statut === "actif" ? "Actif" : l.statut === "essai" ? "Essai" : l.statut}</div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ background: OFFRE_BADGE[l.offre].bg, color: OFFRE_BADGE[l.offre].fg }}
                  >
                    {OFFRE_BADGE[l.offre].label}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">{l.paye.toFixed(2)} €</td>
                <td className="px-4 py-3 text-slate-600">
                  {l.smsEnvoyes} / {l.smsForfait}
                </td>
                <td className="px-4 py-3 text-slate-600">{l.aNumero ? `${l.minutesConsommees} / ${l.minutesIncluses} min` : "—"}</td>
                <td className="px-4 py-3 text-slate-600">{l.conversations} conv.</td>
                <td className="px-4 py-3 text-slate-600">{l.coutTotal.toFixed(2)} €</td>
                <td className={`px-4 py-3 font-semibold ${l.marge >= 0 ? "text-[#0E7C86]" : "text-[#B42318]"}`}>{l.marge.toFixed(2)} €</td>
                <td className="px-4 py-3">
                  {l.risqueQuota ? (
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">Va dépasser</span>
                  ) : (
                    <span className="text-xs text-slate-300">OK</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">
        Coût chatbot = nombre de conversations démarrées × 0,05€ (mesuré en vrai le 14/08/2026 sur une conversation de
        réservation complète, via l&apos;API count_tokens d&apos;Anthropic — pas un suivi par token exact, une estimation
        posée sur une vraie mesure). Taux de change USD/EUR fixé manuellement, à rafraîchir de temps en temps (voir{" "}
        <code className="rounded bg-slate-100 px-1">src/lib/couts.ts</code>).
      </p>
    </div>
  );
}
