// test/insee-parse.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseInsee, normalizePrenom } from "../scripts/insee-parse.mjs";

test("normalizePrenom met en Capitale et trim", () => {
  assert.equal(normalizePrenom("  LÉA "), "Léa");
  assert.equal(normalizePrenom("JEAN-PIERRE"), "Jean-Pierre");
});

test("parseInsee agrège par prénom+sexe et ignore les rares/invalides", () => {
  const csv = [
    "sexe;preusuel;annais;nombre",
    "2;LEA;2000;100",
    "2;LEA;2001;50",
    "1;GABRIEL;2001;200",
    "1;_PRENOMS_RARES;2001;9999",
    "2;X;2001;5",
  ].join("\n");
  const out = parseInsee(csv);
  const lea = out.find(p => p.prenom === "Lea" && p.sexe === "f");
  assert.equal(lea.count, 150);
  assert.ok(out.find(p => p.prenom === "Gabriel" && p.sexe === "m"));
  assert.ok(!out.find(p => p.prenom.includes("RARES")));
  assert.ok(!out.find(p => p.prenom === "X"), "prénom d'une lettre exclu");
});
