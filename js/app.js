const screens = ["accueil","jeu","duel","dashboard","favoris","fiche"];

export function show(name) {
  for (const s of screens) {
    document.getElementById(`screen-${s}`).classList.toggle("hidden", s !== name);
  }
  document.querySelectorAll("#tabbar a").forEach(a =>
    a.classList.toggle("active", a.getAttribute("href") === `#${name}`));
}

function route() {
  const name = (location.hash.replace("#","") || "accueil");
  show(screens.includes(name) ? name : "accueil");
}

window.addEventListener("hashchange", route);
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("screen-accueil").innerHTML =
    `<div class="card"><h1>👶 LePrenom</h1><p>Scaffold OK — écrans branchés dans les tâches suivantes.</p></div>`;
  route();
});
