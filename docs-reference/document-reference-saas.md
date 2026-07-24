# 📘 Document de référence — SaaS Secrétaire IA
*Version du 14 juillet 2026 — fige toutes les décisions prises. À redonner à Claude en début de conversation pour reprendre le projet exactement où il en est.*

---

## 1. Vision

Créer la meilleure **secrétaire IA** au monde pour les professionnels qui travaillent sur rendez-vous. Elle fait une seule chose, parfaitement : **gérer tous les rendez-vous 24h/24 sans intervention humaine** (téléphone, chat, site).

La vraie concurrence n'est pas les autres logiciels : c'est la secrétaire humaine à 800–1 500 €/mois. C'est l'argument de vente central.

**Cible V1 :** cabinets de kinésithérapie. Puis déclinaison au même moteur : ostéos, podologues, psys, dentistes, vétos, coiffeurs, barbers, instituts, garages, coachs…

---

## 2. Offre (DÉCIDÉ — UNE SEULE offre, claire, tout inclus)

**Offre unique — 129,99 €/mois, tout compris :**
- Praticiens illimités
- IA téléphonique 24h/24 (plafond de protection ~800 min/mois, dépassement facturé ~0,35 €/min plutôt que coupure)
- Mini-site + réservation en ligne + chat IA
- Confirmations et rappels email + SMS
- Personnalisation complète de l'IA (prénom, ton, FAQ, règles)
- Liste d'attente automatique
- Historique + transcriptions des appels, statistiques
- Support prioritaire

**Vente :** essai gratuit 14 jours. Argument central : « moins de 4,30 €/jour, comparez à une secrétaire à 800–1 500 €/mois ». Une seule offre = zéro hésitation, message simple, prix simple.

**Objectif business :** ~100 clients ≈ 13 000 €/mois récurrents.

---

## 3. Architecture white-label (DÉCIDÉ — multi-tenant, PAS de duplication de code)

- **Un seul logiciel, une seule base de données.** Chaque cabinet = une fiche de configuration.
- URL par cabinet : `tonlogiciel.be/cabinet-dupont` → charge la config et habille le site.
- Vendre un nouveau client = **10 minutes de paramétrage**, zéro code.

