import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { envoyerRappelRdv, envoyerDemandeAvis } from "@/lib/notifications";

// Route protégée par un secret, destinée à être appelée une fois par jour
// (Vercel Cron en production, ou manuellement en local pour tester).
export async function GET(request: NextRequest) {
  const secretParam = request.nextUrl.searchParams.get("secret");
  const authHeader = request.headers.get("authorization");
  const autorise = secretParam === process.env.CRON_SECRET || authHeader === `Bearer ${process.env.CRON_SECRET}`;
  if (!autorise) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const demain = new Date();
  demain.setDate(demain.getDate() + 1);
  demain.setHours(0, 0, 0, 0);
  const finDemain = new Date(demain);
  finDemain.setDate(finDemain.getDate() + 1);

  const { data: rdvs, error } = await supabase
    .from("rendez_vous")
    .select(
      "id, debut, cabinet_id, patient_id, patients(nom, email, telephone), prestations(nom), praticiens(nom), cabinets(slug, nom, couleur_primaire, ia_prenom, sms_rappel_actif)"
    )
    .eq("statut", "confirme")
    .gte("debut", demain.toISOString())
    .lt("debut", finDemain.toISOString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let envoyes = 0;
  for (const r of rdvs ?? []) {
    const patient = r.patients as unknown as { nom: string; email: string | null; telephone: string } | null;
    const prestation = r.prestations as unknown as { nom: string } | null;
    const praticien = r.praticiens as unknown as { nom: string } | null;
    const cabinet = r.cabinets as unknown as { slug: string; nom: string; couleur_primaire: string; ia_prenom: string; sms_rappel_actif: boolean } | null;
    if (!patient || (!patient.email && !patient.telephone) || !prestation || !praticien || !cabinet) continue;

    await envoyerRappelRdv({
      cabinetId: r.cabinet_id,
      cabinetSlug: cabinet.slug,
      rdvId: r.id,
      cabinetNom: cabinet.nom,
      couleurPrimaire: cabinet.couleur_primaire,
      iaPrenom: cabinet.ia_prenom,
      patientId: r.patient_id,
      patientNom: patient.nom,
      patientEmail: patient.email || undefined,
      patientTelephone: cabinet.sms_rappel_actif ? patient.telephone : undefined,
      prestationNom: prestation.nom,
      praticienNom: praticien.nom,
      debut: new Date(r.debut),
    });
    envoyes++;
  }

  // Passage 2 : les RDV d'hier encore "confirme" sont considérés honorés (pas annulés,
  // pas marqués absent) → on les clôture et on demande un avis Google si le cabinet en a un.
  // "demain" = début de demain, donc hier = demain - 2 jours, et sa fin = demain - 1 jour (début d'aujourd'hui).
  const hier = new Date(demain);
  hier.setDate(hier.getDate() - 2);
  const finHier = new Date(demain);
  finHier.setDate(finHier.getDate() - 1);

  const { data: rdvsHier } = await supabase
    .from("rendez_vous")
    .select("id, cabinet_id, patient_id, patients(nom, email), cabinets(nom, couleur_primaire, lien_avis_google)")
    .eq("statut", "confirme")
    .gte("debut", hier.toISOString())
    .lt("debut", finHier.toISOString());

  let avisEnvoyes = 0;
  for (const r of rdvsHier ?? []) {
    const patient = r.patients as unknown as { nom: string; email: string | null } | null;
    const cabinet = r.cabinets as unknown as { nom: string; couleur_primaire: string; lien_avis_google: string | null } | null;

    await supabase.from("rendez_vous").update({ statut: "termine" }).eq("id", r.id);

    if (patient?.email && cabinet?.lien_avis_google) {
      await envoyerDemandeAvis({
        cabinetId: r.cabinet_id,
        cabinetNom: cabinet.nom,
        couleurPrimaire: cabinet.couleur_primaire,
        lienAvisGoogle: cabinet.lien_avis_google,
        patientId: r.patient_id,
        patientNom: patient.nom,
        patientEmail: patient.email,
      });
      avisEnvoyes++;
    }
  }

  return NextResponse.json({ ok: true, rappelsEnvoyes: envoyes, rdvClotures: rdvsHier?.length ?? 0, avisEnvoyes });
}
