// Shared Claude API helper for the content scripts. Needs ANTHROPIC_API_KEY
// (or an `ant auth login` profile) in the environment.

import Anthropic from "@anthropic-ai/sdk";
import { betaJSONSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/beta/json-schema";
import { readFile } from "node:fs/promises";

const client = new Anthropic();
const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";

export const site = JSON.parse(await readFile(new URL("../../src/data/site.json", import.meta.url), "utf8"));

// The brand voice every script shares, so listings, emails and posts sound
// like one company.
export const BRAND_VOICE = `You write marketing copy for ${site.name} (${site.domain}), a yacht charter agency.
${site.story}
The founders are two business partners from Ohio who own a charter catamaran in the British Virgin Islands; one is a licensed captain. They speak ${site.languages.join(", ")}.
Voice: calm, expert, warm, like a friend who sails. Short sentences. Concrete details over adjectives. No hype words such as "unforgettable", "luxurious paradise" or "ultimate". No emoji unless asked.
Facts: use only the facts you are given about boats, prices and dates. Never invent equipment, prices, discounts, reviews or awards. If a fact is missing, leave it out.`;

// Returns the parsed JSON object that matches `schema`.
export async function generateJSON({ prompt, schema, effort = "medium" }) {
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    // On a policy decline the API re-runs the request on a fallback model.
    fallbacks: "default",
    system: BRAND_VOICE,
    output_config: { effort, format: betaJSONSchemaOutputFormat(schema) },
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal") throw new Error("Claude declined this request");
  if (response.stop_reason === "max_tokens") throw new Error("Response was cut off (max_tokens)");
  if (!response.parsed_output) throw new Error("Claude returned no parseable output");
  return response.parsed_output;
}
