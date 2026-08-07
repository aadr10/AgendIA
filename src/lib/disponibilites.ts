import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Moteur de disponibilités partagé (version Phase 3).
 * Utilisé par le site patient. La même logique sert de base à l'agenda pro
 * (src/lib/availability.ts) — à terme les deux fusionneront en un seul point
 * d'entrée commun à tous les canaux (site, chat, voix, agenda).
 *
 * horaires de travail − rendez-vous existants − blocages − délai minimum
 * de réservation = créneaux proposables.
 */

type Horaire = { praticien_id: string; heure_debut: string; heure_fin: string; jour_semaine?: number };
type Rdv = { praticien_id: string; debut: string; fin: string };
type Blocage = { praticien_id: string | null; debut: string; fin: string };

export async function praticiensPourPrestation(
  supabase: SupabaseClient,
  cabinetId: string,
  prestationId: string,
  praticienId: string | null
) {
  if (praticienId) return [praticienId];
  const { data } = await supabase
    .from("praticien_prestations")
    .select("praticien_id")
    .eq("cabinet_id", cabinetId)
    .eq("prestation_id", prestationId);
  return (data ?? []).map((d) => d.praticien_id as string);
}

function calculerCreneauxJour(
  horaires: Horaire[],
  rdvs: Rdv[],
  blocages: Blocage[],
  jour: Date,
  dureeMinutes: number,
  seuil: Date
): { heure: string; praticienId: string }[] {
  const occupe = (praticienId: string, debut: Date, fin: Date) => {
    const conflitRdv = rdvs.some(
      (r) => r.praticien_id === praticienId && debut < new Date(r.fin) && new Date(r.debut) < fin
    );
    const conflitBlocage = blocages.some(
      (b) =>
        (b.praticien_id === null || b.praticien_id === praticienId) &&
        debut < new Date(b.fin) &&
        new Date(b.debut) < fin
    );
    return conflitRdv || conflitBlocage;
  };

  const slotsParHeure = new Map<string, string>();

  for (const h of horaires) {
    const [hd, md] = h.heure_debut.split(":").map(Number);
    const [hf, mf] = h.heure_fin.split(":").map(Number);
    const finHoraire = new Date(jour);
    finHoraire.setHours(hf, mf, 0, 0);

    let curseur = new Date(jour);
    curseur.setHours(hd, md, 0, 0);

    while (curseur.getTime() + dureeMinutes * 60000 <= finHoraire.getTime()) {
      const heureStr = `${String(curseur.getHours()).padStart(2, "0")}:${String(curseur.getMinutes()).padStart(2, "0")}`;
      if (curseur >= seuil && !slotsParHeure.has(heureStr)) {
        const fin = new Date(curseur.getTime() + dureeMinutes * 60000);
        if (!occupe(h.praticien_id, curseur, fin)) {
          slotsParHeure.set(heureStr, h.praticien_id);
        }
      }
      curseur = new Date(curseur.getTime() + 30 * 60000);
    }
  }

  return Array.from(slotsParHeure.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([heure, praticienId]) => ({ heure, praticienId }));
}

export async function creneauxDisponiblesJour(
  supabase: SupabaseClient,
  params: {
    cabinetId: string;
    prestationId: string;
    praticienId: string | null;
    jour: Date;
    dureeMinutes: number;
    delaiMinHeures: number;
    praticienIdsResolus?: string[];
  }
): Promise<{ heure: string; praticienId: string }[]> {
  const { cabinetId, prestationId, praticienId, jour, dureeMinutes, delaiMinHeures } = params;

  const praticienIds =
    params.praticienIdsResolus ?? (await praticiensPourPrestation(supabase, cabinetId, prestationId, praticienId));
  if (praticienIds.length === 0) return [];

  const jourSemaine = jour.getDay();
  const jourFin = new Date(jour);
  jourFin.setDate(jourFin.getDate() + 1);

  const [{ data: horaires }, { data: rdvs }, { data: blocages }] = await Promise.all([
    supabase
      .from("horaires")
      .select("praticien_id, heure_debut, heure_fin")
      .eq("cabinet_id", cabinetId)
      .eq("jour_semaine", jourSemaine)
      .in("praticien_id", praticienIds),
    supabase
      .from("rendez_vous")
      .select("praticien_id, debut, fin")
      .eq("cabinet_id", cabinetId)
      .in("praticien_id", praticienIds)
      .neq("statut", "annule")
      .gte("debut", jour.toISOString())
      .lt("debut", jourFin.toISOString()),
    supabase
      .from("blocages")
      .select("praticien_id, debut, fin")
      .eq("cabinet_id", cabinetId)
      .lt("debut", jourFin.toISOString())
      .gt("fin", jour.toISOString()),
  ]);

  const seuil = new Date(Date.now() + delaiMinHeures * 3600000);
  return calculerCreneauxJour(horaires ?? [], rdvs ?? [], blocages ?? [], jour, dureeMinutes, seuil);
}

