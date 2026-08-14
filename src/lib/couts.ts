// Coûts unitaires réels, vérifiés en direct via les API Twilio/Vapi (pas des
// estimations) — à re-vérifier périodiquement, ces tarifs évoluent.
// Dernière vérification : 2026-08-14 (pricing.twilio.com/v1/{Messaging,Voice}/Countries/BE).
//
// Twilio et Vapi facturent en USD, les offres sont vendues en EUR : le taux de
// change ci-dessous introduit un risque de change non couvert (voir note plus bas).

const USD_VERS_EUR = 0.867; // frankfurter.dev, 2026-08-14 — à rafraîchir de temps en temps

const SMS_USD = 0.1113; // pricing.twilio.com/v1/Messaging/Countries/BE — SMS sortant vers mobile belge
const APPEL_ENTRANT_USD_PAR_MIN = 0.0113; // pricing.twilio.com/v1/Voice/Countries/BE — appel entrant vers un numéro mobile belge
const VAPI_USD_PAR_MIN = 0.0975; // blended rate, échantillon réel de 7 appels — petit échantillon, à réviser avec plus de volume
const NUMERO_USD_PAR_MOIS = 1.25; // pricing.twilio.com/v1/PhoneNumbers/Countries/BE — location d'un numéro mobile belge

export const COUT_SMS_EUR = SMS_USD * USD_VERS_EUR;
export const COUT_APPEL_EUR_PAR_MIN = APPEL_ENTRANT_USD_PAR_MIN * USD_VERS_EUR;
export const COUT_VAPI_EUR_PAR_MIN = VAPI_USD_PAR_MIN * USD_VERS_EUR;
export const COUT_NUMERO_EUR_PAR_MOIS = NUMERO_USD_PAR_MOIS * USD_VERS_EUR;

// Coût réel voix (télépho + IA) pour un cabinet avec numéro Twilio (offre Premium).
export function coutVoixEur(minutesConsommees: number, aNumero: boolean): number {
  if (!aNumero) return 0;
  return minutesConsommees * (COUT_APPEL_EUR_PAR_MIN + COUT_VAPI_EUR_PAR_MIN) + COUT_NUMERO_EUR_PAR_MOIS;
}

export function coutSmsEur(smsEnvoyes: number): number {
  return smsEnvoyes * COUT_SMS_EUR;
}

// Coût chatbot (Claude Sonnet, appliqué à tous les cabinets quelle que soit
// l'offre) — mesuré en vrai le 2026-08-14 via l'API count_tokens d'Anthropic
// sur une vraie conversation de réservation complète (4 échanges + les 2
// aller-retours d'outils pour vérifier les dispos et créer le rdv) : environ
// 24 000 tokens d'entrée + 450 de sortie, tarif intro Sonnet 5 ($2/$10 par
// MTok, valable jusqu'au 31/08/2026 puis $3/$15). Pas de cache de prompt en
// place (agent.ts) — chaque conversation repart de zéro, coût plein tarif.
// Compté par conversation démarrée (voir chat-actions.ts), pas par message.
export const COUT_CHATBOT_EUR_PAR_CONVERSATION = 0.05;

export function coutChatbotEur(conversationsDemarrees: number): number {
  return conversationsDemarrees * COUT_CHATBOT_EUR_PAR_CONVERSATION;
}
