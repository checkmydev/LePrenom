# LePrenom — Spec de design

**Date :** 2026-07-14
**Auteur :** Maxime Gerard (avec Claude)
**Statut :** Validé (design approuvé par l'utilisateur)

## 1. Objectif

Aider Maxime & sa/son conjoint(e) à **choisir un prénom** de manière ludique. Une PWA-jeu où l'on note des prénoms à l'aveugle (étoiles 1→10), avec analyse IA des favoris, classements, duels, et mise en évidence des prénoms plébiscités par les **deux** parents.

Nom de famille de référence pour les analyses : **Gerard**.

## 2. Contraintes & décisions validées

| Sujet | Décision |
|---|---|
| Source des prénoms | **Fichier officiel INSEE des prénoms**, téléchargé/nettoyé **une fois** au build → `prenoms.json` embarqué dans l'appli (côté client). |
| Stockage | **Supabase** — projet ref `wzrcrszfubjsfoaxatvo`, schéma dédié `leprenom`. |
| Clé Supabase | Clé **`anon`** publique embarquée dans l'appli (conçue pour ça). Pas de `service_role` côté client. |
| IA | **Claude** via **Supabase Edge Function** (`analyser-prenom`). Clé `ANTHROPIC_API_KEY` secrète côté serveur. |
| Auth | **Simple, sans mot de passe** : 2 boutons Maman / Papa, choix mémorisé (localStorage). |
| Sexe des prénoms en jeu | **Toujours mixte** (mélange aléatoire filles + garçons). |
| Hébergement | **GitHub Pages** — repo `checkmydev/LePrenom`. |
| Tech | **Vanilla JS/HTML/CSS** (statique, SPA légère), cohérent avec Childbooks/MaxTube. |

## 3. Fonctionnalités

### 3.1 Demandées
- **Jeu de notation** : bouton `GO` → décompte **3‑2‑1‑GO!** → **10 prénoms** proposés → notation **étoiles 1→10**.
- **Analyse IA** déclenchée quand **note > 7** : signification, description, jeux de mots, **compatibilité avec « Gerard »**. Résultat **mis en cache** (1 appel IA max par prénom).
- **Dashboard** : **Top 10** des prénoms (par moyenne).
- **Auth simple** : savoir de qui vient chaque note (Maman/Papa) → **moyenne par prénom** (moyenne des notes des 2 parents).

### 3.2 Bonus validés
- **Mode Duel** : face-à-face 2 prénoms, on clique le préféré → **classement ELO**.
- **Accord Maman/Papa** : onglet « Coups de cœur communs » = prénoms bien notés (ex. ≥ 7) par **les deux** parents.
- **Favoris / short-list** : ❤️ pour épingler un prénom → liste courte consultable.

### 3.3 Explicitement hors périmètre (YAGNI)
- Filtres avancés (lettre initiale, syllabes, origine…). Écartés pour v1.
- Vraie authentification / gestion de comptes.
- File d'attente offline pour les écritures (les notes nécessitent le réseau).

## 4. Écrans

1. **Accueil** — 2 gros boutons **Maman / Papa** (choix mémorisé, changeable).
2. **Jeu** — bouton `GO` → décompte animé 3‑2‑1‑GO! → 10 cartes prénoms, chacune notable en étoiles (1→10). À la validation d'une note > 7, déclenche l'analyse IA (asynchrone, non bloquante).
3. **Duel** — 2 prénoms côte à côte, clic = vainqueur, mise à jour ELO, paire suivante.
4. **Dashboard** — Top 10 (moyenne), + onglet « Coups de cœur communs ».
5. **Favoris** — short-list des prénoms épinglés.
6. **Fiche prénom** — détail + analyse IA (signification, description, jeux de mots, verdict « … Gerard »). Accessible depuis toute carte prénom.

## 5. Modèle de données (schéma `leprenom`)

Le **catalogue** de prénoms n'est **pas** en base (fichier `prenoms.json` embarqué). Seules les données de jeu sont persistées.

- **`ratings`** — `id`, `prenom` (text), `sexe` (`f`/`m`), `parent` (`maman`/`papa`), `note` (int 1–10), `updated_at`.
  - Contrainte **unique (`prenom`, `parent`)** → upsert : 1 note courante par parent et par prénom.
  - Moyenne d'un prénom = moyenne des notes des parents l'ayant noté.
- **`analyses`** — `prenom` (PK text), `sexe`, `signification`, `description`, `jeux_de_mots`, `compat_gerard`, `raw` (jsonb), `created_at`. **Cache** de l'IA.
- **`favoris`** — `id`, `prenom`, `parent`, `created_at`. Unique (`prenom`, `parent`).
- **`elo`** — `prenom` (PK), `score` (int, défaut 1000), `matches` (int). + **`duel_results`** — `id`, `gagnant`, `perdant`, `parent`, `created_at` (historique).

**RLS :** politiques ouvertes (select/insert/update) via le rôle `anon` sur le schéma `leprenom`. Compromis « simple » assumé (usage familial). Documenté comme risque connu.

## 6. IA — Edge Function `analyser-prenom`

- **Entrée :** `{ prenom, sexe }`.
- **Logique :** vérifie `analyses` (cache) → si absent, appelle **Claude** (modèle récent, ex. `claude-sonnet-5`) avec un prompt structuré demandant : signification/origine, courte description, jeux de mots éventuels, et **verdict de compatibilité avec le nom « Gerard »** (sonorité, initiales, jeux de mots, « ça passe / ça coince »). Stocke le résultat dans `analyses`, renvoie le JSON.
- **Secret :** `ANTHROPIC_API_KEY` (jamais exposée côté client).
- **Déclenchement :** automatiquement à la validation d'une note > 7, et à l'ouverture d'une fiche prénom sans analyse en cache.

## 7. PWA

- `manifest.json` (nom, icônes, `display: standalone`, thème) → installable PC + mobile.
- **Service worker** : cache l'app-shell + `prenoms.json` → jeu jouable hors-ligne. Les écritures Supabase (notes, favoris, duels) nécessitent le réseau.

## 8. Structure du projet (prévisionnelle)

```
LePrenom/
├─ index.html            # SPA (écrans en sections)
├─ css/styles.css
├─ js/
│  ├─ app.js             # routing/écrans, état, profil
│  ├─ game.js            # décompte + manche de 10 + notation
│  ├─ duel.js            # ELO
│  ├─ dashboard.js       # top 10 + accord parents
│  ├─ favoris.js
│  ├─ supabase.js        # client + requêtes (url + anon key)
│  └─ ia.js              # appel Edge Function
├─ data/prenoms.json     # catalogue généré (build)
├─ scripts/build-prenoms.mjs   # télécharge + nettoie INSEE → prenoms.json
├─ supabase/functions/analyser-prenom/index.ts
├─ supabase/schema.sql   # tables + RLS schéma leprenom
├─ manifest.json
├─ sw.js
└─ icons/
```

## 9. Déploiement

- Repo git dédié `LePrenom` → remote `checkmydev/LePrenom` (déjà créé) → **GitHub Pages via GitHub Actions** (source Pages = "GitHub Actions", déjà configuré côté GitHub). Nécessite un workflow `.github/workflows/deploy.yml` qui build (`prenoms.json` déjà commité ou généré) et publie l'artefact Pages.
- Edge Function déployée via Supabase CLI (secret `ANTHROPIC_API_KEY` configuré côté Supabase).
- Vérifier l'absence de secrets sensibles avant push (la clé `anon` est publique par conception ; la clé `service_role` et `ANTHROPIC_API_KEY` ne doivent **jamais** être dans le repo).

## 10. Risques connus

1. **Sécurité RLS ouverte** : tables accessibles à qui a l'URL + clé anon. Assumé pour un usage familial.
2. **Format INSEE** : le fichier source peut évoluer ; le script de build devra être robuste (encodage, séparateur, filtrage des prénoms rares/erronés).
3. **Coût IA** : borné par le cache (1 appel par prénom) + le seuil note > 7.
