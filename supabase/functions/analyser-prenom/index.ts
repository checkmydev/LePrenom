import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { prenom, sexe } = await req.json();
    if (!prenom) return json({ error: "prenom requis" }, 400);

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { db: { schema: "leprenom" } },
    );

    // Cache
    const { data: cached } = await sb.from("analyses").select("*").eq("prenom", prenom).maybeSingle();
    if (cached) return json(cached);

    const prompt = `Tu es expert en prénoms francophones. Analyse le prénom "${prenom}" `
      + `(${sexe === "f" ? "fille" : "garçon"}) associé au nom de famille "Gerard".\n`
      + `Réponds STRICTEMENT en JSON avec les clés: signification (origine et sens, 1-2 phrases), `
      + `description (personnalité/perception, 1-2 phrases), jeux_de_mots (jeux de mots ou associations `
      + `possibles avec le prénom et/ou "Gerard", ou "aucun notable"), compat_gerard (verdict sur "PRENOM Gerard": `
      + `sonorité, initiales, fluidité — dis clairement si ça sonne bien ou si ça coince, 2-3 phrases).`;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 700,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const ai = await aiRes.json();
    const text = ai?.content?.[0]?.text ?? "{}";
    let parsed;
    try { parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? text); }
    catch { parsed = { signification: text, description: "", jeux_de_mots: "", compat_gerard: "" }; }

    const row = {
      prenom, sexe: sexe ?? null,
      signification: parsed.signification ?? "",
      description: parsed.description ?? "",
      jeux_de_mots: parsed.jeux_de_mots ?? "",
      compat_gerard: parsed.compat_gerard ?? "",
      raw: ai,
    };
    await sb.from("analyses").upsert(row, { onConflict: "prenom" });
    return json(row);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...CORS, "content-type": "application/json" },
  });
}
