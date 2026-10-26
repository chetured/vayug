// Pulls boats and open weeks from every configured booking system into
// src/data/yachts.json, which the website is built from.
//
//   AVAILABILITY_SOURCES=sample,nausys,bookingmanager npm run sync
//
// AI-written descriptions from the previous run are kept, so boats only get a
// new description when they are new (see scripts/ai/generate-listings.mjs).

import { readFile, writeFile } from "node:fs/promises";

const OUT = new URL("../src/data/yachts.json", import.meta.url);
const PROVIDERS = {
  sample: () => import("./providers/sample.mjs"),
  nausys: () => import("./providers/nausys.mjs"),
  bookingmanager: () => import("./providers/bookingmanager.mjs"),
};

// Fleets quote in EUR or USD; the site shows USD. Update this rate (or set
// FX_EUR_USD in the workflow) when it drifts.
const FX = { USD: 1, EUR: Number(process.env.FX_EUR_USD || 1.08) };

const sources = (process.env.AVAILABILITY_SOURCES || "sample").split(",").map((s) => s.trim()).filter(Boolean);

let previous = { yachts: [] };
try {
  previous = JSON.parse(await readFile(OUT, "utf8"));
} catch {}
const oldDescriptions = new Map(previous.yachts.map((y) => [y.id, y.description]));

const yachts = [];
const report = [];
for (const name of sources) {
  const load = PROVIDERS[name];
  if (!load) throw new Error(`Unknown source "${name}". Use one of: ${Object.keys(PROVIDERS).join(", ")}`);
  try {
    const { fetchYachts } = await load();
    const list = await fetchYachts({ today: new Date() });
    for (const y of list) {
      y.weeks = y.weeks.map((w) => {
        const rate = FX[w.currency];
        if (!rate) throw new Error(`No exchange rate for ${w.currency}`);
        return { ...w, price: Math.round(w.price * rate), listPrice: Math.round(w.listPrice * rate), currency: "USD" };
      });
      y.description = y.description || oldDescriptions.get(y.id) || "";
      yachts.push(y);
    }
    report.push(`${name}: ${list.length} yachts`);
  } catch (err) {
    // One broken feed must not take the whole site down: keep that source's
    // boats from the last good run instead.
    const kept = previous.yachts.filter((y) => y.source === name);
    yachts.push(...kept);
    report.push(`${name}: FAILED (${err.message}); kept ${kept.length} yachts from last run`);
    process.exitCode = 1;
  }
}

await writeFile(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), sources, yachts }, null, 2) + "\n");
console.log(report.join("\n"));
console.log(`Wrote ${yachts.length} yachts, ${yachts.reduce((n, y) => n + y.weeks.length, 0)} open weeks.`);
