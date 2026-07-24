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

async function praticiensPourPrestation(
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

export async function creneauxDisponiblesJour(
  supabase: SupabaseClient,
  params: {
    cabinetId: string;
    prestationId: string;
    praticienId: string | null;
    jour: Date;
    dureeMinutes: number;
    delaiMinHeures: number;
  }
): Promise<{ heure: string; praticienId: string }[]> {
  const { cabinetId, prestationId, praticienId, jour, dureeMinutes, delaiMinHeures } = params;

  const praticienIds = await praticiensPourPrestation(supabase, cabinetId, prestationId, praticienId);
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

  const occupe = (praticienId: string, debut: Date, fin: Date) => {
    const conflitRdv = (rdvs ?? []).some(
      (r) => r.praticien_id === praticienId && debut < new Date(r.fin) && new Date(r.debut) < fin
    );
    const conflitBlocage = (blocages ?? []).some(
      (b) =>
        (b.praticien_id === null || b.praticien_id === praticienId) &&
        debut < new Date(b.fin) &&
        new Date(b.debut) < fin
    );
    return conflitRdv || conflitBlocage;
  };

  const slotsParHeure = new Map<string, string>();

  for (const h of horaires ?? []) {
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
