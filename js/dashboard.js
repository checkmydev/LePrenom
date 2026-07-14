import { fetchRatings } from "./supabase.js";
import { adjustedRanking, coupsDeCoeur } from "./aggregate.js";
import { SEUIL_COUP_DE_COEUR } from "./config.js";

const el = () => document.getElementById("screen-dashboard");

export async function initDashboard() {
  el().innerHTML = `<div class="card">Chargement…</div>`;
  let rows;
  try {
    rows = await fetchRatings();
  } catch (e) {
    el().innerHTML = `<div class="card">⚠️ Impossible de charger les notes : ${e.message}</div>`;
    return;
  }
  const top = adjustedRanking(rows).slice(0, 10);
  const coeurs = coupsDeCoeur(rows, SEUIL_COUP_DE_COEUR);
  // Détail des notes par parent, par prénom
  const notes = {};
  for (const r of rows) (notes[r.prenom] ||= {})[r.parent] = r.note;
  const par = (prenom, p) => notes[prenom]?.[p] ?? "—";
  el().innerHTML = `
    <h2>🏆 Top 10</h2>
    <p style="color:#6b21a8; font-size:.85rem; margin-top:-4px">
      Score ajusté : recentré sur la moyenne de chaque parent, pour comparer des échelles différentes (Papa/Maman).</p>
    ${top.length ? top.map((t, i) => `
      <div class="card" style="display:flex; justify-content:space-between; align-items:center; gap:8px">
        <span><b>${i + 1}.</b> <a href="#" data-prenom="${t.prenom}" data-sexe="${t.sexe||''}">${t.prenom}</a>
          <span class="badge-sexe ${t.sexe||''}">${t.sexe==='f'?'fille':t.sexe==='m'?'garçon':''}</span></span>
        <span style="text-align:right; white-space:nowrap">
          <b>${t.score}</b> <small>ajusté</small><br>
          <small>👩 ${par(t.prenom,'maman')} · 👨 ${par(t.prenom,'papa')}</small>
        </span>
      </div>`).join("") : `<div class="card">Aucune note pour l'instant.</div>`}
    <h2>💞 Coups de cœur communs</h2>
    ${coeurs.length ? coeurs.map(c => `
      <div class="card">
        <b><a href="#" data-prenom="${c.prenom}">${c.prenom}</a></b> — moyenne ${c.moyenne}/10
        <small>(👩 ${c.maman} · 👨 ${c.papa})</small>
      </div>`).join("") : `<div class="card">Pas encore de prénom aimé par les deux (≥ ${SEUIL_COUP_DE_COEUR}).</div>`}`;
}
