-- ============================================================================
-- Secrétaire IA — schéma initial (Phase 1)
-- Multi-tenant : cabinet_id sur toutes les tables + Row Level Security (RLS)
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. CABINETS — le cœur du white-label
-- ----------------------------------------------------------------------------
create table public.cabinets (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,
  nom                   text not null,
  metier                text not null default 'kine',
  logo_url              text,
  photo_hero_url        text,
  couleur_primaire      text not null default '#0E5E63',
  couleur_douce         text not null default '#F2F7F6',
  telephone_affiche     text,
  numero_twilio         text,
  adresse               text,
  ville                 text,
  email                 text,
  instagram_url         text,
  facebook_url          text,
  tiktok_url            text,
  ia_prenom             text not null default 'Sofia',
  ia_ton                text not null default 'chaleureux-pro',
  ia_message_accueil    text,
  horaires_texte        text,
  lien_avis_google      text,
  sms_rappel_actif      boolean not null default true,
  sms_forfait_mensuel   integer not null default 250,
  statut_abonnement     text not null default 'essai',
  offre                 text not null default 'site' check (offre in ('site', 'intermediaire', 'premium')),
  masquer_rdv_anciens   boolean not null default false,
  minutes_incluses      integer not null default 800,
  minutes_consommees    integer not null default 0,
  cree_le               timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. USERS — comptes de connexion des pros (lié à auth.users de Supabase)
-- ----------------------------------------------------------------------------
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  cabinet_id  uuid not null references public.cabinets(id) on delete cascade,
  email       text not null,
  role        text not null default 'praticien' check (role in ('admin', 'praticien')),
  cree_le     timestamptz not null default now()
);
create index users_cabinet_id_idx on public.users(cabinet_id);

-- ----------------------------------------------------------------------------
-- 3. PRATICIENS
-- ----------------------------------------------------------------------------
create table public.praticiens (
  id             uuid primary key default gen_random_uuid(),
  cabinet_id     uuid not null references public.cabinets(id) on delete cascade,
  nom            text not null,
  role           text,
  photo_url      text,
  couleur_agenda text not null default '#0E5E63',
  actif          boolean not null default true,
  cree_le        timestamptz not null default now()
);
create index praticiens_cabinet_id_idx on public.praticiens(cabinet_id);

-- ----------------------------------------------------------------------------
-- 4. HORAIRES — disponibilités de travail des praticiens
-- ----------------------------------------------------------------------------
create table public.horaires (
  id            uuid primary key default gen_random_uuid(),
  cabinet_id    uuid not null references public.cabinets(id) on delete cascade,
  praticien_id  uuid not null references public.praticiens(id) on delete cascade,
  jour_semaine  smallint not null check (jour_semaine between 0 and 6),
  heure_debut   time not null,
  heure_fin     time not null
);
create index horaires_cabinet_id_idx on public.horaires(cabinet_id);
create index horaires_praticien_id_idx on public.horaires(praticien_id);

-- ----------------------------------------------------------------------------
-- 5. PRESTATIONS
-- ----------------------------------------------------------------------------
create table public.prestations (
  id             uuid primary key default gen_random_uuid(),
  cabinet_id     uuid not null references public.cabinets(id) on delete cascade,
  nom            text not null,
  duree_minutes  integer not null,
  prix           numeric(10, 2) not null,
  actif          boolean not null default true,
  cree_le        timestamptz not null default now()
);
create index prestations_cabinet_id_idx on public.prestations(cabinet_id);

-- table de liaison : qui fait quoi
create table public.praticien_prestations (
  cabinet_id     uuid not null references public.cabinets(id) on delete cascade,
  praticien_id   uuid not null references public.praticiens(id) on delete cascade,
  prestation_id  uuid not null references public.prestations(id) on delete cascade,
  primary key (praticien_id, prestation_id)
);
create index praticien_prestations_cabinet_id_idx on public.praticien_prestations(cabinet_id);

-- ----------------------------------------------------------------------------
-- 6. PATIENTS — fiche auto-créée à chaque réservation
-- ----------------------------------------------------------------------------
create table public.patients (
  id          uuid primary key default gen_random_uuid(),
  cabinet_id  uuid not null references public.cabinets(id) on delete cascade,
  nom         text not null,
  telephone   text not null,
  email       text,
  notes       text,
  cree_le     timestamptz not null default now(),
  -- (téléphone, nom) et pas juste téléphone : une famille peut partager un
  -- seul numéro pour plusieurs patients distincts (ex: la maman qui réserve
  -- pour ses 3 enfants) — chacun garde sa propre fiche et ses propres rdv.
  unique (cabinet_id, telephone, nom)
);
create index patients_cabinet_id_idx on public.patients(cabinet_id);

