// test/aggregate.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { aggregate, coupsDeCoeur, adjustedRanking, topByParent } from "../js/aggregate.js";

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

test("adjustedRanking recentre chaque parent : une note = sa propre moyenne donne 5", () => {
  // Maman moyenne 6, Papa moyenne 3 ; A et B notés pile à la moyenne de chacun
  const r = [
    { prenom: "A", parent: "maman", note: 6, sexe: "f" },
    { prenom: "A", parent: "papa", note: 3, sexe: "f" },
    { prenom: "B", parent: "maman", note: 6, sexe: "m" },
    { prenom: "B", parent: "papa", note: 3, sexe: "m" },
  ];
  const a = adjustedRanking(r);
  assert.equal(a.find(x => x.prenom === "A").score, 5);
  assert.equal(a.find(x => x.prenom === "B").score, 5);
});

test("topByParent : uniquement les notes du parent, triées décroissant", () => {
  const r = [
    { prenom: "Léa", parent: "maman", note: 9, sexe: "f" },
    { prenom: "Tom", parent: "maman", note: 6, sexe: "m" },
    { prenom: "Zoé", parent: "maman", note: 9, sexe: "f" },
    { prenom: "Léa", parent: "papa", note: 3, sexe: "f" },
  ];
  const maman = topByParent(r, "maman");
  assert.deepEqual(maman.map(x => x.prenom), ["Léa", "Zoé", "Tom"]); // 9,9 (alpha),6
  const papa = topByParent(r, "papa");
  assert.deepEqual(papa.map(x => `${x.prenom}:${x.note}`), ["Léa:3"]);
});

test("topByParent : filtre les notes <= min", () => {
  const r = [
    { prenom: "A", parent: "papa", note: 5, sexe: "m" },
    { prenom: "B", parent: "papa", note: 3, sexe: "m" },
    { prenom: "C", parent: "papa", note: 2, sexe: "m" },
  ];
  assert.deepEqual(topByParent(r, "papa", 3).map(x => x.prenom), ["A"]); // seul > 3
});

test("adjustedRanking : au-dessus de sa barre bat en-dessous, malgré les échelles", () => {
  // Papa moyenne 3 (A=4,B=2), Maman moyenne 6 (A=7,B=5)
  const r = [
    { prenom: "A", parent: "maman", note: 7, sexe: "f" },
    { prenom: "A", parent: "papa", note: 4, sexe: "f" },
    { prenom: "B", parent: "maman", note: 5, sexe: "f" },
    { prenom: "B", parent: "papa", note: 2, sexe: "f" },
  ];
  const a = adjustedRanking(r);
  assert.equal(a[0].prenom, "A");
  assert.equal(a[0].score, 6); // (7-6+5 + 4-3+5)/2 = (6+6)/2
  assert.equal(a[1].score, 4); // (5-6+5 + 2-3+5)/2 = (4+4)/2
});
