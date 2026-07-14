import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON } from "./config.js";

const sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
  db: { schema: "leprenom" },
});

// --- Ratings ---
export async function upsertRating({ prenom, sexe, parent, note }) {
  const { error } = await sb.from("ratings")
    .upsert({ prenom, sexe, parent, note, updated_at: new Date().toISOString() },
            { onConflict: "prenom,parent" });
  if (error) throw error;
}

export async function fetchRatings() {
  const { data, error } = await sb.from("ratings").select("*");
  if (error) throw error;
  return data;
}

// --- Favoris ---
export async function toggleFavori(prenom, parent, on) {
  if (on) {
    const { error } = await sb.from("favoris")
      .upsert({ prenom, parent }, { onConflict: "prenom,parent" });
    if (error) throw error;
  } else {
    const { error } = await sb.from("favoris").delete().match({ prenom, parent });
    if (error) throw error;
  }
}

export async function fetchFavoris() {
  const { data, error } = await sb.from("favoris").select("*");
  if (error) throw error;
  return data;
}

// --- ELO / duels ---
export async function fetchElo() {
  const { data, error } = await sb.from("elo").select("*");
  if (error) throw error;
  return data;
}

export async function saveElo(rows) {
  const { error } = await sb.from("elo").upsert(rows, { onConflict: "prenom" });
  if (error) throw error;
}

export async function recordDuel({ gagnant, perdant, parent }) {
  const { error } = await sb.from("duel_results").insert({ gagnant, perdant, parent });
  if (error) throw error;
}

// --- Analyses (cache IA) ---
export async function fetchAnalyse(prenom) {
  const { data, error } = await sb.from("analyses").select("*").eq("prenom", prenom).maybeSingle();
  if (error) throw error;
  return data;
}
