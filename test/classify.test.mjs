import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyOrigine } from "../scripts/classify-origins.mjs";

test("classifyOrigine : quelques prénoms distinctifs", () => {
  assert.equal(classifyOrigine("Yasmine"), "Arabe/Maghreb");
  assert.equal(classifyOrigine("Sarah"), "Hébraïque/biblique");
  assert.equal(classifyOrigine("Anastasia"), "Slave/Europe de l'Est");
  assert.equal(classifyOrigine("Ingrid"), "Nordique");
  assert.equal(classifyOrigine("Mei"), "Asiatique");
  assert.equal(classifyOrigine("Ashley"), "Anglo-saxonne");
  assert.equal(classifyOrigine("Giulia"), "Latine");
  assert.equal(classifyOrigine("Aminata"), "Africaine");
  assert.equal(classifyOrigine("Camille"), "Française");
});

test("classifyOrigine : défaut Française pour prénom sans marqueur", () => {
  assert.equal(classifyOrigine("Zzblorptix"), "Française");
});
