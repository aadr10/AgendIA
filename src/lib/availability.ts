import type { SupabaseClient } from "@supabase/supabase-js";

export async function creneauLibre(
  supabase: SupabaseClient,
  params: {
    cabinetId: string;
    praticienId: string;
    debut: Date;
    fin: Date;
    excludeRdvId?: string;
  }
) {
  const { cabinetId, praticienId, debut, fin, excludeRdvId } = params;

  let requeteRdv = supabase
    .from("rendez_vous")
    .select("id")
    .eq("cabinet_id", cabinetId)
    .eq("praticien_id", praticienId)
    .neq("statut", "annule")
    .lt("debut", fin.toISOString())
    .gt("fin", debut.toISOString());
  if (excludeRdvId) requeteRdv = requeteRdv.neq("id", excludeRdvId);

  const { data: conflitsRdv } = await requeteRdv;
  if (conflitsRdv && conflitsRdv.length > 0) return false;

  const { data: conflitsBlocage } = await supabase
    .from("blocages")
    .select("id")
    .eq("cabinet_id", cabinetId)
    .or(`praticien_id.eq.${praticienId},praticien_id.is.null`)
    .lt("debut", fin.toISOString())
    .gt("fin", debut.toISOString());
  if (conflitsBlocage && conflitsBlocage.length > 0) return false;

  return true;
}

/**
 * Version simplifiée du moteur de disponibilités, utilisée uniquement par le
 * bouton "simuler replanification" de l'agenda. La version complète et
 * partagée (site patient, chat, voix) est prévue en Phase 3.
 */
export async function prochainCreneauLibre(
  supabase: SupabaseClient,
  params: {
    cabinetId: string;
    praticienId: string;
    dureeMinutes: number;
    apartirDe: Date;
  }
) {
  const { cabinetId, praticienId, dureeMinutes, apartirDe } = params;

  const { data: horaires } = await supabase
    .from("horaires")
    .select("jour_semaine, heure_debut, heure_fin")
    .eq("cabinet_id", cabinetId)
    .eq("praticien_id", praticienId);

  if (!horaires || horaires.length === 0) return null;

  for (let jourOffset = 0; jourOffset < 21; jourOffset++) {
    const jour = new Date(apartirDe);
    jour.setDate(jour.getDate() + jourOffset);
    jour.setHours(0, 0, 0, 0);
    const jourSemaine = jour.getDay();

    const horairesJour = horaires.filter((h) => h.jour_semaine === jourSemaine);
    for (const h of horairesJour) {
      const [hd, md] = h.heure_debut.split(":").map(Number);
      const [hf, mf] = h.heure_fin.split(":").map(Number);
      const finHoraire = new Date(jour);
      finHoraire.setHours(hf, mf, 0, 0);

      let curseur = new Date(jour);
      curseur.setHours(hd, md, 0, 0);
      if (curseur < apartirDe) {
        curseur = new Date(apartirDe);
        const reste = curseur.getMinutes() % 15;
        if (reste !== 0) curseur.setMinutes(curseur.getMinutes() + (15 - reste));
        curseur.setSeconds(0, 0);
      }

      while (curseur.getTime() + dureeMinutes * 60000 <= finHoraire.getTime()) {
        const fin = new Date(curseur.getTime() + dureeMinutes * 60000);
        if (await creneauLibre(supabase, { cabinetId, praticienId, debut: curseur, fin })) {
          return { debut: new Date(curseur), fin };
        }
        curseur = new Date(curseur.getTime() + 15 * 60000);
      }
    }
  }
  return null;
}
