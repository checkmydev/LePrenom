import { getParent } from "./profile.js";
import { fetchRatings, upsertRating } from "./supabase.js";
import { aggregate } from "./aggregate.js";
import { loadCatalog } from "./catalog.js";
import { getOrigine } from "./settings.js";
import { getFamille, sexeMatch } from "./family.js";

const el = () => document.getElementById("screen-duel");
const TOP_N = 100;

let parent;      // joueur courant (maman/papa)
let famille;     // espace famille courant
let playerNote;  // Map prenom -> note actuelle du joueur courant
let avgNote;     // Map prenom -> moyenne (2 parents) arrondie, sert de note de départ
let pool;        // top-N agrégé : [{prenom, sexe, moyenne, nb}]

// Note de départ pour le joueur : sa propre note, sinon la moyenne arrondie, sinon 5.
function currentNote(prenom) {
  if (playerNote.has(prenom)) return playerNote.get(prenom);
  return avgNote.get(prenom) ?? 5;
}

// Choisit une paire de prénoms DISTINCTS et DE MÊME GENRE dans le top-N.
function pickSameGenderPair(rnd = Math.random) {
  const bySex = { f: [], m: [] };
  for (const p of pool) if (bySex[p.sexe]) bySex[p.sexe].push(p);
  const genders = Object.keys(bySex).filter(g => bySex[g].length >= 2);
  if (!genders.length) return null;
  const g = genders[Math.floor(rnd() * genders.length)];
  const list = bySex[g].slice();
  const a = list.splice(Math.floor(rnd() * list.length), 1)[0];
  const b = list[Math.floor(rnd() * list.length)];
  return [a, b];
}

function nextPair() {
  const pair = pickSameGenderPair();
  if (!pair) {
    el().innerHTML = `<div class="card">Pas assez de prénoms notés pour un duel.
      Il faut au moins 2 prénoms du même genre parmi les ${TOP_N} mieux notés.
      Va noter des prénoms dans l'onglet 🎮 Jeu.</div>`;
    return;
  }
  const [a, b] = pair;
  el().innerHTML = `
    <h2>Lequel préfères-tu ?</h2>
    <p style="text-align:center; color:#6b21a8; font-size:.9rem">
      Duel entre les ${TOP_N} prénoms les mieux notés (même genre) · +1★ au gagnant, −1★ au perdant</p>
    <div style="display:flex; gap:12px">
      ${[a, b].map((p, i) => `
        <div class="card" style="flex:1; text-align:center; cursor:pointer" data-choice="${i}">
          <div class="prenom-nom">${p.prenom}</div>
          <span class="badge-sexe ${p.sexe}">${p.sexe === "f" ? "fille" : "garçon"}</span>
          <div style="margin-top:6px; color:var(--or)">★ ${currentNote(p.prenom)}/10</div>
        </div>`).join("")}
    </div>
    <p style="text-align:center"><a href="#" id="skip">Aucun des deux / passer →</a></p>`;

  const apply = async (win, lose) => {
    const wNote = Math.min(10, currentNote(win.prenom) + 1);
    const lNote = Math.max(1, currentNote(lose.prenom) - 1);
    playerNote.set(win.prenom, wNote);
    playerNote.set(lose.prenom, lNote);
    try {
      await upsertRating({ prenom: win.prenom, sexe: win.sexe, parent, note: wNote, famille });
      await upsertRating({ prenom: lose.prenom, sexe: lose.sexe, parent, note: lNote, famille });
    } catch (e) { console.warn(e); }
    nextPair();
  };

  el().querySelectorAll("[data-choice]").forEach((c) =>
    c.addEventListener("click", () => c.dataset.choice === "0" ? apply(a, b) : apply(b, a)));
  el().querySelector("#skip").addEventListener("click", (e) => { e.preventDefault(); nextPair(); });
}

export async function initDuel() {
  parent = getParent();
  famille = getFamille();
  if (!parent || !famille) { location.hash = "#accueil"; return; }
  el().innerHTML = `<div class="card">Chargement…</div>`;
  let rows;
  try {
    rows = await fetchRatings(famille);
  } catch (e) {
    el().innerHTML = `<div class="card">⚠️ Impossible de charger les duels : ${e.message}</div>`;
    return;
  }
  rows = rows.filter(sexeMatch(famille)); // selon le sexe réglé pour la famille
  const cat = await loadCatalog();
  const origineOf = new Map(cat.map(p => [p.prenom, p.origine]));
  const origine = getOrigine();
  const agg = aggregate(rows);                 // trié par moyenne décroissante
  let ranked = agg;
  if (origine !== "Toutes") {
    const f = agg.filter(a => origineOf.get(a.prenom) === origine);
    if (f.length) ranked = f; // garde-fou
  }
  pool = ranked.slice(0, TOP_N);
  avgNote = new Map(agg.map(a => [a.prenom, Math.round(a.moyenne)]));
  playerNote = new Map(rows.filter(r => r.parent === parent).map(r => [r.prenom, r.note]));
  nextPair();
}
