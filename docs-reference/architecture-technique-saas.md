# 🏗️ Architecture technique — SaaS Secrétaire IA
*Version du 14 juillet 2026 — compagnon du document de référence. Définit comment rendre les prototypes 100 % opérationnels, multi-tenant, avec onboarding d'un nouveau praticien en quelques clics.*

---

## 1. Le principe qui gouverne tout : config-driven

Tout le système repose sur une seule idée. Chaque cabinet est **une ligne de configuration dans la base de données**, et absolument tout (le site, le chat, la voix, les emails, les SMS) lit cette configuration au moment de servir le client. Personne ne touche jamais au code pour ajouter un cabinet.

Concrètement, quand un patient appelle le 071 XX XX XX, le système regarde « à quel cabinet appartient ce numéro ? », charge sa config (prénom de l'IA, prestations, horaires, FAQ, règles) et l'IA parle avec cette identité. Quand un patient visite `tonlogiciel.be/cabinet-dupont`, même mécanique : le slug `cabinet-dupont` charge la config et habille le site. Un seul code, un seul déploiement, cent clients.

C'est ça qui rend possible ton « 4-5 clics » : ajouter un client = créer une ligne de config, rien d'autre.

---

## 2. La stack recommandée (choix tranchés, pas de débat sans fin)

| Brique | Choix | Pourquoi |
|---|---|---|
| Application web (interface pro + sites patients) | **Next.js** hébergé sur **Vercel** | Un seul projet gère les deux interfaces ; les sites patients sont des routes dynamiques `/[slug]` ; déploiement automatique |
| Base de données + authentification + stockage fichiers | **Supabase** (PostgreSQL) | BDD sérieuse, auth intégrée (login des kinés), stockage des logos/photos, temps réel pour l'agenda, RGPD-compatible (région EU) |
| Cerveau IA (chat + voix) | **API Claude** (Anthropic) | Le même « cerveau » sert les deux canaux (voir §5) |
| Téléphonie (numéros + appels + SMS) | **Twilio** | Achat de numéros belges par API (1 clic dans ton onboarding), gestion des appels, envoi SMS |
| Agent vocal temps réel | **Vapi** (ou Retell AI) | Plateforme qui gère le trio parole→texte→IA→parole avec une latence naturelle ; se branche sur Twilio et sur ton backend ; évite 6 mois de R&D audio |
| Emails transactionnels | **Resend** ou **Brevo** | Confirmations, rappels, liens de replanification |
| Paiement des abonnements | **Stripe** | Abonnement 129,99 €/mois, essai 14 jours, facturation des dépassements de minutes |

Règle d'or de ce projet : on n'invente rien de ce qui existe déjà. La seule chose qu'on construit nous-mêmes, c'est le métier (agenda, règles, cerveau conversationnel, multi-tenant). Tout le reste (audio temps réel, télécom, paiement), on assemble.

---

## 3. Schéma de base de données (PostgreSQL / Supabase)

Toutes les tables portent un `cabinet_id` : c'est la clé du multi-tenant, chaque requête est filtrée dessus (avec les Row Level Security de Supabase pour qu'un cabinet ne puisse jamais voir les données d'un autre).

**cabinets** — le cœur du white-label
`id, slug (cabinet-dupont), nom, metier (kine/osteo/barber…), logo_url, photo_hero_url, couleur_primaire, couleur_douce, telephone_affiche, numero_twilio (le numéro que décroche l'IA), adresse, ville, email, ia_prenom, ia_ton, ia_message_accueil, horaires_texte, statut_abonnement, minutes_incluses, minutes_consommees`

**users** — les comptes de connexion des pros
`id, cabinet_id, email, role (admin/praticien)`

**praticiens**
`id, cabinet_id, nom, photo_url, couleur_agenda, actif`

**horaires** — les disponibilités de travail
`id, praticien_id, jour_semaine (0-6), heure_debut, heure_fin`

**prestations**
`id, cabinet_id, nom, duree_minutes, prix, actif`
+ table de liaison **praticien_prestations** (qui fait quoi)

**patients** — fiche auto-créée à chaque réservation
`id, cabinet_id, nom, telephone (clé unique par cabinet), email, cree_le, notes`

**rendez_vous**
`id, cabinet_id, patient_id, praticien_id, prestation_id, debut, fin, statut (confirme/annule/deplace/termine/absent), origine (ia_telephone/site/chat/manuel), cree_le`

**blocages** — congés et imprévus
`id, cabinet_id, praticien_id (null = tout le cabinet), debut, fin, motif`

**appels**
`id, cabinet_id, patient_id, numero_appelant, debut, duree_secondes, resultat (rdv_cree/deplace/annule/info/transfert), transcription (JSON), audio_url`

**messages** — conversations du chat web
`id, cabinet_id, patient_id, canal, contenu (JSON), cree_le`

**faq**
`id, cabinet_id, question, reponse`

**regles** — les interrupteurs de l'IA
`cabinet_id, delai_min_reservation_heures, delai_annulation_heures, accepte_nouveaux_patients, confirmation_auto, transfert_humain_numero`

**liste_attente**
`id, cabinet_id, patient_id, prestation_id, praticien_id (optionnel), disponibilites_souhaitees, cree_le`

**notifications**
`id, cabinet_id, patient_id, type (confirmation/rappel/replanification), canal (sms/email), statut, envoye_le`

---

## 4. Le moteur de disponibilités (la fonction la plus importante du SaaS)

Une seule fonction, `get_creneaux_disponibles(cabinet, prestation, praticien?, periode)`, utilisée PARTOUT : par le site de réservation, par le chat, par l'IA vocale et par l'agenda du pro. Elle calcule :

horaires de travail du praticien − rendez-vous existants − blocages/congés − délai minimum de réservation (règle du cabinet) = créneaux proposables.

Elle vit dans le backend (API), jamais dupliquée. Si elle est juste, tout le produit est juste ; c'est elle qu'on teste le plus. Corollaire : toute création de RDV passe par une seule fonction `creer_rdv(...)` qui revérifie la disponibilité au moment T (pour éviter que deux patients réservent le même créneau à la même seconde) puis déclenche la fiche patient + la notification.

---

## 5. Le cerveau IA : un seul agent, deux bouches

Le chat du site et la voix au téléphone utilisent **exactement le même agent**. Seul le canal change.

L'agent = API Claude + un prompt système généré depuis la config du cabinet (« Tu es {ia_prenom}, secrétaire du cabinet {nom}, {metier} à {ville}. Ton : {ton}. Prestations : … FAQ : … Règles : … ») + des **outils** qu'il peut appeler :

- `chercher_patient(telephone)` → reconnaissance de l'appelant (« Bonjour Anna, je vois votre séance de lundi »)
- `voir_disponibilites(prestation, praticien?, periode)`
- `creer_rdv(...)`, `deplacer_rdv(...)`, `annuler_rdv(...)`
- `inscrire_liste_attente(...)`
- `transferer_humain()` → bascule l'appel vers le numéro du praticien
- `envoyer_confirmation(...)`

**Canal chat :** le widget du site appelle notre API, qui appelle Claude avec ces outils. Simple.

**Canal voix :** Twilio reçoit l'appel sur le `numero_twilio` du cabinet → le passe à Vapi → Vapi gère la reconnaissance vocale et la synthèse vocale en temps réel, et à chaque tour de parole interroge notre agent (même prompt, mêmes outils). Latence cible < 1 seconde pour que la conversation soit naturelle. Chaque appel est transcrit et enregistré dans la table `appels` → c'est ce qui alimente l'onglet « Appels » de l'interface pro.

Garde-fous non négociables du prompt : jamais de conseil médical ; si urgence ou détresse → transfert humain immédiat ; si l'IA ne sait pas → elle le dit et propose le transfert ; elle ne confirme jamais un RDV sans l'avoir réellement créé via l'outil.

---

## 6. L'onboarding « 4-5 clics » (ton exigence, traduite en produit)

Assistant de création d'un nouveau cabinet, 5 écrans :

1. **Identité** — nom du cabinet, métier (choisir « kiné », « ostéo », « barber »… pré-remplit prestations types + vocabulaire), ville, adresse, email. Upload logo + photo de fond, choix des 2 couleurs. → le slug et le mini-site sont générés instantanément.
2. **Équipe & horaires** — ajout des praticiens et de leurs horaires de travail.
3. **Prestations** — la liste pré-remplie selon le métier, il ajuste noms/durées/prix.
4. **Secrétaire IA** — prénom, ton, message d'accueil (pré-rédigé, modifiable), FAQ de départ, règles (délais, confirmation auto, numéro de transfert humain).
5. **Numéro de téléphone** — UN BOUTON : « Attribuer un numéro ». Derrière, l'API Twilio achète un numéro belge (~1-5 €/mois) et le lie au `cabinet_id`. Le kiné met ce numéro sur sa vitrine/Google, ou fait renvoyer son numéro historique vers celui-ci (renvoi d'appel classique, 2 minutes chez son opérateur). → **l'IA décroche immédiatement.**

