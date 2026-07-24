-- ============================================================================
-- Données de démonstration — Cabinet Dupont
-- (reprend les données du prototype secretaire-ia-prototype-3.jsx)
-- ============================================================================

insert into public.cabinets (
  id, slug, nom, metier, couleur_primaire, couleur_douce,
  telephone_affiche, adresse, ville, email,
  ia_prenom, ia_ton, ia_message_accueil, horaires_texte, statut_abonnement
) values (
  '11111111-1111-1111-1111-111111111111',
  'cabinet-dupont',
  'Cabinet Dupont',
  'kine',
  '#0E5E63',
  '#F2F7F6',
  '071 23 45 67',
  'Rue de la Station 12',
  'Charleroi',
  'contact@cabinet-dupont.be',
  'Sofia',
  'chaleureux-pro',
  'Cabinet Dupont, bonjour ! Je suis Sofia, la secrétaire du cabinet. Comment puis-je vous aider ?',
  'Lun-Ven 8h-18h · Sam 8h-13h',
  'essai'
);

insert into public.regles (cabinet_id, delai_min_reservation_heures, delai_annulation_heures, accepte_nouveaux_patients, confirmation_auto)
values ('11111111-1111-1111-1111-111111111111', 2, 24, true, true);

insert into public.praticiens (id, cabinet_id, nom, role, couleur_agenda, actif) values
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Marc Dupont', 'Kinésithérapeute', '#0E5E63', true),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Julie Lambert', 'Kinésithérapeute', '#C4762A', true);

-- horaires : Lun(1) à Ven(5) 8h-18h, Sam(6) 8h-13h, pour les deux praticiens
insert into public.horaires (cabinet_id, praticien_id, jour_semaine, heure_debut, heure_fin)
select '11111111-1111-1111-1111-111111111111', prat.id, jour, '08:00', '18:00'
from (values
  ('22222222-2222-2222-2222-222222222221'::uuid),
  ('22222222-2222-2222-2222-222222222222'::uuid)
) as prat(id)
cross join generate_series(1, 5) as jour;

insert into public.horaires (cabinet_id, praticien_id, jour_semaine, heure_debut, heure_fin)
values
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 6, '08:00', '13:00'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 6, '08:00', '13:00');

insert into public.prestations (id, cabinet_id, nom, duree_minutes, prix, actif) values
  ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', 'Première séance (bilan)', 45, 35.00, true),
  ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', 'Séance de suivi', 30, 28.50, true),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Séance longue', 45, 35.00, true);

insert into public.praticien_prestations (cabinet_id, praticien_id, prestation_id) values
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '33333333-3333-3333-3333-333333333331'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '33333333-3333-3333-3333-333333333332'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '33333333-3333-3333-3333-333333333333'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333331'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333332');

insert into public.faq (cabinet_id, question, reponse) values
  ('11111111-1111-1111-1111-111111111111', 'Quels sont vos tarifs ?', 'Une séance de suivi est à 28,50 € et une première séance de bilan à 35 €.'),
  ('11111111-1111-1111-1111-111111111111', 'Êtes-vous ouverts le samedi ?', 'Oui, le cabinet est ouvert le samedi matin de 8h à 13h.');