-- ----------------------------------------------------------------------------
-- 7. RENDEZ_VOUS
-- ----------------------------------------------------------------------------
create table public.rendez_vous (
  id             uuid primary key default gen_random_uuid(),
  cabinet_id     uuid not null references public.cabinets(id) on delete cascade,
  patient_id     uuid not null references public.patients(id) on delete cascade,
  praticien_id   uuid not null references public.praticiens(id) on delete cascade,
  prestation_id  uuid not null references public.prestations(id) on delete cascade,
  debut          timestamptz not null,
  fin            timestamptz not null,
  statut         text not null default 'confirme'
                 check (statut in ('confirme', 'annule', 'deplace', 'termine', 'absent')),
  origine        text not null
                 check (origine in ('ia_telephone', 'site', 'chat', 'manuel')),
  cree_le        timestamptz not null default now()
);
create index rendez_vous_cabinet_id_idx on public.rendez_vous(cabinet_id);
create index rendez_vous_praticien_id_idx on public.rendez_vous(praticien_id);
create index rendez_vous_debut_idx on public.rendez_vous(debut);

-- ----------------------------------------------------------------------------
-- 8. BLOCAGES — congés et imprévus
-- ----------------------------------------------------------------------------
create table public.blocages (
  id            uuid primary key default gen_random_uuid(),
  cabinet_id    uuid not null references public.cabinets(id) on delete cascade,
  praticien_id  uuid references public.praticiens(id) on delete cascade, -- null = tout le cabinet
  debut         timestamptz not null,
  fin           timestamptz not null,
  motif         text not null,
  cree_le       timestamptz not null default now()
);
create index blocages_cabinet_id_idx on public.blocages(cabinet_id);

-- ----------------------------------------------------------------------------
-- 9. APPELS
-- ----------------------------------------------------------------------------
create table public.appels (
  id               uuid primary key default gen_random_uuid(),
  cabinet_id       uuid not null references public.cabinets(id) on delete cascade,
  patient_id       uuid references public.patients(id) on delete set null,
  numero_appelant  text not null,
  debut            timestamptz not null default now(),
  duree_secondes   integer not null default 0,
  resultat         text not null default 'info'
                   check (resultat in ('rdv_cree', 'deplace', 'annule', 'info', 'transfert')),
  transcription    jsonb not null default '[]'::jsonb,
  audio_url        text
);
create index appels_cabinet_id_idx on public.appels(cabinet_id);

-- ----------------------------------------------------------------------------
-- 10. MESSAGES — conversations du chat web
-- ----------------------------------------------------------------------------
create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  cabinet_id  uuid not null references public.cabinets(id) on delete cascade,
  patient_id  uuid references public.patients(id) on delete set null,
  canal       text not null default 'chat',
  contenu     jsonb not null default '[]'::jsonb,
  cree_le     timestamptz not null default now()
);
create index messages_cabinet_id_idx on public.messages(cabinet_id);

-- ----------------------------------------------------------------------------
-- 11. FAQ
-- ----------------------------------------------------------------------------
create table public.faq (
  id          uuid primary key default gen_random_uuid(),
  cabinet_id  uuid not null references public.cabinets(id) on delete cascade,
  question    text not null,
  reponse     text not null
);
create index faq_cabinet_id_idx on public.faq(cabinet_id);

-- ----------------------------------------------------------------------------
-- 12. REGLES — les interrupteurs de l'IA (une ligne par cabinet)
-- ----------------------------------------------------------------------------
create table public.regles (
  cabinet_id                     uuid primary key references public.cabinets(id) on delete cascade,
  delai_min_reservation_heures   integer not null default 2,
  delai_annulation_heures        integer not null default 24,
  accepte_nouveaux_patients      boolean not null default true,
  confirmation_auto              boolean not null default true,
  transfert_humain_numero        text
);

-- ----------------------------------------------------------------------------
-- 13. LISTE_ATTENTE
-- ----------------------------------------------------------------------------
create table public.liste_attente (
  id                        uuid primary key default gen_random_uuid(),
  cabinet_id                uuid not null references public.cabinets(id) on delete cascade,
  patient_id                uuid not null references public.patients(id) on delete cascade,
  prestation_id             uuid not null references public.prestations(id) on delete cascade,
  praticien_id              uuid references public.praticiens(id) on delete cascade,
  disponibilites_souhaitees text,
  cree_le                   timestamptz not null default now()
);
create index liste_attente_cabinet_id_idx on public.liste_attente(cabinet_id);

