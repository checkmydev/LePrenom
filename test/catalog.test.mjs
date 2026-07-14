// test/catalog.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { pickRound, pickPair } from "../js/catalog.js";

const data = Array.from({ length: 50 }, (_, i) => ({
  prenom: `P${i}`, sexe: i % 2 ? "f" : "m", count: 100 + i,
}));

test("pickRound retourne N prénoms distincts", () => {
  const r = pickRound(data, 10, () => 0.42);
  assert.equal(r.length, 10);
  assert.equal(new Set(r.map(p => p.prenom)).size, 10);
});

test("pickRound plafonne à la taille dispo", () => {
  assert.equal(pickRound(data.slice(0, 3), 10).length, 3);
});

test("pickPair retourne 2 prénoms distincts", () => {
  const [a, b] = pickPair(data);
  assert.notEqual(a.prenom, b.prenom);
});
