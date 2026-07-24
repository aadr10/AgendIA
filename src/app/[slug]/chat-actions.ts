"use server";

import { construireContexteParSlug } from "@/lib/chat/contexte";
import { executerConversation } from "@/lib/chat/agent";
import type { ChatMessage } from "@/lib/chat/types";

export async function envoyerMessageChat(input: {
  slug: string;
  historique: ChatMessage[];
  message: string;
}): Promise<{ reponse: string } | { erreur: string }> {
  const ctx = await construireContexteParSlug(input.slug);
  if (!ctx) return { erreur: "Cabinet introuvable." };

  try {
    const res = await executerConversation(ctx, input.historique, input.message);
    return res;
  } catch (e) {
    return { erreur: e instanceof Error ? e.message : "Erreur inconnue." };
  }
}
