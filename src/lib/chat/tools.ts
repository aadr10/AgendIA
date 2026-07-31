import type Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { creneauxDisponiblesPlage, praticiensPourPrestation } from "@/lib/disponibilites";
import { envoyerConfirmationRdv } from "@/lib/notifications";
import { toLocalISODate } from "@/lib/dates";
import type { ContexteChat } from "./types";

export const OUTILS: Anthropic.Tool[] = [
  {
    name: "voir_disponibilites",
    description:
      "Cherche les prochains créneaux libres pour une prestation, à partir d'une date donnée (ou aujourd'hui). Renvoie au maximum quelques créneaux répartis sur plusieurs jours.",
    input_schema: {
      type: "object",
      properties: {
        prestation_id: { type: "string", description: "id exact de la prestation" },
        praticien_id: { type: "string", description: "id exact du praticien si préférence, sinon omettre" },
        a_partir_du: { type: "string", description: "date YYYY-MM-DD à partir de laquelle chercher (défaut: aujourd'hui)" },
      },
      required: ["prestation_id"],
    },
  },
  {
    name: "chercher_patient",
    description:
      "Recherche une fiche patient existante par numéro de téléphone, pour personnaliser l'accueil et voir un éventuel rendez-vous à venir. Si plusieurs patients partagent ce numéro (ex: famille), donner aussi nom_patient pour préciser lequel.",
    input_schema: {
      type: "object",
      properties: {
        telephone: { type: "string" },
        nom_patient: { type: "string", description: "à fournir si plusieurs patients partagent ce numéro de téléphone" },
      },
      required: ["telephone"],
    },
  },
  {
    name: "creer_rdv",
    description: "Crée réellement un rendez-vous après que le patient a confirmé le créneau et donné ses coordonnées.",
    input_schema: {
      type: "object",
      properties: {
        prestation_id: { type: "string" },
        praticien_id: { type: "string" },
        jour: { type: "string", description: "YYYY-MM-DD" },
        heure: { type: "string", description: "HH:MM" },
        nom_patient: { type: "string" },
        telephone_patient: { type: "string" },
        email_patient: { type: "string" },
      },
      required: ["prestation_id", "praticien_id", "jour", "heure", "nom_patient", "telephone_patient"],
    },
  },
  {
    name: "deplacer_rdv",
    description:
      "Déplace le prochain rendez-vous à venir du patient (identifié par téléphone) vers un nouveau créneau. Si plusieurs patients partagent ce numéro (ex: famille), donner aussi nom_patient pour préciser lequel.",
    input_schema: {
      type: "object",
      properties: {
        telephone_patient: { type: "string" },
        nom_patient: { type: "string", description: "à fournir si plusieurs patients partagent ce numéro de téléphone" },
        nouveau_jour: { type: "string", description: "YYYY-MM-DD" },
        nouvelle_heure: { type: "string", description: "HH:MM" },
      },
      required: ["telephone_patient", "nouveau_jour", "nouvelle_heure"],
    },
  },
  {
    name: "annuler_rdv",
    description:
      "Annule le prochain rendez-vous à venir du patient (identifié par téléphone). Si plusieurs patients partagent ce numéro (ex: famille), donner aussi nom_patient pour préciser lequel.",
    input_schema: {
      type: "object",
      properties: {
        telephone_patient: { type: "string" },
        nom_patient: { type: "string", description: "à fournir si plusieurs patients partagent ce numéro de téléphone" },
      },
      required: ["telephone_patient"],
    },
  },
  {
    name: "inscrire_liste_attente",
    description: "Inscrit le patient sur la liste d'attente pour une prestation quand aucun créneau ne lui convient.",
    input_schema: {
      type: "object",
      properties: {
        telephone_patient: { type: "string" },
        nom_patient: { type: "string" },
        prestation_id: { type: "string" },
        praticien_id: { type: "string" },
        disponibilites_souhaitees: { type: "string", description: "ce que le patient a indiqué comme préférences" },
      },
      required: ["telephone_patient", "nom_patient", "prestation_id"],
    },
  },
];

// Un même numéro peut être partagé par plusieurs patients (ex: une famille) :
// on désambiguïse par nom quand plusieurs fiches correspondent au téléphone donné.
async function trouverPatient(
  supabase: ReturnType<typeof createAdminClient>,
  cabinetId: string,
  telephone: string,
  nomPatient?: string
): Promise<{ patient: { id: string; nom: string } | null; ambigu: boolean }> {
  const { data: correspondances } = await supabase
    .from("patients")
    .select("id, nom")
    .eq("cabinet_id", cabinetId)
    .eq("telephone", telephone);

  if (!correspondances || correspondances.length === 0) return { patient: null, ambigu: false };
  if (correspondances.length === 1) return { patient: correspondances[0], ambigu: false };

  if (nomPatient) {
    const cible = nomPatient.trim().toLowerCase();
    const trouve = correspondances.find((p) => p.nom.trim().toLowerCase() === cible);
    if (trouve) return { patient: trouve, ambigu: false };
  }
  return { patient: null, ambigu: true };
}

