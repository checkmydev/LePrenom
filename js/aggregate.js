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
