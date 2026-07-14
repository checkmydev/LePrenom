// Fonctions pures de parsing/nettoyage du fichier INSEE des prénoms.

export function normalizePrenom(raw) {
  const s = String(raw).trim().toLowerCase();
  // Capitale sur chaque segment séparé par - ou espace
  return s.replace(/(^|[-\s])([a-zàâäéèêëîïôöùûüç])/g,
    (_, sep, ch) => sep + ch.toUpperCase());
}

export function parseInsee(csvText) {
  const lines = csvText.split(/\r?\n/).filter(Boolean);
  const map = new Map(); // key `${prenom}|${sexe}` -> count
  for (let i = 1; i < lines.length; i++) {
    const [sexe, preusuel, , nombre] = lines[i].split(";");
    if (!preusuel || preusuel.startsWith("_")) continue;        // _PRENOMS_RARES
    if (preusuel.replace(/[-\s]/g, "").length < 2) continue;    // 1 lettre / vide
    const prenom = normalizePrenom(preusuel);
    const sx = sexe === "1" ? "m" : sexe === "2" ? "f" : null;
    if (!sx) continue;
    const key = `${prenom}|${sx}`;
    const n = parseInt(nombre, 10) || 0;
    map.set(key, (map.get(key) || 0) + n);
  }
  return [...map.entries()].map(([key, count]) => {
    const [prenom, sexe] = key.split("|");
    return { prenom, sexe, count };
  });
}
