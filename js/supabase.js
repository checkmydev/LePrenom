import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON } from "./config.js";

const sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
  db: { schema: "leprenom" },
});

// --- Ratings ---
export async function upsertRating({ prenom, sexe, parent, note, famille }) {
  const { error } = await sb.from("ratings")
    .upsert({ prenom, sexe, parent, note, famille, updated_at: new Date().toISOString() },
            { onConflict: "prenom,parent,famille" });
  if (error) throw error;
}

// Supabase limite chaque requête à 1000 lignes : on pagine pour tout récupérer,
// en filtrant sur la famille.
async function fetchAll(table, famille, columns = "*") {
  const pageSize = 1000;
  let from = 0;
  const all = [];
  for (;;) {
    const { data, error } = await sb.from(table).select(columns)
      .eq("famille", famille)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    all.push(...data);
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

export async function fetchRatings(famille) {
  return fetchAll("ratings", famille);
}

// --- Favoris ---
export async function toggleFavori(prenom, parent, on, famille) {
  if (on) {
    const { error } = await sb.from("favoris")
      .upsert({ prenom, parent, famille }, { onConflict: "prenom,parent,famille" });
    if (error) throw error;
  } else {
    const { error } = await sb.from("favoris").delete().match({ prenom, parent, famille });
    if (error) throw error;
  }
}

export async function fetchFavoris(famille) {
  return fetchAll("favoris", famille);
}

// --- Duels (historique) ---
export async function recordDuel({ gagnant, perdant, parent, famille }) {
  const { error } = await sb.from("duel_results").insert({ gagnant, perdant, parent, famille });
  if (error) throw error;
}

// --- Analyses (cache IA), par famille (nom de famille différent) ---
export async function fetchAnalyse(prenom, famille) {
  const { data, error } = await sb.from("analyses")
    .select("*").eq("prenom", prenom).eq("famille", famille).maybeSingle();
  if (error) throw error;
  return data;
}
