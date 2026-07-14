import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { parseInsee } from "./insee-parse.mjs";

const INSEE_URL = process.env.INSEE_URL
  || "https://www.insee.fr/fr/statistiques/fichier/8205621/prenoms-2023-csv.zip"; // à adapter si le lien évolue
const MIN_COUNT = Number(process.env.MIN_COUNT || 200);
const LOCAL = "scripts/nat.csv";

async function getCsv() {
  if (existsSync(LOCAL)) {
    console.log("Lecture locale", LOCAL);
    return readFileSync(LOCAL, "utf8");
  }
  console.log("Téléchargement", INSEE_URL);
  const res = await fetch(INSEE_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status} — placez le CSV décompressé dans ${LOCAL}`);
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("zip") || INSEE_URL.endsWith(".zip")) {
    throw new Error(`Fichier ZIP: décompressez et placez le .csv dans ${LOCAL}, puis relancez.`);
  }
  return await res.text();
}

const csv = await getCsv();
let list = parseInsee(csv).filter(p => p.count >= MIN_COUNT);
list.sort((a, b) => b.count - a.count);
mkdirSync("data", { recursive: true });
writeFileSync("data/prenoms.json", JSON.stringify(list));
console.log(`Écrit data/prenoms.json — ${list.length} prénoms (min count=${MIN_COUNT}).`);
