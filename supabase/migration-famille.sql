-- Migration : espaces "famille" (Gerard / Hocepied ...)
-- Ajoute la colonne `famille` (défaut 'gerard' => rattache tout l'existant à la famille Gerard)
-- et met à jour les contraintes d'unicité pour que chaque famille ait ses propres notes.
-- À lancer une fois dans le SQL Editor du projet Supabase.

-- ratings : une note par (prénom, parent, famille)
alter table leprenom.ratings add column if not exists famille text not null default 'gerard';
alter table leprenom.ratings drop constraint if exists ratings_prenom_parent_key;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'ratings_prenom_parent_famille_key') then
    alter table leprenom.ratings add constraint ratings_prenom_parent_famille_key unique (prenom, parent, famille);
  end if;
end $$;

-- favoris : un favori par (prénom, parent, famille)
alter table leprenom.favoris add column if not exists famille text not null default 'gerard';
alter table leprenom.favoris drop constraint if exists favoris_prenom_parent_key;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'favoris_prenom_parent_famille_key') then
    alter table leprenom.favoris add constraint favoris_prenom_parent_famille_key unique (prenom, parent, famille);
  end if;
end $$;

-- duel_results : historique (pas d'unicité)
alter table leprenom.duel_results add column if not exists famille text not null default 'gerard';

-- analyses (cache IA) : clé (prénom, famille) car le nom de famille change le verdict
alter table leprenom.analyses add column if not exists famille text not null default 'gerard';
alter table leprenom.analyses drop constraint if exists analyses_pkey;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'analyses_pkey') then
    alter table leprenom.analyses add primary key (prenom, famille);
  end if;
end $$;

-- elo (inutilisé actuellement) : clé (prénom, famille)
alter table leprenom.elo add column if not exists famille text not null default 'gerard';
alter table leprenom.elo drop constraint if exists elo_pkey;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'elo_pkey') then
    alter table leprenom.elo add primary key (prenom, famille);
  end if;
end $$;