/**
 * Variante "plage de jours" : au lieu d'une requête base de données par jour
 * (ce qui, même en parallèle, reste 3 x N requêtes réseau), on récupère les
 * horaires/rdv/blocages de TOUTE la plage en 3 requêtes puis on calcule
 * chaque jour en mémoire. Utilisé par la recherche de créneaux du chat/voix
 * qui scanne jusqu'à 21 jours d'un coup — critique pour la latence en appel
 * téléphonique en direct.
 */
export async function creneauxDisponiblesPlage(
  supabase: SupabaseClient,
  params: {
    cabinetId: string;
    praticienIds: string[];
    dureeMinutes: number;
    delaiMinHeures: number;
    debut: Date;
    nombreJours: number;
  }
): Promise<Map<string, { heure: string; praticienId: string }[]>> {
  const { cabinetId, praticienIds, dureeMinutes, delaiMinHeures, debut, nombreJours } = params;

  const resultat = new Map<string, { heure: string; praticienId: string }[]>();
  if (praticienIds.length === 0) return resultat;

  const jourDebut = new Date(debut);
  jourDebut.setHours(0, 0, 0, 0);
  const jourFinPlage = new Date(jourDebut);
  jourFinPlage.setDate(jourFinPlage.getDate() + nombreJours);

  const [{ data: horaires }, { data: rdvs }, { data: blocages }] = await Promise.all([
    supabase
      .from("horaires")
      .select("praticien_id, heure_debut, heure_fin, jour_semaine")
      .eq("cabinet_id", cabinetId)
      .in("praticien_id", praticienIds),
    supabase
      .from("rendez_vous")
      .select("praticien_id, debut, fin")
      .eq("cabinet_id", cabinetId)
      .in("praticien_id", praticienIds)
      .neq("statut", "annule")
      .gte("debut", jourDebut.toISOString())
      .lt("debut", jourFinPlage.toISOString()),
    supabase
      .from("blocages")
      .select("praticien_id, debut, fin")
      .eq("cabinet_id", cabinetId)
      .lt("debut", jourFinPlage.toISOString())
      .gt("fin", jourDebut.toISOString()),
  ]);

  const toutesHoraires = (horaires ?? []) as Required<Horaire>[];
  const tousRdvs = (rdvs ?? []) as Rdv[];
  const tousBlocages = (blocages ?? []) as Blocage[];
  const seuil = new Date(Date.now() + delaiMinHeures * 3600000);

  for (let i = 0; i < nombreJours; i++) {
    const jour = new Date(jourDebut);
    jour.setDate(jour.getDate() + i);
    const jourFin = new Date(jour);
    jourFin.setDate(jourFin.getDate() + 1);
    const jourSemaine = jour.getDay();

    const horairesJour = toutesHoraires.filter((h) => h.jour_semaine === jourSemaine);
    const rdvsJour = tousRdvs.filter((r) => {
      const d = new Date(r.debut);
      return d >= jour && d < jourFin;
    });
    const blocagesJour = tousBlocages.filter((b) => new Date(b.debut) < jourFin && new Date(b.fin) > jour);

    const iso = `${jour.getFullYear()}-${String(jour.getMonth() + 1).padStart(2, "0")}-${String(jour.getDate()).padStart(2, "0")}`;
    resultat.set(iso, calculerCreneauxJour(horairesJour, rdvsJour, blocagesJour, jour, dureeMinutes, seuil));
  }

  return resultat;
}
