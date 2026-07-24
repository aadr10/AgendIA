import { getSessionContext } from "@/lib/cabinet";
import PageHeader from "@/components/page-header";
import AgendaClient from "./agenda-client";
import AgendaNav from "./agenda-nav";
import MonthView from "./month-view";
import YearView from "./year-view";
import { toLocalISODate, parseLocalISODate, lundiDeLaSemaine, debutDuMois } from "@/lib/dates";

type Vue = "jour" | "semaine" | "mois" | "annee";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; date?: string }>;
}) {
  const { vue: vueParam, date: dateParam } = await searchParams;
  const vue: Vue = (["jour", "semaine", "mois", "annee"].includes(vueParam ?? "") ? vueParam : "semaine") as Vue;
  const dateRef = dateParam ? parseLocalISODate(dateParam) : new Date();

  const { supabase, cabinet } = await getSessionContext();

  const [{ data: praticiens }, { data: prestations }] = await Promise.all([
    supabase
      .from("praticiens")
      .select("id, nom, couleur_agenda")
      .eq("cabinet_id", cabinet.id)
      .eq("actif", true)
      .order("nom"),
    supabase
      .from("prestations")
      .select("id, nom, duree_minutes, prix")
      .eq("cabinet_id", cabinet.id)
      .eq("actif", true)
      .order("prix"),
  ]);

  if (vue === "annee") {
    return (
      <div className="space-y-4">
        <PageHeader title="Agenda" />
        <AgendaNav vue={vue} dateISO={toLocalISODate(dateRef)} />
        <YearView annee={dateRef.getFullYear()} />
      </div>
    );
  }

  if (vue === "mois") {
    const premierDuMois = debutDuMois(dateRef);
    const grilleDebut = lundiDeLaSemaine(premierDuMois);
    const dernierDuMois = new Date(premierDuMois.getFullYear(), premierDuMois.getMonth() + 1, 0);
    const grilleFin = new Date(dernierDuMois);
    grilleFin.setDate(grilleFin.getDate() + (7 - ((dernierDuMois.getDay() + 6) % 7)));

    const { data: rdvsData } = await supabase
      .from("rendez_vous")
      .select("debut, praticien_id")
      .eq("cabinet_id", cabinet.id)
      .neq("statut", "annule")
      .gte("debut", grilleDebut.toISOString())
      .lt("debut", grilleFin.toISOString());

    return (
      <div className="space-y-4">
        <PageHeader title="Agenda" />
        <AgendaNav vue={vue} dateISO={toLocalISODate(dateRef)} />
        <MonthView
          moisISO={toLocalISODate(premierDuMois)}
          praticiens={praticiens ?? []}
          rdvs={(rdvsData ?? []).map((r) => ({ debut: r.debut, praticienId: r.praticien_id }))}
        />
      </div>
    );
  }

  const dateDebut = vue === "jour" ? dateRef : lundiDeLaSemaine(dateRef);
  const nbJours = vue === "jour" ? 1 : 6;
  const dateFin = new Date(dateDebut);
  dateFin.setDate(dateFin.getDate() + nbJours);

  const [{ data: rdvsData }, { data: blocagesData }] = await Promise.all([
    supabase
      .from("rendez_vous")
      .select(
        "id, debut, fin, statut, origine, patient_id, praticien_id, prestation_id, patients(nom), prestations(nom, duree_minutes)"
      )
      .eq("cabinet_id", cabinet.id)
      .neq("statut", "annule")
      .gte("debut", dateDebut.toISOString())
      .lt("debut", dateFin.toISOString()),
    supabase
      .from("blocages")
      .select("id, praticien_id, debut, fin, motif")
      .eq("cabinet_id", cabinet.id)
      .gte("debut", dateDebut.toISOString())
      .lt("debut", dateFin.toISOString()),
  ]);

  const rdvs = (rdvsData ?? []).map((r) => ({
    id: r.id,
    debut: r.debut,
    fin: r.fin,
    statut: r.statut,
    origine: r.origine,
    patientId: r.patient_id,
    praticienId: r.praticien_id,
    prestationId: r.prestation_id,
    patientNom: (r.patients as unknown as { nom: string } | null)?.nom ?? "Patient",
    prestationNom: (r.prestations as unknown as { nom: string } | null)?.nom ?? "",
    dureeMinutes: (r.prestations as unknown as { duree_minutes: number } | null)?.duree_minutes ?? 30,
  }));

  const blocages = (blocagesData ?? []).map((b) => ({
    id: b.id,
    praticienId: b.praticien_id,
    debut: b.debut,
    fin: b.fin,
    motif: b.motif,
  }));

  return (
    <div className="space-y-4">
      <PageHeader title="Agenda" />
      <AgendaNav vue={vue} dateISO={toLocalISODate(dateDebut)} />
      <AgendaClient
        semaineDebutISO={toLocalISODate(dateDebut)}
        nbJours={nbJours}
        praticiens={praticiens ?? []}
        prestations={prestations ?? []}
        rdvsInitiaux={rdvs}
        blocagesInitiaux={blocages}
      />
    </div>
  );
}
