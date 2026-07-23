import { getParent, setParent, labelParent } from "./profile.js";
import { getFamille, setFamille, clearFamille, familleLabel, FAMILLES } from "./family.js";
import { initJeu } from "./game.js";
import { initFiche, openFiche } from "./fiche.js";
import { initDuel } from "./duel.js";
import { initDashboard } from "./dashboard.js";
import { initFavoris } from "./favoris.js";

const screens = ["accueil", "jeu", "duel", "dashboard", "favoris", "fiche"];

const inits = { jeu: initJeu, fiche: initFiche, duel: initDuel, dashboard: initDashboard, favoris: initFavoris };
export function show(name) {
  for (const s of screens) {
    document.getElementById(`screen-${s}`).classList.toggle("hidden", s !== name);
  }
  document.querySelectorAll("#tabbar a").forEach(a =>
    a.classList.toggle("active", a.getAttribute("href") === `#${name}`));
  if (inits[name]) inits[name]();
}

const ready = () => getFamille() && getParent();

function route() {
  let name = (location.hash.replace("#", "") || "accueil");
  if (!ready() && name !== "accueil") name = "accueil";
  show(screens.includes(name) ? name : "accueil");
}

function renderAccueil() {
  const el = document.getElementById("screen-accueil");
  const fam = getFamille();
  const p = getParent();

  if (!fam) {
    el.innerHTML = `
      <div class="card" style="text-align:center">
        <h1>👶 LePrenom</h1>
        <p>Choisis ta famille</p>
        <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap">
          ${Object.entries(FAMILLES).map(([k, v], i) =>
            `<button class="btn ${i ? "secondary" : ""}" data-fam="${k}">${v.label}</button>`).join("")}
        </div>
      </div>`;
    el.querySelectorAll("button[data-fam]").forEach(b =>
      b.addEventListener("click", () => { setFamille(b.dataset.fam); refreshWho(); renderAccueil(); }));
    return;
  }

  el.innerHTML = `
    <div class="card" style="text-align:center">
      <h1>👶 LePrenom</h1>
      <p><b>${familleLabel(fam)}</b> · <a href="#" id="chgfam">changer de famille</a></p>
      <p>Qui joue ?</p>
      <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap">
        <button class="btn" data-p="maman">👩 Maman</button>
        <button class="btn secondary" data-p="papa">👨 Papa</button>
      </div>
      ${p ? `<p style="margin-top:16px">Profil : <b>${labelParent(p)}</b><br>
        <a href="#jeu">Commencer à jouer →</a></p>` : ""}
    </div>`;
  el.querySelector("#chgfam").addEventListener("click", (e) => {
    e.preventDefault(); clearFamille(); refreshWho(); renderAccueil();
  });
  el.querySelectorAll("button[data-p]").forEach(b =>
    b.addEventListener("click", () => { setParent(b.dataset.p); location.hash = "#jeu"; refreshWho(); renderAccueil(); }));
}

function refreshWho() {
  const fam = getFamille();
  const p = getParent();
  document.getElementById("who").textContent =
    fam ? (familleLabel(fam) + (p ? " · " + labelParent(p) : "")) : "";
  document.getElementById("tabbar").classList.toggle("hidden", !(fam && p));
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
