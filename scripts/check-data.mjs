// Sanity checks on src/data/yachts.json before a build. Fails loudly on data
// that would produce a broken or misleading page.

import { readFile } from "node:fs/promises";

const data = JSON.parse(await readFile(new URL("../src/data/yachts.json", import.meta.url), "utf8"));
const destinations = JSON.parse(await readFile(new URL("../src/data/destinations.json", import.meta.url), "utf8")).map((d) => d.slug);
const problems = [];
const slugs = new Set();

for (const y of data.yachts) {
  const where = `${y.id} (${y.name})`;
  if (!y.name || !y.model) problems.push(`${where}: missing name or model`);
  if (slugs.has(y.slug)) problems.push(`${where}: duplicate slug ${y.slug}`);
  slugs.add(y.slug);
  if (!destinations.includes(y.base.destination)) problems.push(`${where}: unknown destination "${y.base.destination}" (add it to src/data/destinations.json)`);
  for (const w of y.weeks) {
    if (!(w.price > 0)) problems.push(`${where}: week ${w.start} has no price`);
    if (w.listPrice < w.price) problems.push(`${where}: week ${w.start} list price below price`);
    if (w.end <= w.start) problems.push(`${where}: week ${w.start} ends before it starts`);
  }
}

const sample = data.yachts.filter((y) => y.sample).length;
console.log(`${data.yachts.length} yachts (${sample} sample), generated ${data.generatedAt}`);
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("Data OK");
