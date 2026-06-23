-- Bijoutier Pro — Migration 003
-- Table des sorties d'or déclarées par l'artisan et validées par le chef d'atelier.
-- Activée pour le temps réel (Supabase Realtime) afin que le chef soit notifié
-- sur son appareil quand un artisan déclare une sortie.

create table if not exists public.demandes_sortie (
  id           uuid primary key default gen_random_uuid(),
  artisan_id   text not null,
  poids_g      numeric not null check (poids_g > 0),
  purete       text not null default '18K',
  statut       text not null default 'en_attente'
               check (statut in ('en_attente', 'validee', 'refusee')),
  date         date not null default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_demandes_sortie_statut  on public.demandes_sortie (statut);
create index if not exists idx_demandes_sortie_artisan on public.demandes_sortie (artisan_id);

-- Temps réel
alter publication supabase_realtime add table public.demandes_sortie;

-- RLS : outil interne (auth applicative par rôle, pas d'auth Supabase pour l'instant).
-- On autorise la clé anon en lecture/écriture sur cette table. À durcir quand on
-- branchera Supabase Auth (politiques par rôle artisan/chef).
alter table public.demandes_sortie enable row level security;

drop policy if exists "demandes_sortie_anon_all" on public.demandes_sortie;
create policy "demandes_sortie_anon_all"
  on public.demandes_sortie
  for all
  to anon
  using (true)
  with check (true);