Puis Stripe : carte bancaire, essai 14 jours, et le cabinet est en production. Temps total réaliste : 10-15 minutes, dont l'essentiel est du remplissage de formulaire par le client lui-même.

---

## 7. Coûts et marge (à 129,99 €/mois par cabinet)

Ordres de grandeur mensuels par cabinet actif : numéro Twilio ~1-5 € ; minutes vocales (télécom + STT + Claude + TTS via Vapi) ~0,10-0,25 €/min soit ~20-50 € pour 200 minutes réelles typiques ; SMS ~0,05-0,10 €/unité soit ~10-20 € ; emails ~0 € ; hébergement/BDD mutualisés ~quelques € par cabinet. **Coût total typique : 35-80 €/cabinet/mois → marge brute ~50-95 €/cabinet.** Le plafond de 800 minutes et la facturation des dépassements (~0,35 €/min) protègent la marge contre les gros consommateurs.

---

## 8. Sécurité & RGPD (obligatoire, pas optionnel)

Données hébergées en région UE (Supabase EU, Twilio EU). Un patient chez un kiné = donnée de santé par contexte : chiffrement au repos et en transit, Row Level Security par cabinet, journal des accès. Mentions légales sur le site de chaque cabinet + annonce en début d'appel (« cet appel peut être enregistré ») + consentement SMS/email à la réservation. Droit à l'effacement : fonction de suppression d'une fiche patient et de ses données. Contrat de sous-traitance (DPA) entre toi et chaque cabinet — modèle standard à faire relire une fois par un juriste.

