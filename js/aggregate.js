export function aggregate(rows) {
  const m = new Map();
  for (const r of rows) {
    if (!m.has(r.prenom)) m.set(r.prenom, { prenom: r.prenom, sexe: r.sexe, notes: [] });
    m.get(r.prenom).notes.push(r.note);
  }
  return [...m.values()]
    .map(x => ({ prenom: x.prenom, sexe: x.sexe, nb: x.notes.length,
      moyenne: Math.round((x.notes.reduce((a, b) => a + b, 0) / x.notes.length) * 10) / 10 }))
    .sort((a, b) => b.moyenne - a.moyenne || b.nb - a.nb);
}

// Score ajusté : corrige le biais d'échelle entre parents.
// Chaque note est recentrée sur la moyenne du parent qui l'a donnée
// (note − moyenne_du_parent + 5), puis on moyenne les parents ayant noté le prénom.
// Un prénom au-dessus de la "barre" personnelle de chacun monte, même si un parent
// note globalement plus bas.
export function adjustedRanking(rows) {
  const sum = {}, cnt = {};
  for (const r of rows) {
    sum[r.parent] = (sum[r.parent] || 0) + r.note;
    cnt[r.parent] = (cnt[r.parent] || 0) + 1;
  }
  const mean = {};
  for (const p in sum) mean[p] = sum[p] / cnt[p];

  const m = new Map();
  for (const r of rows) {
    if (!m.has(r.prenom)) m.set(r.prenom, { prenom: r.prenom, sexe: r.sexe, adj: [] });
    m.get(r.prenom).adj.push(r.note - (mean[r.parent] ?? r.note) + 5);
  }
  return [...m.values()]
    .map(x => ({ prenom: x.prenom, sexe: x.sexe, nb: x.adj.length,
      score: Math.round((x.adj.reduce((a, b) => a + b, 0) / x.adj.length) * 10) / 10 }))
    .sort((a, b) => b.score - a.score || b.nb - a.nb);
}

export function coupsDeCoeur(rows, seuil = 7) {
  const byName = new Map();
  for (const r of rows) {
    if (!byName.has(r.prenom)) byName.set(r.prenom, {});
    byName.get(r.prenom)[r.parent] = r.note;
  }
  const out = [];
  for (const [prenom, v] of byName) {
    if (v.maman >= seuil && v.papa >= seuil) {
      const notes = [v.maman, v.papa];
      out.push({ prenom, maman: v.maman, papa: v.papa,
        moyenne: Math.round((notes[0] + notes[1]) / 2 * 10) / 10 });
    }
  }
  return out.sort((a, b) => b.moyenne - a.moyenne);
}
