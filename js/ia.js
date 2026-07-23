import { SUPABASE_URL, SUPABASE_ANON } from "./config.js";

const FN = `${SUPABASE_URL}/functions/v1/analyser-prenom`;

export async function analyserPrenom(prenom, sexe, nom = "Gerard", famille = "gerard") {
  const res = await fetch(FN, {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${SUPABASE_ANON}` },
    body: JSON.stringify({ prenom, sexe, nom, famille }),
  });
  if (!res.ok) throw new Error("IA indisponible");
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}
