let _cache = null;

export async function loadCatalog() {
  if (_cache) return _cache;
  const res = await fetch("data/prenoms.json");
  _cache = await res.json();
  return _cache;
}

// Fisher-Yates partiel ; rnd injectable pour les tests
export function pickRound(list, n = 10, rnd = Math.random) {
  const arr = list.slice();
  const k = Math.min(n, arr.length);
  for (let i = 0; i < k; i++) {
    const j = i + Math.floor(rnd() * (arr.length - i));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, k);
}

export function pickPair(list, rnd = Math.random) {
  const [a, b] = pickRound(list, 2, rnd);
  return [a, b];
}
