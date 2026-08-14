// Le serveur (Vercel) tourne en UTC par défaut, alors que toute l'app construit
// des dates avec des chaînes sans fuseau (ex: `new Date("2026-08-15T00:00:00")`)
// en supposant l'heure belge — sans ça, chaque rendez-vous était décalé de 1-2h
// (été/hiver) entre ce que dit l'IA au patient et ce qui est réellement stocké.
// `TZ` est un nom de variable d'environnement réservé chez Vercel (impossible à
// définir depuis les Project Settings) — on la fixe donc ici, au démarrage de
// chaque instance serveur, avant que la moindre ligne de code applicatif tourne.
export function register() {
  process.env.TZ = "Europe/Brussels";
}
