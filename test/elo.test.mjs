// test/elo.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeElo } from "../js/elo.js";

test("le gagnant gagne des points, le perdant en perd (égaux au départ)", () => {
  const { winner, loser } = computeElo(1000, 1000, 32);
  assert.equal(winner, 1016);
  assert.equal(loser, 984);
});

test("battre un plus fort rapporte plus", () => {
  const a = computeElo(1000, 1400, 32); // outsider gagne
  assert.ok(a.winner - 1000 > 16);
});
