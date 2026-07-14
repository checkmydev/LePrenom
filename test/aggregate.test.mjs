// test/aggregate.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { aggregate, coupsDeCoeur } from "../js/aggregate.js";

const rows = [
  { prenom: "Léa", parent: "maman", note: 9, sexe: "f" },
  { prenom: "Léa", parent: "papa", note: 7, sexe: "f" },
  { prenom: "Tom", parent: "maman", note: 8, sexe: "m" },
  { prenom: "Tom", parent: "papa", note: 3, sexe: "m" },
];

test("aggregate calcule la moyenne et trie décroissant", () => {
  const a = aggregate(rows);
  assert.equal(a[0].prenom, "Léa");
  assert.equal(a[0].moyenne, 8);
  assert.equal(a[0].nb, 2);
});

test("coupsDeCoeur = note >= seuil par les deux parents", () => {
  const c = coupsDeCoeur(rows, 7);
  assert.deepEqual(c.map(x => x.prenom), ["Léa"]);
});
