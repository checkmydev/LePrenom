import { fetchFavoris } from "./supabase.js";
import { getParent } from "./profile.js";
import { getFamille } from "./family.js";

const el = () => document.getElementById("screen-favoris");

export async function initFavoris() {
  const famille = getFamille();
  if (!famille) { location.hash = "#accueil"; return; }
  el().innerHTML = `<div class="card">Chargement…</div>`;
  let rows;
  try {
    rows = await fetchFavoris(famille);
  } catch (e) {
    el().innerHTML = `<div class="card">⚠️ Impossible de charger les favoris : ${e.message}</div>`;
    return;
  }
  const mine = rows.filter(r => r.parent === getParent());
  el().innerHTML = `<h2>❤️ Ma short-list</h2>
    ${mine.length ? mine.map(f => `
      <div class="card"><a href="#" data-prenom="${f.prenom}">${f.prenom}</a></div>`).join("")
      : `<div class="card">Aucun favori. Épingle des prénoms avec le ❤️ pendant le jeu.</div>`}`;
}
