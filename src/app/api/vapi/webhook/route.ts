import { NextRequest, NextResponse } from "next/server";
import { construireContexteParNumeroTwilio, construireContexteParCabinetId } from "@/lib/chat/contexte";
import { construireAssistantVapi } from "@/lib/chat/vapi";
import { executerOutil } from "@/lib/chat/tools";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ContexteChat } from "@/lib/chat/types";

// Vapi envoie le numéro appelé en "message.phoneNumber.number" (au même niveau
// que "call", pas dedans) — on garde un repli sur "call.phoneNumber.number" au
// cas où un type d'événement plus ancien l'imbriquerait encore différemment.
function extraireNumeroAppele(message: Record<string, unknown> | undefined): string | undefined {
  if (!message) return undefined;
  const phoneNumberDirect = message.phoneNumber as { number?: string } | undefined;
  if (phoneNumberDirect?.number) return phoneNumberDirect.number;
  const call = message.call as Record<string, unknown> | undefined;
  const phoneNumberDansCall = call?.phoneNumber as { number?: string } | undefined;
  return phoneNumberDansCall?.number;
}

function extraireNumeroAppelant(message: Record<string, unknown> | undefined): string | undefined {
  if (!message) return undefined;
  const customerDirect = message.customer as { number?: string } | undefined;
  if (customerDirect?.number) return customerDirect.number;
  const call = message.call as Record<string, unknown> | undefined;
  const customerDansCall = call?.customer as { number?: string } | undefined;
  return customerDansCall?.number;
}

/** Résout le cabinet par numéro (vrai appel) puis, à défaut, par les
 * métadonnées de l'assistant (appel de test "web" dans le dashboard Vapi,
 * qui n'a pas de vrai numéro appelé). */
async function resoudreContexte(message: Record<string, unknown> | undefined): Promise<ContexteChat | null> {
  const numeroAppele = extraireNumeroAppele(message);
  if (numeroAppele) {
    const ctx = await construireContexteParNumeroTwilio(numeroAppele);
    if (ctx) return ctx;
  }

  const call = message?.call as Record<string, unknown> | undefined;
  const cabinetIdDirect = (call?.assistant as { metadata?: { cabinetId?: string } } | undefined)?.metadata?.cabinetId;
  if (cabinetIdDirect) return construireContexteParCabinetId(cabinetIdDirect);

  const assistantId = (call?.assistantId as string | undefined) ?? undefined;
  if (assistantId && process.env.VAPI_API_KEY) {
    try {
      const res = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
        headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}` },
      });
      if (res.ok) {
        const assistant = await res.json();
        const cabinetId = assistant?.metadata?.cabinetId;
        if (cabinetId) return construireContexteParCabinetId(cabinetId);
      }
    } catch {
      // ignore, retombera sur null ci-dessous
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const message = body?.message;
  const type = message?.type;

  console.log("[vapi webhook]", type, JSON.stringify(body));

  // "tool-calls" (création/annulation/déplacement de RDV) et "end-of-call-report"
  // (écriture en base) n'existent qu'APRÈS qu'on ait renvoyé notre secret dans la
  // réponse "assistant-request" — Vapi nous le renvoie alors dans ce header. On
  // rejette toute requête qui prétend être ces événements sans le bon secret,
  // pour empêcher quiconque de créer/annuler des RDV en appelant ce endpoint
  // directement sans jamais passer par un vrai appel téléphonique.
  if (type === "tool-calls" || type === "end-of-call-report") {
    const secretRecu = request.headers.get("x-vapi-secret");
    if (!process.env.VAPI_WEBHOOK_SECRET || secretRecu !== process.env.VAPI_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  if (type === "assistant-request") {
    const numeroAppele = extraireNumeroAppele(message);
    const numeroAppelant = extraireNumeroAppelant(message);

    if (!numeroAppele) {
      return NextResponse.json({ error: "Numéro appelé introuvable dans la requête." }, { status: 400 });
    }

    const ctx = await construireContexteParNumeroTwilio(numeroAppele);
    if (!ctx) {
      return NextResponse.json({ error: "Aucun cabinet ne correspond à ce numéro." }, { status: 404 });
    }

    const publicUrl = process.env.PUBLIC_TUNNEL_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const assistant = construireAssistantVapi({
      ctx,
      serverUrl: `${publicUrl}/api/vapi/webhook`,
      numeroAppelant,
    });

    return NextResponse.json({ assistant });
  }

  if (type === "tool-calls") {
    const ctx = await resoudreContexte(message);

    const toolCallList = (message.toolCallList ?? message.toolCalls ?? []) as {
      id: string;
      function: { name: string; arguments: string | Record<string, unknown> };
    }[];

    const results = await Promise.all(
      toolCallList.map(async (tc) => {
        if (!ctx) {
          return { toolCallId: tc.id, result: JSON.stringify({ erreur: "Contexte cabinet introuvable." }) };
        }
        try {
          const args =
            typeof tc.function.arguments === "string" ? JSON.parse(tc.function.arguments) : tc.function.arguments;
          const resultat = await executerOutil(tc.function.name, args, ctx, "voix");
          return { toolCallId: tc.id, result: JSON.stringify(resultat) };
        } catch (e) {
          return { toolCallId: tc.id, result: JSON.stringify({ erreur: e instanceof Error ? e.message : "Erreur inattendue." }) };
        }
      })
    );

    return NextResponse.json({ results });
  }

  if (type === "end-of-call-report") {
    const numeroAppelant = extraireNumeroAppelant(message) ?? "Numéro inconnu";
    const ctx = await resoudreContexte(message);

    if (ctx) {
      const admin = createAdminClient();
      const transcript = (message.transcript as string) ?? "";
      const dureeSecondes = Math.round((message.durationSeconds as number) ?? 0);
      const messagesStructures = ((message.artifact?.messages ?? []) as { role: string; message?: string }[])
        .filter((m) => m.message)
        .map((m) => ({ qui: m.role === "assistant" ? ctx.cabinet.iaPrenom : "Patient", texte: m.message }));

      let patientId: string | null = null;
      const { data: patient } = await admin
        .from("patients")
        .select("id")
        .eq("cabinet_id", ctx.cabinet.id)
        .eq("telephone", numeroAppelant)
        .maybeSingle();
      if (patient) patientId = patient.id;

      await admin.from("appels").insert({
        cabinet_id: ctx.cabinet.id,
        patient_id: patientId,
        numero_appelant: numeroAppelant,
        debut: new Date().toISOString(),
        duree_secondes: dureeSecondes,
        resultat: "info",
        transcription: messagesStructures.length ? messagesStructures : [{ qui: "Système", texte: transcript }],
      });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
