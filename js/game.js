import { loadCatalog, pickRound } from "./catalog.js";
import { renderStars } from "./stars.js";
import { getParent } from "./profile.js";
import { upsertRating, toggleFavori, fetchFavoris, fetchRatings } from "./supabase.js";
import { MANCHE_TAILLE, SEUIL_ANALYSE_IA } from "./config.js";
import { analyserPrenom } from "./ia.js";
import { getOrigine, setOrigine } from "./settings.js";

const el = () => document.getElementById("screen-jeu");

function countdown() {
  return new Promise((resolve) => {
    const layer = document.createElement("div");
    layer.className = "countdown";
    document.body.appendChild(layer);
    const seq = ["3","2","1","GO!"];
    let i = 0;
    const tick = () => {
      layer.innerHTML = `<span>${seq[i]}</span>`;
      i++;
      if (i < seq.length) setTimeout(tick, 800);
      else setTimeout(() => { layer.remove(); resolve(); }, 700);
    };
    tick();
  });
}

async function startRound() {
  await countdown();
  // Filles uniquement, filtrées par l'origine sélectionnée.
  const origine = getOrigine();
  let cat = (await loadCatalog()).filter(p => p.sexe === "f");
  if (origine !== "Toutes") {
    const f = cat.filter(p => p.origine === origine);
    if (f.length) cat = f; // garde-fou si l'origine n'existe pas dans les données
  }
  const parent = getParent();
  const other = parent === "maman" ? "papa" : "maman";
  let allRows = [];
  try { allRows = await fetchRatings(); } catch (e) { console.warn(e); }
  // Prénoms déjà notés par le joueur courant : exclus (ils ne reviennent pas).
  const rated = new Set(allRows.filter(r => r.parent === parent).map(r => r.prenom));
  // Prénoms notés par l'AUTRE parent : à faire remonter en priorité pour compléter le consensus.
  const otherRated = new Set(allRows.filter(r => r.parent === other).map(r => r.prenom));
  const available = cat.filter(p => !rated.has(p.prenom));
  if (!available.length) {
    el().innerHTML = `<div class="card" style="text-align:center">🎉 Tu as noté tous les prénoms !
      Va voir le 🏆 Top ou fais des ⚔️ Duels.</div>`;
    return;
  }
  const priority = available.filter(p => otherRated.has(p.prenom)); // notés par l'autre, pas par toi
  const rest = available.filter(p => !otherRated.has(p.prenom));
  // Priorité d'abord, on complète ensuite avec des prénoms vierges.
  const round = [...pickRound(priority, MANCHE_TAILLE), ...pickRound(rest, MANCHE_TAILLE)]
    .slice(0, MANCHE_TAILLE);
  el().innerHTML = `<h2>Note ces prénoms</h2><div id="round"></div>
    <button class="btn" id="rejouer">🔄 Nouvelle manche</button>`;
  const wrap = el().querySelector("#round");
  for (const p of round) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center">
        <span class="prenom-nom">${p.prenom}</span>
        <span class="badge-sexe ${p.sexe}">${p.sexe === "f" ? "fille" : "garçon"}</span>
      </div>
      <div class="rate"></div>
      <div class="ia-slot" style="margin-top:8px; color:#6b21a8; font-size:.9rem"></div>`;
    const slot = card.querySelector(".ia-slot");
    const rateEl = card.querySelector(".rate");
    const onRate = async (note) => {
      renderStars(rateEl, { value: note, onRate }); // garde les étoiles remplies
      try {
        await upsertRating({ prenom: p.prenom, sexe: p.sexe, parent, note });
        slot.textContent = "✔️ Noté " + note + "/10";
      } catch (e) {
        slot.textContent = "⚠️ Erreur d'enregistrement : " + e.message;
        return;
      }
      if (note > SEUIL_ANALYSE_IA) {
        slot.textContent = "✨ Analyse du prénom en cours…";
        try {
          const a = await analyserPrenom(p.prenom, p.sexe);
          slot.innerHTML = `✨ <b>${p.prenom}</b> : ${a.signification || ""}
            <a href="#fiche" data-prenom="${p.prenom}" data-sexe="${p.sexe}">voir la fiche →</a>`;
        } catch {
          slot.textContent = "✔️ Noté " + note + "/10 · (analyse IA pas encore activée)";
        }
      }
    };
    renderStars(rateEl, { onRate });
    const heart = document.createElement("button");
    heart.className = "btn secondary";
    heart.style.cssText = "padding:6px 12px; margin-top:8px";
    heart.textContent = "🤍 Favori";
    let fav = false;
    heart.addEventListener("click", async () => {
      fav = !fav;
      heart.textContent = fav ? "❤️ Favori" : "🤍 Favori";
      try { await toggleFavori(p.prenom, parent, fav); }
      catch (e) { heart.textContent = "⚠️"; console.warn(e); }
    });
    card.appendChild(heart);
    wrap.appendChild(card);
  }
  el().querySelector("#rejouer").addEventListener("click", startRound);
}

export async function initJeu() {
  const parent = getParent();
  if (!parent) { location.hash = "#accueil"; return; }
  const cat = (await loadCatalog()).filter(p => p.sexe === "f");
  const present = [...new Set(cat.map(p => p.origine).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const cur = getOrigine();
  const opts = ["Toutes", ...present]
    .map(o => `<option value="${o}"${o === cur ? " selected" : ""}>${o}</option>`).join("");
  el().innerHTML = `<div class="card" style="text-align:center">
      <h2>Prêt·e ?</h2>
      <p style="margin:8px 0">Origine des prénoms :<br>
        <select id="origine" style="margin-top:6px; padding:8px 10px; border-radius:10px; border:1px solid #ddd; font-size:1rem">${opts}</select></p>
      <button class="btn" id="go">▶️ GO</button></div>`;
  el().querySelector("#origine").addEventListener("change", (e) => setOrigine(e.target.value));
  el().querySelector("#go").addEventListener("click", startRound);
}
