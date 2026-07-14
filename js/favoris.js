import { fetchFavoris } from "./supabase.js";
import { getParent } from "./profile.js";

const el = () => document.getElementById("screen-favoris");

export async function initFavoris() {
  el().innerHTML = `<div class="card">Chargement…</div>`;
  const rows = await fetchFavoris();
  const mine = rows.filter(r => r.parent === getParent());
  el().innerHTML = `<h2>❤️ Ma short-list</h2>
    ${mine.length ? mine.map(f => `
      <div class="card"><a href="#" data-prenom="${f.prenom}">${f.prenom}</a></div>`).join("")
      : `<div class="card">Aucun favori. Épingle des prénoms avec le ❤️ pendant le jeu.</div>`}`;
}
