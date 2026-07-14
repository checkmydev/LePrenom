import { getParent, setParent, labelParent } from "./profile.js";
import { initJeu } from "./game.js";
import { initFiche, openFiche } from "./fiche.js";
import { initDuel } from "./duel.js";
import { initDashboard } from "./dashboard.js";

const screens = ["accueil","jeu","duel","dashboard","favoris","fiche"];

const inits = { jeu: initJeu, fiche: initFiche, duel: initDuel, dashboard: initDashboard };
export function show(name) {
  for (const s of screens) {
    document.getElementById(`screen-${s}`).classList.toggle("hidden", s !== name);
  }
  document.querySelectorAll("#tabbar a").forEach(a =>
    a.classList.toggle("active", a.getAttribute("href") === `#${name}`));
  if (inits[name]) inits[name]();
}

function route() {
  const p = getParent();
  let name = (location.hash.replace("#","") || "accueil");
  if (!p && name !== "accueil") name = "accueil";
  show(screens.includes(name) ? name : "accueil");
}

function renderAccueil() {
  const p = getParent();
  const el = document.getElementById("screen-accueil");
  el.innerHTML = `
    <div class="card" style="text-align:center">
      <h1>👶 LePrenom</h1>
      <p>Qui joue ?</p>
      <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap">
        <button class="btn" data-p="maman">👩 Maman</button>
        <button class="btn secondary" data-p="papa">👨 Papa</button>
      </div>
      ${p ? `<p style="margin-top:16px">Profil actuel : <b>${labelParent(p)}</b><br>
        <a href="#jeu">Commencer à jouer →</a></p>` : ""}
    </div>`;
  el.querySelectorAll("button[data-p]").forEach(b =>
    b.addEventListener("click", () => { setParent(b.dataset.p); location.hash = "#jeu"; refreshWho(); renderAccueil(); }));
}

function refreshWho() {
  const p = getParent();
  document.getElementById("who").textContent = p ? labelParent(p) : "";
  document.getElementById("tabbar").classList.toggle("hidden", !p);
}

document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-prenom]");
  if (a) { e.preventDefault(); openFiche(a.dataset.prenom, a.dataset.sexe); }
});

window.addEventListener("hashchange", route);
window.addEventListener("DOMContentLoaded", () => {
  renderAccueil();
  refreshWho();
  route();
});