---

## 9. Plan de construction (ordre exact, chaque phase livre un truc qui marche)

| Phase | Contenu | Résultat visible |
|---|---|---|
| 1 | Projet Next.js + Supabase, schéma BDD, auth, multi-tenant | On peut créer un cabinet et s'y connecter |
| 2 | Interface pro branchée : agenda réel (création/déplacement/annulation/conflits), praticiens, prestations, congés | Le prototype praticien devient réel |
| 3 | Moteur de disponibilités + site patient `/[slug]` + réservation réelle | Un vrai patient peut réserver en ligne |
| 4 | Notifications : confirmations + rappels email puis SMS + lien de replanification (congés) | La boucle congés→SMS→replanification fonctionne |
| 5 | Cerveau IA v1 sur le **chat** du site (outils + FAQ + prise de RDV) | On valide le cerveau sans la complexité audio |
| 6 | **Voix** : Twilio + Vapi branchés sur le même cerveau, transcriptions dans l'onglet Appels | L'IA décroche le téléphone |
| 7 | Onboarding 5 écrans + achat de numéro en 1 clic + Stripe | Tu peux vendre en autonomie |
| 8 | Bêta : 1 à 3 kinés réels (gratuits ou -50 %) pendant 1 mois, corrections | Premiers témoignages, produit fiabilisé |

L'ordre est stratégique : le chat (phase 5) valide 90 % de l'intelligence de l'IA avec 10 % de la complexité de la voix. Quand on branche la voix (phase 6), le cerveau est déjà fiable.

---

## 10. Comment on construit concrètement

Ces phases, c'est du vrai développement multi-fichiers (backend, base de données, déploiements) — ça se construit avec **Claude Code** : tu me donnes les deux documents (référence + architecture) et on exécute phase par phase, moi j'écris le code dans un vrai projet sur ta machine, toi tu testes et tu décides. Les prototypes visuels validés servent de maquette exacte à reproduire.
