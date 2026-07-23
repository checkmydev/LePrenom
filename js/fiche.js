import { analyserPrenom } from "./ia.js";
import { fetchAnalyse } from "./supabase.js";
import { getFamille, familleNom } from "./family.js";

const el = () => document.getElementById("screen-fiche");
let _current = null; // {prenom, sexe}

export function openFiche(prenom, sexe) { _current = { prenom, sexe }; location.hash = "#fiche"; }

export async function initFiche() {
  if (!_current) { el().innerHTML = `<div class="card">Ouvre une fiche depuis un prénom.</div>`; return; }
  const { prenom, sexe } = _current;
  const famille = getFamille() || "gerard";
  const nom = familleNom(famille);
  el().innerHTML = `<div class="card"><h2>${prenom}</h2><p>Chargement de l'analyse…</p></div>`;
  try {
    let a = await fetchAnalyse(prenom, famille);
    if (!a) a = await analyserPrenom(prenom, sexe, nom, famille);
    el().innerHTML = `
      <div class="card">
        <h2>${prenom} <span class="badge-sexe ${sexe||''}">${sexe==='f'?'fille':sexe==='m'?'garçon':''}</span></h2>
        <p><b>Signification :</b> ${a.signification || "—"}</p>
        <p><b>Description :</b> ${a.description || "—"}</p>
        <p><b>Jeux de mots :</b> ${a.jeux_de_mots || "—"}</p>
        <p><b>Avec « ${nom} » :</b> ${a.compat_gerard || "—"}</p>
      </div>`;
  } catch (e) {
    el().innerHTML = `
      <div class="card">
        <h2>${prenom} <span class="badge-sexe ${sexe||''}">${sexe==='f'?'fille':sexe==='m'?'garçon':''}</span></h2>
        <p>✨ L'analyse IA (signification, jeux de mots, compatibilité avec « ${nom} »)
        n'est pas encore activée.</p>
        <p style="color:#6b21a8; font-size:.9rem">Elle apparaîtra ici une fois la fonction
        d'analyse déployée. En attendant, tu peux continuer à noter et à faire des duels.</p>
      </div>`;
  }
}
