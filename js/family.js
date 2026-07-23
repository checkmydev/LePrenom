// Espaces "famille" : chaque famille a ses propres notes (colonne `famille` en DB),
// son nom de famille (pour l'analyse IA) et son réglage de sexe des prénoms proposés.
const FKEY = "leprenom.famille";
const sexeKey = (fam) => `leprenom.sexe.${fam}`;

export const FAMILLES = {
  gerard:   { label: "Famille Gerard",   nom: "Gerard",   sexeFixe: "f" },   // figé sur fille
  hocepied: { label: "Famille Hocepied", nom: "Hocepied", sexeFixe: null },  // sexe réglable
};

export function getFamille() {
  const v = localStorage.getItem(FKEY);
  return FAMILLES[v] ? v : null;
}
export function setFamille(f) { if (FAMILLES[f]) localStorage.setItem(FKEY, f); }
export function clearFamille() { localStorage.removeItem(FKEY); }
export function familleLabel(f) { return FAMILLES[f]?.label || ""; }
export function familleNom(f) { return FAMILLES[f]?.nom || "Gerard"; }
export function sexeReglable(f) { return !!FAMILLES[f] && FAMILLES[f].sexeFixe === null; }

// Sexe des prénoms proposés : figé pour la famille, sinon réglable ('f' | 'm' | 'mixte').
export function getSexe(f) {
  const fixe = FAMILLES[f]?.sexeFixe;
  if (fixe) return fixe;
  const v = localStorage.getItem(sexeKey(f));
  return v === "f" || v === "m" || v === "mixte" ? v : "mixte";
}
export function setSexe(f, s) { localStorage.setItem(sexeKey(f), s); }

export function sexeLabel(s) {
  return s === "f" ? "Fille" : s === "m" ? "Garçon" : "Mixte";
}

// Prédicat de filtrage, applicable au catalogue comme aux notes (les deux ont `.sexe`).
export function sexeMatch(f) {
  const s = getSexe(f);
  if (s === "f") return (x) => x.sexe === "f";
  if (s === "m") return (x) => x.sexe === "m";
  return () => true; // mixte
}
