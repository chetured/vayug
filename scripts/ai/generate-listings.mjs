// Writes a description for every yacht that doesn't have one yet and saves it
// into src/data/yachts.json. Existing descriptions are kept, so each boat is
// only written once. Use --all to rewrite every boat, --include-sample to also
// write the sample fleet.

import { readFile, writeFile } from "node:fs/promises";
import { generateJSON } from "./claude.mjs";

const FILE = new URL("../../src/data/yachts.json", import.meta.url);
const destinations = JSON.parse(await readFile(new URL("../../src/data/destinations.json", import.meta.url), "utf8"));
const data = JSON.parse(await readFile(FILE, "utf8"));
const all = process.argv.includes("--all");
const includeSample = process.argv.includes("--include-sample");
const limit = Number(process.env.LISTING_LIMIT || 50);

const todo = data.yachts.filter((y) => (all || !y.description) && (includeSample || !y.sample)).slice(0, limit);
console.log(`${todo.length} yachts need a description`);

const schema = {
  type: "object",
  properties: {
    description: { type: "string", description: "Two short paragraphs, 90 to 140 words in total, separated by a blank line." },
  },
  required: ["description"],
  additionalProperties: false,
};

for (const yacht of todo) {
  const dest = destinations.find((d) => d.slug === yacht.base.destination);
  const facts = {
    model: yacht.model,
    type: yacht.type,
    lengthFt: yacht.lengthFt && Math.round(yacht.lengthFt),
    year: yacht.year,
    cabins: yacht.cabins,
    sleeps: yacht.berths,
    bathrooms: yacht.heads,
    base: `${yacht.base.name}, ${dest?.name ?? yacht.base.country}`,
    equipment: yacht.equipment,
    destination: dest && { summary: dest.summary, bestMonths: dest.bestMonths, highlights: dest.highlights },
  };
  const prompt = `Write the description for this yacht's page on our website. The first paragraph is about the boat and who it suits (families, groups of friends, couples). The second is about a typical week sailing from its base. Don't repeat the price or the specs table, the page already shows them.

Yacht facts (JSON):
${JSON.stringify(facts, null, 2)}`;
  try {
    const { description } = await generateJSON({ prompt, schema });
    yacht.description = description.trim();
    console.log(`Wrote ${yacht.id} ${yacht.model}`);
  } catch (err) {
    console.error(`Skipped ${yacht.id}: ${err.message}`);
    process.exitCode = 1;
  }
}

await writeFile(FILE, JSON.stringify(data, null, 2) + "\n");
