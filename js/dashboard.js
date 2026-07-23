import { fetchRatings, upsertRating } from "./supabase.js";
import { adjustedRanking, coupsDeCoeur, topByParent } from "./aggregate.js";
import { getParent, labelParent } from "./profile.js";
import { getFamille, sexeMatch } from "./family.js";
import { loadCatalog } from "./catalog.js";
import { renderStars } from "./stars.js";
import { SEUIL_COUP_DE_COEUR } from "./config.js";

const el = () => document.getElementById("screen-dashboard");

export async function initDashboard() {
  const parent = getParent();
  const famille = getFamille();
  if (!famille) { location.hash = "#accueil"; return; }
  el().innerHTML = `<div class="card">Chargement…</div>`;
  let rows;
  try {
    rows = await fetchRatings(famille);
  } catch (e) {
    el().innerHTML = `<div class="card">⚠️ Impossible de charger les notes : ${e.message}</div>`;
    return;
  }
  const match = sexeMatch(famille);
  rows = rows.filter(match); // selon le sexe réglé pour la famille
  const catF = (await loadCatalog()).filter(match);
  const total = catF.length;
  const nbMaman = rows.filter(r => r.parent === "maman").length;
  const nbPapa = rows.filter(r => r.parent === "papa").length;
  const pct = (n, t = total) => t ? Math.round((n / t) * 1000) / 10 : 0;

  // --- Progression par origine ---
  const origineOf = new Map(catF.map(p => [p.prenom, p.origine]));
  const totalByOrig = {};
  for (const p of catF) totalByOrig[p.origine] = (totalByOrig[p.origine] || 0) + 1;
  const ratedByOrig = { maman: {}, papa: {} };
  for (const r of rows) {
    const o = origineOf.get(r.prenom);
    if (o && ratedByOrig[r.parent]) ratedByOrig[r.parent][o] = (ratedByOrig[r.parent][o] || 0) + 1;
  }
  const origins = Object.keys(totalByOrig).sort((a, b) => totalByOrig[b] - totalByOrig[a]);
  const origTableRows = origins.map((o) => {
    const t = totalByOrig[o];
    const m = ratedByOrig.maman[o] || 0;
    const p = ratedByOrig.papa[o] || 0;
    return `<tr>
      <td style="padding:4px 8px">${o}</td>
      <td style="padding:4px 8px; text-align:right; color:#6b7280">${t}</td>
      <td style="padding:4px 8px; text-align:right">${m} <small style="color:#6b7280">(${pct(m, t)}%)</small></td>
      <td style="padding:4px 8px; text-align:right">${p} <small style="color:#6b7280">(${pct(p, t)}%)</small></td>
    </tr>`;
  }).join("");
  const kpi = (emoji, label, n) => {
    const p = pct(n);
    return `<div class="card" style="flex:1; min-width:150px; text-align:center">
      <div>${emoji} ${label}</div>
      <div style="font-size:1.5rem; font-weight:800; color:var(--violet)">${p}%</div>
      <small>${n} / ${total} prénoms notés</small>
      <div style="height:6px; background:#eee; border-radius:4px; margin-top:6px; overflow:hidden">
        <div style="height:100%; width:${Math.max(p, p > 0 ? 1 : 0)}%; background:var(--violet)"></div>
      </div>
    </div>`;
  };

  const top = adjustedRanking(rows).slice(0, 10);
  const coeurs = coupsDeCoeur(rows, SEUIL_COUP_DE_COEUR);
  const topMaman = topByParent(rows, "maman", 3); // toutes les notes > 3
  const topPapa = topByParent(rows, "papa", 3);
  const colonne = (list) => list.length
    ? list.map((t, i) => `<div style="display:flex; justify-content:space-between; gap:6px">
        <span>${i + 1}. <a href="#" data-prenom="${t.prenom}" data-sexe="${t.sexe||''}">${t.prenom}</a></span>
        <b style="color:var(--or)">${t.note}</b></div>`).join("")
    : `<div style="color:#9ca3af">Aucune note</div>`;
  // Détail des notes par parent, par prénom
  const notes = {};
  for (const r of rows) (notes[r.prenom] ||= {})[r.parent] = r.note;
  const par = (prenom, p) => notes[prenom]?.[p] ?? "—";

  el().innerHTML = `
    <h2>📊 Progression</h2>
    <div style="display:flex; gap:12px; flex-wrap:wrap">
      ${kpi("👩", "Maman", nbMaman)}
      ${kpi("👨", "Papa", nbPapa)}
    </div>
    <div class="card" style="overflow-x:auto">
      <b>Par origine</b> <small style="color:#6b7280">(notés / total)</small>
      <table style="width:100%; border-collapse:collapse; margin-top:6px; font-size:.9rem">
        <thead><tr style="text-align:left; color:#6b7280">
          <th style="padding:4px 8px">Origine</th>
          <th style="padding:4px 8px; text-align:right">Total</th>
          <th style="padding:4px 8px; text-align:right">👩 Maman</th>
          <th style="padding:4px 8px; text-align:right">👨 Papa</th>
        </tr></thead>
        <tbody>${origTableRows}</tbody>
      </table>
    </div>

    <h2>🏆 Top 10</h2>
    <p style="color:#6b21a8; font-size:.85rem; margin-top:-4px">
      Score ajusté : recentré sur la moyenne de chaque parent, pour comparer des échelles différentes (Papa/Maman).</p>
    ${top.length ? top.map((t, i) => {
      const mineMissing = parent && notes[t.prenom]?.[parent] === undefined;
      return `
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px">
          <span><b>${i + 1}.</b> <a href="#" data-prenom="${t.prenom}" data-sexe="${t.sexe||''}">${t.prenom}</a>
            <span class="badge-sexe ${t.sexe||''}">${t.sexe==='f'?'fille':t.sexe==='m'?'garçon':''}</span></span>
          <span style="text-align:right; white-space:nowrap">
            <b>${t.score}</b> <small>ajusté</small><br>
            <small>👩 ${par(t.prenom,'maman')} · 👨 ${par(t.prenom,'papa')}</small>
          </span>
        </div>
        ${mineMissing ? `<div class="rate-row" style="margin-top:8px; font-size:.85rem">
          Ta note (${labelParent(parent)}) :
          <span class="rate-top" data-rp="${t.prenom}" data-rs="${t.sexe||''}"></span></div>` : ""}
      </div>`;
    }).join("") : `<div class="card">Aucune note pour l'instant.</div>`}

    <h2>👩 vs 👨 — Le top de chacun <small style="font-weight:400">(notes > 3)</small></h2>
    <div style="display:flex; gap:12px; flex-wrap:wrap">
      <div style="flex:1; min-width:150px"><div class="card">
        <b>👩 Top Maman</b> <small>(${topMaman.length})</small>
        <div style="margin-top:6px; max-height:420px; overflow-y:auto">${colonne(topMaman)}</div>
      </div></div>
      <div style="flex:1; min-width:150px"><div class="card">
        <b>👨 Top Papa</b> <small>(${topPapa.length})</small>
        <div style="margin-top:6px; max-height:420px; overflow-y:auto">${colonne(topPapa)}</div>
      </div></div>
    </div>

    <h2>💞 Coups de cœur communs</h2>
    ${coeurs.length ? coeurs.map(c => `
      <div class="card">
        <b><a href="#" data-prenom="${c.prenom}">${c.prenom}</a></b> — moyenne ${c.moyenne}/10
        <small>(👩 ${c.maman} · 👨 ${c.papa})</small>
      </div>`).join("") : `<div class="card">Pas encore de prénom aimé par les deux (≥ ${SEUIL_COUP_DE_COEUR}).</div>`}`;

  // Noter directement depuis le Top les prénoms non encore notés par le joueur courant.
  el().querySelectorAll(".rate-top").forEach((sp) => {
    renderStars(sp, {
      onRate: async (note) => {
        try {
          await upsertRating({ prenom: sp.dataset.rp, sexe: sp.dataset.rs, parent, note, famille });
          initDashboard(); // rafraîchit le classement et le détail
        } catch (e) {
          sp.parentElement.innerHTML = "⚠️ " + e.message;
        }
      },
    });
  });
}
