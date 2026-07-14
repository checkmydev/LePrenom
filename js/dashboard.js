import { fetchRatings } from "./supabase.js";
import { aggregate, coupsDeCoeur } from "./aggregate.js";
import { SEUIL_COUP_DE_COEUR } from "./config.js";

const el = () => document.getElementById("screen-dashboard");

export async function initDashboard() {
  el().innerHTML = `<div class="card">Chargement…</div>`;
  const rows = await fetchRatings();
  const top = aggregate(rows).slice(0, 10);
  const coeurs = coupsDeCoeur(rows, SEUIL_COUP_DE_COEUR);
  el().innerHTML = `
    <h2>🏆 Top 10</h2>
    ${top.length ? top.map((t, i) => `
      <div class="card" style="display:flex; justify-content:space-between; align-items:center">
        <span><b>${i + 1}.</b> <a href="#" data-prenom="${t.prenom}" data-sexe="${t.sexe||''}">${t.prenom}</a>
          <span class="badge-sexe ${t.sexe||''}">${t.sexe==='f'?'fille':t.sexe==='m'?'garçon':''}</span></span>
        <b>${t.moyenne}/10</b> <small>(${t.nb} note${t.nb>1?'s':''})</small>
      </div>`).join("") : `<div class="card">Aucune note pour l'instant.</div>`}
    <h2>💞 Coups de cœur communs</h2>
    ${coeurs.length ? coeurs.map(c => `
      <div class="card">
        <b><a href="#" data-prenom="${c.prenom}">${c.prenom}</a></b> — moyenne ${c.moyenne}/10
        <small>(👩 ${c.maman} · 👨 ${c.papa})</small>
      </div>`).join("") : `<div class="card">Pas encore de prénom aimé par les deux (≥ ${SEUIL_COUP_DE_COEUR}).</div>`}`;
}
