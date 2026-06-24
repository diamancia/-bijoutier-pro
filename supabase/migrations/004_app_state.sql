-- Bijoutier Pro — Migration 004
-- Synchronisation par "snapshot" : l'état complet de l'application (le store local
-- sérialisé en JSON) est stocké dans une seule ligne. Les appareils (chef + artisans)
-- la partagent et reçoivent les changements en temps réel (Supabase Realtime).
-- Modèle simple last-write-wins, adapté à un petit atelier (quelques utilisateurs).

create table if not exists public.app_state (
  id          text primary key,           -- 'main' (atelier unique pour l'instant)
  data        jsonb not null,             -- BijoutierStore.exportState()
  updated_at  timestamptz not null default now()
);

-- Temps réel
alter publication supabase_realtime add table public.app_state;

-- RLS : outil interne (auth applicative par rôle, pas encore Supabase Auth).
-- La clé anon peut lire/écrire la ligne. À durcir quand on branchera Supabase Auth.
alter table public.app_state enable row level security;

drop policy if exists "app_state_anon_all" on public.app_state;
create policy "app_state_anon_all"
  on public.app_state
  for all
  to anon
  using (true)
  with check (true);