-- ----------------------------------------------------------------------------
-- 14. NOTIFICATIONS
-- ----------------------------------------------------------------------------
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  cabinet_id  uuid not null references public.cabinets(id) on delete cascade,
  patient_id  uuid references public.patients(id) on delete set null,
  type        text not null check (type in ('confirmation', 'rappel', 'replanification', 'avis')),
  canal       text not null check (canal in ('sms', 'email')),
  statut      text not null default 'en_attente',
  envoye_le   timestamptz
);
create index notifications_cabinet_id_idx on public.notifications(cabinet_id);

-- ============================================================================
-- SÉCURITÉ MULTI-TENANT : Row Level Security
-- ============================================================================

-- Fonction utilitaire : renvoie le cabinet_id de l'utilisateur connecté.
-- SECURITY DEFINER = s'exécute avec les droits du propriétaire (contourne la
-- RLS de la table users elle-même, sinon on aurait une boucle infinie).
create or replace function public.current_cabinet_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select cabinet_id from public.users where id = auth.uid()
$$;

alter table public.cabinets              enable row level security;
alter table public.users                 enable row level security;
alter table public.praticiens            enable row level security;
alter table public.horaires              enable row level security;
alter table public.prestations           enable row level security;
alter table public.praticien_prestations enable row level security;
alter table public.patients              enable row level security;
alter table public.rendez_vous           enable row level security;
alter table public.blocages              enable row level security;
alter table public.appels                enable row level security;
alter table public.messages              enable row level security;
alter table public.faq                   enable row level security;
alter table public.regles                enable row level security;
alter table public.liste_attente         enable row level security;
alter table public.notifications         enable row level security;

-- cabinets : un utilisateur ne voit / ne modifie que SON cabinet
create policy "cabinet_isolation" on public.cabinets
  for all using (id = public.current_cabinet_id())
  with check (id = public.current_cabinet_id());

-- users : on voit les collègues du même cabinet, on ne modifie que sa propre fiche
create policy "users_select_same_cabinet" on public.users
  for select using (cabinet_id = public.current_cabinet_id());
create policy "users_update_self" on public.users
  for update using (id = auth.uid());

-- Toutes les autres tables : isolation stricte par cabinet_id
create policy "cabinet_isolation" on public.praticiens
  for all using (cabinet_id = public.current_cabinet_id())
  with check (cabinet_id = public.current_cabinet_id());

create policy "cabinet_isolation" on public.horaires
  for all using (cabinet_id = public.current_cabinet_id())
  with check (cabinet_id = public.current_cabinet_id());

create policy "cabinet_isolation" on public.prestations
  for all using (cabinet_id = public.current_cabinet_id())
  with check (cabinet_id = public.current_cabinet_id());

create policy "cabinet_isolation" on public.praticien_prestations
  for all using (cabinet_id = public.current_cabinet_id())
  with check (cabinet_id = public.current_cabinet_id());

create policy "cabinet_isolation" on public.patients
  for all using (cabinet_id = public.current_cabinet_id())
  with check (cabinet_id = public.current_cabinet_id());

create policy "cabinet_isolation" on public.rendez_vous
  for all using (cabinet_id = public.current_cabinet_id())
  with check (cabinet_id = public.current_cabinet_id());

create policy "cabinet_isolation" on public.blocages
  for all using (cabinet_id = public.current_cabinet_id())
  with check (cabinet_id = public.current_cabinet_id());

create policy "cabinet_isolation" on public.appels
  for all using (cabinet_id = public.current_cabinet_id())
  with check (cabinet_id = public.current_cabinet_id());

create policy "cabinet_isolation" on public.messages
  for all using (cabinet_id = public.current_cabinet_id())
  with check (cabinet_id = public.current_cabinet_id());

create policy "cabinet_isolation" on public.faq
  for all using (cabinet_id = public.current_cabinet_id())
  with check (cabinet_id = public.current_cabinet_id());

create policy "cabinet_isolation" on public.regles
  for all using (cabinet_id = public.current_cabinet_id())
  with check (cabinet_id = public.current_cabinet_id());

create policy "cabinet_isolation" on public.liste_attente
  for all using (cabinet_id = public.current_cabinet_id())
  with check (cabinet_id = public.current_cabinet_id());

-- ----------------------------------------------------------------------------
-- DEMANDES_DEMO (leads de la page vitrine publique, avant création de cabinet)
-- ----------------------------------------------------------------------------
create table public.demandes_demo (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null,
  email       text not null,
  telephone   text,
  metier      text,
  cabinet_nom text,
  message     text,
  statut      text not null default 'nouveau' check (statut in ('nouveau', 'contacte', 'traite')),
  cree_le     timestamptz not null default now()
);
alter table public.demandes_demo enable row level security;
-- Pas de policy : accessible uniquement via le client service-role (admin + formulaire public).

create policy "cabinet_isolation" on public.notifications
  for all using (cabinet_id = public.current_cabinet_id())
  with check (cabinet_id = public.current_cabinet_id());
