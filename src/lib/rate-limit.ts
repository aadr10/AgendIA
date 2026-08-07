// Anti-abus léger pour les endpoints publics (pas d'authentification) : chaque
// appel a un coût réel (tokens Claude, SMS, email). En mémoire process
// (best-effort sur serverless — remis à zéro à froid — mais suffit à bloquer
// un script naïf qui spammerait un endpoint public en boucle).
const compteurs = new Map<string, { compte: number; resetLe: number }>();

export function limiteAtteinte(cle: string, maxRequetes: number, fenetreMs: number): boolean {
  const maintenant = Date.now();
  const entree = compteurs.get(cle);
  if (!entree || maintenant > entree.resetLe) {
    compteurs.set(cle, { compte: 1, resetLe: maintenant + fenetreMs });
    return false;
  }
  entree.compte++;
  return entree.compte > maxRequetes;
}
