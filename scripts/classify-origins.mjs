// Classification heuristique (gratuite, hors-ligne, déterministe) de l'origine
// supposée d'un prénom. Approximatif par nature : listes curées + terminaisons,
// défaut "Française", "Autre" en dernier recours.
//
// Usage : node scripts/classify-origins.mjs   (met à jour data/prenoms.json)

import { readFileSync, writeFileSync } from "node:fs";

const norm = (s) =>
  String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");

const set = (arr) => new Set(arr.map(norm));

// --- Listes curées (prénoms distinctifs par origine) ---
const NAMES = {
  "Arabe/Maghreb": set([
    "yasmine","yasmina","aya","nour","noor","lina","lyna","maryam","meriem","myriam","fatima","fatiha",
    "amel","amèle","amira","salma","rania","sirine","sarine","nesrine","assia","djamila","farida","karima",
    "nadia","samira","yousra","imane","imène","sana","chaima","malak","soumaya","zahra","zineb","latifa",
    "khadija","hajar","hiba","nawel","nawal","leila","leyla","aicha","aycha","dounia","kenza","inaya","maïssa",
    "maissa","lamia","warda","yousra","asma","ryhana","rihanna","sabrina","selma","chirine","wissem","ilef",
    "manel","cylia","celia","kahina","thiziri","nesma","maha","rym","lyna","romaissa","israa","hind","douaa"
  ]),
  "Hébraïque/biblique": set([
    "sarah","sara","rachel","rebecca","rebecka","lea","leah","noa","noemie","naomi","hanna","hannah","esther",
    "judith","ruth","dina","dinah","tamar","yael","yaelle","eden","shana","shayna","liora","shirel","shirelle",
    "myriam","talia","dalia","batia","abigail","elie","hava","eve","chana","sivan","hadassa","noya","maayan"
  ]),
  "Slave/Europe de l'Est": set([
    "anastasia","anastasija","svetlana","natacha","natasha","milena","olga","ludmila","ivana","jelena","yelena",
    "katia","vera","vesna","zlata","bojana","dragana","magdalena","karolina","katarzyna","agnieszka","wioletta",
    "dominika","weronika","kinga","lenka","zuzana","bogdana","snezana","tatiana","tatjana","oksana","irina",
    "galina","larisa","yana","nadja","danica","jovana","mirjana","radka","alina","milana","darya","dasha"
  ]),
  "Nordique": set([
    "ingrid","astrid","freya","freja","solveig","sigrid","liv","signe","thyra","frida","hedda","saga","runa",
    "tuva","tove","ragnhild","gudrun","hilde","sunniva","siv","embla","alva","linnea","ylva","maja","annika",
    "elin","kajsa","nanna","dagny","birgit","greta","hedvig","thora","aslaug","eira"
  ]),
  "Asiatique": set([
    "mei","meiling","ling","yuki","sakura","hina","mai","lan","linh","anh","thao","thi","kim","yun","min",
    "hye","jimin","sora","aiko","aki","yuna","nana","hana","rin","sana","momo","mio","chihiro","xiu","fang",
    "lien","huong","trang","ngoc","suki","hoshi","emi","kaori","yoko","haru","reina","an","mai","kanha","sokha"
  ]),
  "Anglo-saxonne": set([
    "jennifer","kimberly","cindy","chelsea","kelly","shirley","ashley","brittany","tiffany","megan","amber",
    "crystal","britney","kayla","madison","kaylee","everly","jessica","scarlett","ruby","lily","ellie","grace",
    "chloe","kylie","brooklyn","harper","riley","kayleigh","paisley","peyton","addison","aubrey","kimberley",
    "sherry","mandy","wendy","tracy","stacy","kimberlee","daisy","hailey","bailey","maddison","kimberly"
  ]),
  "Africaine": set([
    "fatou","aminata","awa","mariama","kadiatou","bineta","coumba","adjoa","ama","abena","chidinma","ngozi",
    "zola","amara","aissatou","aissa","astou","dieynaba","khady","ramatoulaye","oumou","binta","fanta","penda",
    "sokhna","adama","assiatou","nafissatou","rokhaya","yacine","seynabou","maimouna","fatoumata","kadidja",
    "chimamanda","folake","temitope","adaeze","ifeoma","thandiwe","zuri","nia","imani","ayana","chinwe"
  ]),
  "Latine": set([
    "giulia","chiara","francesca","alessia","bianca","lucia","valentina","isabella","sofia","carla","paola",
    "gabriella","aurora","ludovica","beatrice","alba","rosa","carmen","pilar","catalina","mariana","joana",
    "matilde","martina","greta","noemi","elena","serena","viola","emma","giada","aurelia","paloma","lucrezia",
    "camila","daniela","gabriela","valeria","ines","inès","alessandra","federica","angela","rosalia","carlota",
    "leonor","matilda","allegra","fiorella","antonella","graziella","concetta","assunta"
  ]),
  "Française": set([
    "camille","chloé","manon","léna","lena","océane","oceane","margaux","léonie","leonie","capucine","lou",
    "jeanne","louise","alice","margot","apolline","garance","colombe","sidonie","philippine","albane","maëlys",
    "maelys","maëlle","maelle","noémie","clémence","clemence","agathe","juliette","adèle","adele","églantine",
    "eglantine","solène","solene","ombeline","gwenaëlle","gwenaelle","armelle","maïwenn","maiwenn","fleur",
    "violette","romane","ninon","anouk","lise","zélie","zelie","victoire","blanche","hortense","mahaut"
  ]),
};

// --- Motifs de terminaisons/racines (fallback avant "Française") ---
const PATTERNS = [
  ["Slave/Europe de l'Est", /(ova|eva|ska|slava| enka)$/],
  ["Slave/Europe de l'Est", /(ska|cka)$/],
  ["Nordique", /(hild|gunn|veig|borg|frid)$/],
  ["Asiatique", /(ko|mi|ka)$/],   // faible : après les listes
  ["Arabe/Maghreb", /^(abd|oum|ould|bou)/],
];

export function classifyOrigine(prenom) {
  const n = norm(prenom);
  if (n.length < 2) return "Autre";
  // 1) Listes curées (priorité), ordre du plus distinctif au moins
  for (const origine of [
    "Arabe/Maghreb", "Hébraïque/biblique", "Slave/Europe de l'Est", "Nordique",
    "Asiatique", "Africaine", "Anglo-saxonne", "Latine", "Française",
  ]) {
    if (NAMES[origine].has(n)) return origine;
  }
  // 2) Motifs
  for (const [origine, re] of PATTERNS) {
    if (re.test(n)) return origine;
  }
  // 3) Défaut : prénom enregistré en France sans marqueur distinctif -> Française
  return "Française";
}

// --- Runner ---
function main() {
  const path = "data/prenoms.json";
  const list = JSON.parse(readFileSync(path, "utf8"));
  const dist = {};
  for (const p of list) {
    p.origine = classifyOrigine(p.prenom);
    dist[p.origine] = (dist[p.origine] || 0) + 1;
  }
  writeFileSync(path, JSON.stringify(list));
  console.log(`Classé ${list.length} prénoms. Répartition :`);
  for (const [o, n] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${o.padEnd(24)} ${n}`);
  }
}

// Exécute seulement si lancé directement (pas à l'import des tests).
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("classify-origins.mjs")) {
  main();
}