**Tout ce qui est modifiable par cabinet** (validé dans le prototype) :
nom du cabinet · logo · **photo de fond du hero** (avec voile sombre auto pour lisibilité) · couleur principale · couleur douce · téléphone · adresse · ville · **horaires** (affichés + utilisés par l'IA) · **prestations** (nom, durée, prix — ajout/suppression libre) · **praticiens** (ajout/suppression/renommage) · prénom de l'IA · ton de l'IA · message d'accueil · FAQ · règles métier · vocabulaire du métier.

Tout changement se répercute instantanément sur : le site, la réservation, le chat ET le téléphone.

---

## 4. Interface praticien (COMPORTEMENT VALIDÉ — le produit final doit fonctionner exactement comme le prototype)

**Menu :** Tableau de bord · Agenda · Appels · Secrétaire IA · Praticiens · Prestations (+ plus tard : Patients, Messages, Site internet, Statistiques, Paramètres).

### Tableau de bord
Stats (RDV aujourd'hui, appels traités, annulations, créneaux libres) + **fil d'activité de l'IA** (« ce que Sofia a fait pendant que vous soigniez ») + badge « En ligne 24h/24 » + prochains RDV avec origine.

### Agenda (✅ comportement validé)
- Vues jour / semaine / mois. Grille 8h–18h, couleurs par praticien.
- **Création manuelle de RDV** : patient, prestation, praticien, jour, heure → origine « Manuel ».
- **Détection de conflit** : chevauchement même praticien OU période bloquée → enregistrement bloqué avec avertissement.
- Clic sur un RDV → détail (origine : IA / Site / Manuel) + **Déplacer/modifier** (formulaire pré-rempli) + **Annuler** (suppression réelle).

### 🏖️ Congés & imprévus (✅ comportement validé)
- Bouton « Bloquer une période » : motif (Congés / Maladie-imprévu / Fermeture exceptionnelle / Formation), portée (un praticien OU tout le cabinet), plage jours + heures.
- Les créneaux sont **fermés à la réservation partout** (site, téléphone, chat, manuel).
- Affichage **hachuré gris** dans l'agenda (demi-colonne si 1 praticien, pleine largeur si cabinet).
- **Patients impactés** : retirés de l'agenda + panneau dédié + envoi automatique **SMS + email avec lien** pour qu'ils choisissent eux-mêmes un nouveau créneau libre (RDV recréé avec origine « Site », zéro travail pour le pro).
- Chaque blocage est supprimable individuellement.

### Appels
Historique complet : patient, numéro, heure, durée, motif, badge résultat (RDV créé / déplacé / annulé / Info donnée) + **transcription intégrale** de la conversation.

### Secrétaire IA (config)
Prénom · ton (chaleureux-pro / formel / décontracté) · message d'accueil · règles à interrupteurs (délai min de réservation, confirmation auto, accepter nouveaux patients, transfert vers humain) · FAQ éditable (utilisée au téléphone ET sur le chat).

### Statuts de RDV
confirmé · annulé · déplacé · terminé · absent — avec origine : créé IA / créé site / créé manuellement.

---

## 5. Site patient (✅ prototype validé)

- Header (logo initiale, nom, métier, ville, téléphone) · **hero avec photo de fond optionnelle** · badge « {IA} répond 24h/24 » · bouton Réserver.
- Prestations cliquables (lancent la réservation) · équipe · infos pratiques.
- **Réservation en 5 étapes :** prestation → praticien (ou sans préférence) → jour/heure → coordonnées (nom, tél, email) → confirmation (email + rappel SMS annoncés, annulation gratuite jusqu'à 24h avant).
- **Chat IA flottant** bien visible (« Une question ? {IA} vous répond ») : répond tarifs / horaires / RDV / annulation à partir des données du cabinet.

---

## 6. Capture des contacts patients (RÈGLE CRITIQUE — condition des notifications)

Aucun RDV ne peut exister sans coordonnées joignables. C'est ce qui rend possibles les confirmations, rappels et la replanification automatique en cas de congés/imprévu.

- **Site :** le formulaire de réservation exige nom + téléphone + email (déjà dans le prototype).
- **Téléphone :** le numéro de l'appelant est capturé automatiquement (caller ID) ; l'IA demande nom + email.
- **Manuel (kiné) :** le formulaire de création exige aussi téléphone (+ email si dispo) — à ajouter au prototype lors du branchement.

Chaque réservation **crée ou met à jour une fiche patient** (le numéro de téléphone = clé unique). Si un patient connu rappelle, l'IA le reconnaît (« Bonjour Anna, je vois votre séance de lundi »). Une page « Patients » dans l'interface praticien listera ces fiches (nom, contacts, historique des RDV) — sans dossier médical (V1).

---

## 7. Ce que l'IA fait / ne fait pas (V1)

**Fait :** répondre au téléphone · prendre / modifier / annuler / confirmer un RDV · consulter les disponibilités · répondre à la FAQ · envoyer email et SMS · transférer vers un humain · gérer la liste d'attente.

**Ne fait PAS (V1) :** dossier patient · mutuelles · facturation · paiement · **conseils médicaux (jamais)**.

Canaux V1 : téléphone, chat, site. Plus tard : WhatsApp, email.

---

## 8. Base de données (entités prévues)

Cabinets (avec config white-label) · Utilisateurs · Praticiens · **Patients (fiche auto-créée à chaque réservation, téléphone = clé unique)** · Prestations · Disponibilités · Rendez-vous · **Blocages/congés** · Appels (+ transcriptions) · Messages · FAQ · Liste d'attente · Notifications · Paramètres/Abonnements.

---

## 9. État d'avancement

| Étape | Statut |
|---|---|
| 1. Idée | ✅ |
| 2. Fonctionnalités + offres | ✅ |
| Prototype interface praticien (agenda interactif + congés) | ✅ `secretaire-ia-prototype.jsx` |
| Prototype site patient white-label (réservation + chat + personnalisation) | ✅ `site-patient-whitelabel.jsx` |
| 3. Scénarios de conversation IA (téléphone) : prise/modif/annulation, erreurs, patient confus, liste d'attente, transfert humain | ⬜ **prochaine étape** |
| 4. Architecture technique (stack, BDD, téléphonie vocale, multi-tenant) | ⬜ |
| 5. Développement du vrai produit connecté | ⬜ |
| 6. Site de vente + acquisition des premiers kinés | ⬜ |

**Point d'attention noté :** la téléphonie vocale temps réel est le composant le plus complexe et le plus coûteux (~0,15–0,30 €/min de coût réel) — c'est ce qui justifie les plafonds de minutes. Conformité RGPD/données de santé à traiter dès l'architecture.
