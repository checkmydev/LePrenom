// Origine sélectionnée pour les sessions de vote (localStorage).
const KEY = "leprenom.origine";

export function getOrigine() {
  return localStorage.getItem(KEY) || "Toutes";
}

export function setOrigine(o) {
  localStorage.setItem(KEY, o || "Toutes");
}
