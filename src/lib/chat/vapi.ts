import { OUTILS } from "./tools";
import { construirePromptSysteme } from "./prompt";
import type { ContexteChat } from "./types";

// Petites phrases dites pendant l'exécution d'un outil, pour combler le
// silence le temps que la base de données réponde (sinon blanc perceptible).
const PHRASES_ATTENTE: Record<string, string> = {
  voir_disponibilites: "Un instant, je regarde ça.",
  chercher_patient: "Je vérifie votre dossier.",
  creer_rdv: "Je vous confirme ça tout de suite.",
  deplacer_rdv: "Une seconde, je déplace ça.",
  annuler_rdv: "Je m'en occupe.",
  inscrire_liste_attente: "Je note ça.",
};

/** Convertit nos tools (format Anthropic) au format attendu par Vapi (proche d'OpenAI).
 * "chercher_patient" est exclu : le numéro de l'appelant est déjà connu automatiquement,
 * et la consultation du dossier ajoute un aller-retour inutile qui ralentit l'appel. */
function outilsPourVapi() {
  return OUTILS.filter((t) => t.name !== "chercher_patient").map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
    messages: [
      {
        type: "request-start" as const,
        content: PHRASES_ATTENTE[t.name] ?? "Un instant.",
      },
    ],
  }));
}

export function construireAssistantVapi(input: {
  ctx: ContexteChat;
  serverUrl: string;
  numeroAppelant?: string;
}) {
  const { ctx } = input;

  return {
    name: `${ctx.cabinet.nom} — ${ctx.cabinet.iaPrenom}`,
    metadata: { cabinetId: ctx.cabinet.id },
    firstMessage: ctx.cabinet.iaMessageAccueil || `${ctx.cabinet.nom}, bonjour ! Comment puis-je vous aider ?`,
    model: {
      provider: "anthropic",
      model: "claude-sonnet-5",
      maxTokens: 250,
      messages: [
        {
          role: "system" as const,
          content: construirePromptSysteme(ctx, { canal: "voix", numeroAppelant: input.numeroAppelant }),
        },
      ],
      tools: outilsPourVapi(),
    },
    voice: {
      provider: "azure",
      voiceId: "fr-FR-DeniseNeural",
      speed: 1.15,
    },
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "fr",
    },
    // Réglages de fluidité : réduit le temps mort avant que l'IA reprenne la
    // parole après que la personne a fini de parler (au lieu du défaut, plus
    // lent), et la laisse s'arrêter vite si on la coupe — pour un rythme de
    // conversation plus naturel, moins "en attente".
    startSpeakingPlan: {
      waitSeconds: 0.4,
    },
    stopSpeakingPlan: {
      numWords: 2,
    },
    backgroundSound: "office",
    server: {
      url: input.serverUrl,
      secret: process.env.VAPI_WEBHOOK_SECRET,
    },
    endCallPhrases: ["au revoir", "bonne journée", "à bientôt"],
  };
}
