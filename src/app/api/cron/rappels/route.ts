import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { envoyerRappelRdv } from "@/lib/notifications";

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
      "id, debut, cabinet_id, patient_id, patients(nom, email, telephone), prestations(nom), praticiens(nom), cabinets(nom, couleur_primaire, ia_prenom)"
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
    const cabinet = r.cabinets as unknown as { nom: string; couleur_primaire: string; ia_prenom: string } | null;
    if (!patient?.email || !prestation || !praticien || !cabinet) continue;

    await envoyerRappelRdv({
      cabinetId: r.cabinet_id,
      cabinetNom: cabinet.nom,
      couleurPrimaire: cabinet.couleur_primaire,
      iaPrenom: cabinet.ia_prenom,
      patientId: r.patient_id,
      patientNom: patient.nom,
      patientEmail: patient.email,
      patientTelephone: patient.telephone,
      prestationNom: prestation.nom,
      praticienNom: praticien.nom,
      debut: new Date(r.debut),
    });
    envoyes++;
  }

  return NextResponse.json({ ok: true, rappelsEnvoyes: envoyes });
}