const JOURS_LABEL = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

function labelJour(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return `${JOURS_LABEL[d.getDay()]} ${d.getDate()} ${d.toLocaleDateString("fr-BE", { month: "long" })}`;
}

export async function executerOutil(
  nom: string,
  input: Record<string, unknown>,
  ctx: ContexteChat,
  canal: "chat" | "voix" = "chat"
): Promise<unknown> {
  const supabase = createAdminClient();
  const cabinetId = ctx.cabinet.id;

  if (nom === "voir_disponibilites") {
    const prestationId = input.prestation_id as string;
    const praticienId = (input.praticien_id as string) || null;
    const prestation = ctx.prestations.find((p) => p.id === prestationId);
    if (!prestation) return { erreur: "Prestation inconnue." };

    const debut = input.a_partir_du ? new Date((input.a_partir_du as string) + "T00:00:00") : new Date();
    const [{ data: regles }, praticienIdsResolus] = await Promise.all([
      supabase.from("regles").select("delai_min_reservation_heures").eq("cabinet_id", cabinetId).single(),
      praticiensPourPrestation(supabase, cabinetId, prestationId, praticienId),
    ]);

    // Échantillonne les créneaux d'une journée en couvrant matin ET après-midi
    // (plutôt que de ne garder que les tout premiers de la journée, qui sont
    // toujours le matin puisque la liste est triée chronologiquement).
    function echantillonner<T>(liste: T[], max: number): T[] {
      if (liste.length <= max) return liste;
      const pas = liste.length / max;
      return Array.from({ length: max }, (_, i) => liste[Math.floor(i * pas)]);
    }

    // Toute la plage de 21 jours est récupérée en 3 requêtes base de données
    // (pas 3 par jour) puis calculée en mémoire — critique pour la latence en
    // appel téléphonique en direct, où chaque aller-retour réseau supplémentaire
    // se traduit par du silence pendant que l'IA "réfléchit".
    const creneauxParJourMap = await creneauxDisponiblesPlage(supabase, {
      cabinetId,
      praticienIds: praticienIdsResolus,
      dureeMinutes: prestation.dureeMinutes,
      delaiMinHeures: regles?.delai_min_reservation_heures ?? 0,
      debut,
      nombreJours: 21,
    });
    const jours = Array.from({ length: 21 }, (_, i) => {
      const jour = new Date(debut);
      jour.setDate(jour.getDate() + i);
      return { jourISO: toLocalISODate(jour) };
    });

    const resultats: { jour: string; jour_libelle: string; heure: string; praticien_id: string; praticien_nom: string }[] = [];
    for (let i = 0; i < jours.length && resultats.length < 10; i++) {
      const { jourISO } = jours[i];
      for (const c of echantillonner(creneauxParJourMap.get(jourISO) ?? [], 8)) {
        resultats.push({
          jour: jourISO,
          jour_libelle: labelJour(jourISO),
          heure: c.heure,
          praticien_id: c.praticienId,
          praticien_nom: ctx.praticiens.find((p) => p.id === c.praticienId)?.nom ?? "",
        });
        if (resultats.length >= 10) break;
      }
    }
    return { creneaux: resultats };
  }

  if (nom === "chercher_patient") {
    const telephone = (input.telephone as string).trim();
    const nomPatient = (input.nom_patient as string | undefined)?.trim();
    const { patient, ambigu } = await trouverPatient(supabase, cabinetId, telephone, nomPatient);
    if (ambigu) return { trouve: false, ambigu: true };
    if (!patient) return { trouve: false };

    const { data: rdv } = await supabase
      .from("rendez_vous")
      .select("debut, prestations(nom), praticiens(nom)")
      .eq("cabinet_id", cabinetId)
      .eq("patient_id", patient.id)
      .eq("statut", "confirme")
      .gte("debut", new Date().toISOString())
      .order("debut", { ascending: true })
      .limit(1)
      .maybeSingle();

    return {
      trouve: true,
      nom: patient.nom,
      prochain_rdv: rdv
        ? {
            prestation: (rdv.prestations as unknown as { nom: string } | null)?.nom,
            praticien: (rdv.praticiens as unknown as { nom: string } | null)?.nom,
            debut: rdv.debut,
          }
        : null,
    };
  }

  if (nom === "creer_rdv") {
    const prestationId = input.prestation_id as string;
    const praticienId = input.praticien_id as string;
    const jour = input.jour as string;
    const heure = input.heure as string;
    const nomPatient = (input.nom_patient as string).trim();
    const telephone = (input.telephone_patient as string).trim();
    const email = ((input.email_patient as string) || "").trim();

    const prestation = ctx.prestations.find((p) => p.id === prestationId);
    const praticien = ctx.praticiens.find((p) => p.id === praticienId);
    if (!prestation || !praticien) return { succes: false, erreur: "Prestation ou praticien inconnu." };
    if (!nomPatient || !telephone) return { succes: false, erreur: "Nom et téléphone requis." };

    const [hh, mm] = heure.split(":").map(Number);
    const debut = new Date(jour + "T00:00:00");
    debut.setHours(hh, mm, 0, 0);
    const fin = new Date(debut.getTime() + prestation.dureeMinutes * 60000);

    const { data: regles } = await supabase
      .from("regles")
      .select("delai_min_reservation_heures, accepte_nouveaux_patients")
      .eq("cabinet_id", cabinetId)
      .single();

    const seuil = new Date(Date.now() + (regles?.delai_min_reservation_heures ?? 0) * 3600000);
    if (debut < seuil) return { succes: false, erreur: "Ce créneau ne respecte plus le délai minimum de réservation." };

    const { data: conflitsRdv } = await supabase
      .from("rendez_vous")
      .select("id")
      .eq("cabinet_id", cabinetId)
      .eq("praticien_id", praticienId)
      .neq("statut", "annule")
      .lt("debut", fin.toISOString())
      .gt("fin", debut.toISOString());
    if (conflitsRdv && conflitsRdv.length > 0) return { succes: false, erreur: "Ce créneau vient d'être pris. Il faut en proposer un autre." };

    const { data: conflitsBlocage } = await supabase
      .from("blocages")
      .select("id")
      .eq("cabinet_id", cabinetId)
      .or(`praticien_id.eq.${praticienId},praticien_id.is.null`)
      .lt("debut", fin.toISOString())
      .gt("fin", debut.toISOString());
    if (conflitsBlocage && conflitsBlocage.length > 0) return { succes: false, erreur: "Ce créneau n'est plus disponible." };

    const { data: patientExistant } = await supabase
      .from("patients")
      .select("id")
      .eq("cabinet_id", cabinetId)
      .eq("telephone", telephone)
      .eq("nom", nomPatient)
      .maybeSingle();
    if (!patientExistant && regles?.accepte_nouveaux_patients === false) {
      return { succes: false, erreur: "Le cabinet n'accepte pas de nouveaux patients actuellement." };
    }

    const { data: patient, error: ep } = await supabase
      .from("patients")
      .upsert({ cabinet_id: cabinetId, nom: nomPatient, telephone, email: email || null }, { onConflict: "cabinet_id,telephone,nom" })
      .select("id")
      .single();
    if (ep || !patient) return { succes: false, erreur: "Erreur lors de l'enregistrement du patient." };

    const { data: rdvCree, error: er } = await supabase
      .from("rendez_vous")
      .insert({
        cabinet_id: cabinetId,
        patient_id: patient.id,
        praticien_id: praticienId,
        prestation_id: prestationId,
        debut: debut.toISOString(),
        fin: fin.toISOString(),
        statut: "confirme",
        origine: canal === "voix" ? "ia_telephone" : "chat",
      })
      .select("id")
      .single();
    if (er || !rdvCree) return { succes: false, erreur: "Erreur lors de la création du rendez-vous." };

    await envoyerConfirmationRdv({
      cabinetId,
      cabinetSlug: ctx.cabinet.slug,
      rdvId: rdvCree.id,
      cabinetNom: ctx.cabinet.nom,
      couleurPrimaire: ctx.cabinet.couleurPrimaire,
      iaPrenom: ctx.cabinet.iaPrenom,
      patientId: patient.id,
      patientNom: nomPatient,
      patientEmail: email || undefined,
      patientTelephone: telephone,
      prestationNom: prestation.nom,
      praticienNom: praticien.nom,
      debut,
    });

    return {
      succes: true,
      recap: { prestation: prestation.nom, praticien: praticien.nom, jour_libelle: labelJour(jour), heure },
    };
  }

  if (nom === "deplacer_rdv") {
    const telephone = (input.telephone_patient as string).trim();
    const nomPatient = (input.nom_patient as string | undefined)?.trim();
    const nouveauJour = input.nouveau_jour as string;
    const nouvelleHeure = input.nouvelle_heure as string;

    const { patient, ambigu } = await trouverPatient(supabase, cabinetId, telephone, nomPatient);
    if (ambigu) return { succes: false, erreur: "Plusieurs patients partagent ce numéro : demander le nom du patient concerné." };
    if (!patient) return { succes: false, erreur: "Aucun patient trouvé avec ce numéro." };

    const { data: rdv } = await supabase
      .from("rendez_vous")
      .select("id, praticien_id, prestation_id, prestations(nom, duree_minutes), praticiens(nom)")
      .eq("cabinet_id", cabinetId)
      .eq("patient_id", patient.id)
      .eq("statut", "confirme")
      .gte("debut", new Date().toISOString())
      .order("debut", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!rdv) return { succes: false, erreur: "Aucun rendez-vous à venir trouvé pour ce patient." };

    const dureeMinutes = (rdv.prestations as unknown as { duree_minutes: number } | null)?.duree_minutes ?? 30;
    const [hh, mm] = nouvelleHeure.split(":").map(Number);
    const debut = new Date(nouveauJour + "T00:00:00");
    debut.setHours(hh, mm, 0, 0);
    const fin = new Date(debut.getTime() + dureeMinutes * 60000);

    const { data: conflits } = await supabase
      .from("rendez_vous")
      .select("id")
      .eq("cabinet_id", cabinetId)
      .eq("praticien_id", rdv.praticien_id)
      .neq("statut", "annule")
      .neq("id", rdv.id)
      .lt("debut", fin.toISOString())
      .gt("fin", debut.toISOString());
    if (conflits && conflits.length > 0) return { succes: false, erreur: "Ce nouveau créneau n'est pas libre." };

    await supabase.from("rendez_vous").update({ debut: debut.toISOString(), fin: fin.toISOString() }).eq("id", rdv.id);

    return {
      succes: true,
      recap: {
        prestation: (rdv.prestations as unknown as { nom: string } | null)?.nom,
        praticien: (rdv.praticiens as unknown as { nom: string } | null)?.nom,
        jour_libelle: labelJour(nouveauJour),
        heure: nouvelleHeure,
      },
    };
  }

  if (nom === "annuler_rdv") {
    const telephone = (input.telephone_patient as string).trim();
    const nomPatient = (input.nom_patient as string | undefined)?.trim();
    const { patient, ambigu } = await trouverPatient(supabase, cabinetId, telephone, nomPatient);
    if (ambigu) return { succes: false, erreur: "Plusieurs patients partagent ce numéro : demander le nom du patient concerné." };
    if (!patient) return { succes: false, erreur: "Aucun patient trouvé avec ce numéro." };

    const { data: regles } = await supabase
      .from("regles")
      .select("delai_annulation_heures")
      .eq("cabinet_id", cabinetId)
      .single();

    const { data: rdv } = await supabase
      .from("rendez_vous")
      .select("id, debut")
      .eq("cabinet_id", cabinetId)
      .eq("patient_id", patient.id)
      .eq("statut", "confirme")
      .gte("debut", new Date().toISOString())
      .order("debut", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!rdv) return { succes: false, erreur: "Aucun rendez-vous à venir trouvé pour ce patient." };

    const heuresRestantes = (new Date(rdv.debut).getTime() - Date.now()) / 3600000;
    const dansLeDelai = heuresRestantes >= (regles?.delai_annulation_heures ?? 24);

    await supabase.from("rendez_vous").update({ statut: "annule" }).eq("id", rdv.id);

    return { succes: true, dans_delai_annulation: dansLeDelai };
  }

  if (nom === "inscrire_liste_attente") {
    const telephone = (input.telephone_patient as string).trim();
    const nomPatient = (input.nom_patient as string).trim();
    const prestationId = input.prestation_id as string;
    const praticienId = (input.praticien_id as string) || null;

    const { data: patient, error: ep } = await supabase
      .from("patients")
      .upsert({ cabinet_id: cabinetId, nom: nomPatient, telephone }, { onConflict: "cabinet_id,telephone,nom" })
      .select("id")
      .single();
    if (ep || !patient) return { succes: false, erreur: "Erreur lors de l'enregistrement du patient." };

    const { error } = await supabase.from("liste_attente").insert({
      cabinet_id: cabinetId,
      patient_id: patient.id,
      prestation_id: prestationId,
      praticien_id: praticienId,
      disponibilites_souhaitees: (input.disponibilites_souhaitees as string) || null,
    });
    if (error) return { succes: false, erreur: "Erreur lors de l'inscription." };

    return { succes: true };
  }

  return { erreur: "Outil inconnu." };
}
