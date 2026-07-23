create schema if not exists leprenom;

create table if not exists leprenom.ratings (
  id bigint generated always as identity primary key,
  prenom text not null,
  sexe text check (sexe in ('f','m')),
  parent text not null check (parent in ('maman','papa')),
  note int not null check (note between 1 and 10),
  famille text not null default 'gerard',
  updated_at timestamptz not null default now(),
  unique (prenom, parent, famille)
);

create table if not exists leprenom.favoris (
  id bigint generated always as identity primary key,
  prenom text not null,
  parent text not null check (parent in ('maman','papa')),
  famille text not null default 'gerard',
  created_at timestamptz not null default now(),
  unique (prenom, parent, famille)
);

create table if not exists leprenom.elo (
  prenom text not null,
  famille text not null default 'gerard',
  score int not null default 1000,
  matches int not null default 0,
  primary key (prenom, famille)
);

create table if not exists leprenom.duel_results (
  id bigint generated always as identity primary key,
  gagnant text not null,
  perdant text not null,
  parent text not null check (parent in ('maman','papa')),
  famille text not null default 'gerard',
  created_at timestamptz not null default now()
);

create table if not exists leprenom.analyses (
  prenom text not null,
  famille text not null default 'gerard',
  sexe text,
  signification text,
  description text,
  jeux_de_mots text,
  compat_gerard text,
  raw jsonb,
  created_at timestamptz not null default now(),
  primary key (prenom, famille)
);

-- Expose le schéma à l'API REST (à faire aussi dans Dashboard > API > Exposed schemas)
grant usage on schema leprenom to anon, authenticated;
grant all on all tables in schema leprenom to anon, authenticated;
grant all on all sequences in schema leprenom to anon, authenticated;
alter default privileges in schema leprenom grant all on tables to anon, authenticated;
alter default privileges in schema leprenom grant all on sequences to anon, authenticated;

-- RLS ouvertes (usage familial assumé)
alter table leprenom.ratings enable row level security;
alter table leprenom.favoris enable row level security;
alter table leprenom.elo enable row level security;
alter table leprenom.duel_results enable row level security;
alter table leprenom.analyses enable row level security;

do $$
declare t text;
begin
  for t in select unnest(array['ratings','favoris','elo','duel_results','analyses']) loop
    execute format('drop policy if exists open_all on leprenom.%I;', t);
    execute format('create policy open_all on leprenom.%I for all to anon, authenticated using (true) with check (true);', t);
  end loop;
end $$;
