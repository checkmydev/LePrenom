import { loadCatalog, pickPair } from "./catalog.js";
import { getParent } from "./profile.js";
import { computeElo } from "./elo.js";
import { fetchElo, saveElo, recordDuel } from "./supabase.js";
import { ELO_DEFAUT, ELO_K } from "./config.js";
import { openFiche } from "./fiche.js";

const el = () => document.getElementById("screen-duel");
let eloMap = null;

function score(p) { return eloMap.get(p) ?? ELO_DEFAUT; }

async function nextPair() {
  const cat = await loadCatalog();
  const [a, b] = pickPair(cat);
  el().innerHTML = `
    <h2>Lequel préfères-tu ?</h2>
    <div style="display:flex; gap:12px">
      ${[a, b].map((p, i) => `
        <div class="card" style="flex:1; text-align:center; cursor:pointer" data-choice="${i}">
          <div class="prenom-nom">${p.prenom}</div>
          <span class="badge-sexe ${p.sexe}">${p.sexe === "f" ? "fille" : "garçon"}</span>
        </div>`).join("")}
    </div>
    <p style="text-align:center"><a href="#" id="skip">Aucun des deux / passer →</a></p>`;

  const pick = async (win, lose) => {
    const r = computeElo(score(win.prenom), score(lose.prenom), ELO_K);
    eloMap.set(win.prenom, r.winner);
    eloMap.set(lose.prenom, r.loser);
    try {
      await saveElo([
        { prenom: win.prenom, score: r.winner },
        { prenom: lose.prenom, score: r.loser },
      ]);
      await recordDuel({ gagnant: win.prenom, perdant: lose.prenom, parent: getParent() });
    } catch (e) { console.warn(e); }
    nextPair();
  };
  el().querySelectorAll("[data-choice]").forEach((c) =>
    c.addEventListener("click", () => c.dataset.choice === "0" ? pick(a, b) : pick(b, a)));
  el().querySelector("#skip").addEventListener("click", (e) => { e.preventDefault(); nextPair(); });
}

export async function initDuel() {
  if (!getParent()) { location.hash = "#accueil"; return; }
  el().innerHTML = `<div class="card">Chargement…</div>`;
  const rows = await fetchElo();
  eloMap = new Map(rows.map(r => [r.prenom, r.score]));
  nextPair();
}
