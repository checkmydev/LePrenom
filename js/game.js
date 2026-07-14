import { loadCatalog, pickRound } from "./catalog.js";
import { renderStars } from "./stars.js";
import { getParent } from "./profile.js";
import { upsertRating, toggleFavori, fetchFavoris } from "./supabase.js";
import { MANCHE_TAILLE, SEUIL_ANALYSE_IA } from "./config.js";
import { analyserPrenom } from "./ia.js";

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
  const cat = await loadCatalog();
  const round = pickRound(cat, MANCHE_TAILLE);
  const parent = getParent();
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
    renderStars(card.querySelector(".rate"), {
      onRate: async (note) => {
        try {
          await upsertRating({ prenom: p.prenom, sexe: p.sexe, parent, note });
          slot.textContent = "✔️ Noté " + note + "/10";
          if (note > SEUIL_ANALYSE_IA) {
            slot.textContent = "✨ Analyse du prénom en cours…";
            const a = await analyserPrenom(p.prenom, p.sexe);
            slot.innerHTML = `✨ <b>${p.prenom}</b> : ${a.signification || ""}
              <a href="#fiche" data-prenom="${p.prenom}">voir la fiche →</a>`;
          }
        } catch (e) {
          slot.textContent = "⚠️ Erreur : " + e.message;
        }
      },
    });
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

export function initJeu() {
  const parent = getParent();
  if (!parent) { location.hash = "#accueil"; return; }
  el().innerHTML = `<div class="card" style="text-align:center">
      <h2>Prêt·e ?</h2><button class="btn" id="go">▶️ GO</button></div>`;
  el().querySelector("#go").addEventListener("click", startRound);
}
