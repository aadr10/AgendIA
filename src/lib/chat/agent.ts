import Anthropic from "@anthropic-ai/sdk";
import { construirePromptSysteme } from "./prompt";
import { OUTILS, executerOutil } from "./tools";
import type { ContexteChat, ChatMessage } from "./types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODELE = "claude-sonnet-5";
const MAX_TOURS_OUTILS = 6;

export async function executerConversation(
  ctx: ContexteChat,
  historique: ChatMessage[],
  nouveauMessage: string
): Promise<{ reponse: string }> {
  const systemPrompt = construirePromptSysteme(ctx);

  const messages: Anthropic.MessageParam[] = [
    ...historique.map((m): Anthropic.MessageParam => ({ role: m.role, content: m.content })),
    { role: "user", content: nouveauMessage },
  ];

  for (let tour = 0; tour < MAX_TOURS_OUTILS; tour++) {
    const reponse = await anthropic.messages.create({
      model: MODELE,
      max_tokens: 1024,
      system: systemPrompt,
      tools: OUTILS,
      messages,
    });

    if (reponse.stop_reason !== "tool_use") {
      const texte = reponse.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return { reponse: texte || "Désolé, pouvez-vous reformuler votre demande ?" };
    }

    messages.push({ role: "assistant", content: reponse.content });

    const resultatsOutils: Anthropic.ToolResultBlockParam[] = [];
    for (const bloc of reponse.content) {
      if (bloc.type === "tool_use") {
        let resultat: unknown;
        try {
          resultat = await executerOutil(bloc.name, bloc.input as Record<string, unknown>, ctx);
        } catch (e) {
          resultat = { erreur: e instanceof Error ? e.message : "Erreur inattendue." };
        }
        resultatsOutils.push({
          type: "tool_result",
          tool_use_id: bloc.id,
          content: JSON.stringify(resultat),
        });
      }
    }
    messages.push({ role: "user", content: resultatsOutils });
  }

  return { reponse: "Désolé, je rencontre une difficulté technique. Pouvez-vous réessayer, ou appeler directement le cabinet ?" };
}
