"use server";

import { headers } from "next/headers";
import { construireContexteParSlug } from "@/lib/chat/contexte";
import { executerConversation } from "@/lib/chat/agent";
import { limiteAtteinte } from "@/lib/rate-limit";
import type { ChatMessage } from "@/lib/chat/types";

const MAX_MESSAGE_CARACTERES = 2000;
const MAX_HISTORIQUE_MESSAGES = 20;

export async function envoyerMessageChat(input: {
  slug: string;
  historique: ChatMessage[];
  message: string;
}): Promise<{ reponse: string } | { erreur: string }> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "inconnu";
  if (limiteAtteinte(`chat:${ip}`, 15, 5 * 60 * 1000)) {
    return { erreur: "Trop de messages envoyés d'un coup, réessayez dans quelques minutes." };
  }

  const message = input.message.slice(0, MAX_MESSAGE_CARACTERES);
  const historique = input.historique
    .slice(-MAX_HISTORIQUE_MESSAGES)
    .map((m) => ({ ...m, content: typeof m.content === "string" ? m.content.slice(0, MAX_MESSAGE_CARACTERES) : m.content }));

  const ctx = await construireContexteParSlug(input.slug);
  if (!ctx) return { erreur: "Cabinet introuvable." };

  try {
    const res = await executerConversation(ctx, historique, message);
    return res;
  } catch (e) {
    return { erreur: e instanceof Error ? e.message : "Erreur inconnue." };
  }
}
