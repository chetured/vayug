// Builds this week's "open weeks" email from live availability and saves it
// to marketing/newsletter/<date>.html (ready to paste or import into Brevo,
// Mailchimp or Klaviyo) and <date>.json (subject, preview text, body).

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { generateJSON, site } from "./claude.mjs";

const data = JSON.parse(await readFile(new URL("../../src/data/yachts.json", import.meta.url), "utf8"));
const destinations = JSON.parse(await readFile(new URL("../../src/data/destinations.json", import.meta.url), "utf8"));
const siteUrl = (process.env.SITE_URL || `https://${site.domain}`) + (process.env.BASE_PATH || "").replace(/\/$/, "");

const today = new Date().toISOString().slice(0, 10);
const until = new Date(Date.now() + 75 * 86400000).toISOString().slice(0, 10);
const deals = data.yachts
  .flatMap((y) => y.weeks.filter((w) => w.start > today && w.start <= until).map((w) => ({ y, w, off: Math.round((1 - w.price / w.listPrice) * 100) })))
  .sort((a, b) => b.off - a.off)
  .slice(0, 8)
  .map(({ y, w, off }) => ({
    boat: `${y.model} (${y.cabins} cabins, sleeps ${y.berths})`,
    where: `${y.base.name}, ${destinations.find((d) => d.slug === y.base.destination)?.name ?? y.base.country}`,
    dates: `${w.start} to ${w.end}`,
    priceUSD: w.price,
    listPriceUSD: w.listPrice,
    discountPct: off,
    link: `${siteUrl}/yachts/${y.slug}/`,
    sample: y.sample,
  }));

if (!deals.length) {
  console.log("No open weeks in the next 75 days; no newsletter this week.");
  process.exit(0);
}

const schema = {
  type: "object",
  properties: {
    subject: { type: "string", description: "Under 60 characters." },
    previewText: { type: "string", description: "Under 100 characters." },
    intro: { type: "string", description: "Two or three sentences." },
    deals: {
      type: "array",
      items: {
        type: "object",
        properties: { headline: { type: "string" }, blurb: { type: "string", description: "One sentence." }, link: { type: "string" } },
        required: ["headline", "blurb", "link"],
        additionalProperties: false,
      },
    },
    signoff: { type: "string" },
  },
  required: ["subject", "previewText", "intro", "deals", "signoff"],
  additionalProperties: false,
};

const email = await generateJSON({
  schema,
  prompt: `Write this week's "open weeks" email to our subscribers. Pick the 4 to 6 most appealing deals below (mix of destinations where possible). Each deal's headline names the boat, place, dates and price. Keep each link exactly as given. Sign off from the ${site.name} team and invite replies.

Deals (JSON):
${JSON.stringify(deals, null, 2)}`,
});

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const sampleNote = deals.some((d) => d.sample) ? `<p style="background:#fff4d6;padding:8px;font-size:12px">TEST EMAIL: built from sample data, do not send to customers.</p>` : "";
const html = `<!doctype html><html><body style="margin:0;background:#f6efe3;font-family:Arial,sans-serif;color:#12202f">
<div style="max-width:600px;margin:0 auto;background:#fff">
<div style="background:#0e2a47;color:#fff;padding:24px"><strong style="font-size:20px">${esc(site.name)}</strong><br><span style="opacity:.8">${esc(site.tagline)}</span></div>
<div style="padding:24px">${sampleNote}
<p>${esc(email.intro)}</p>
${email.deals.map((d) => `<div style="border:1px solid #dfe5ea;border-radius:10px;padding:16px;margin:0 0 12px"><strong>${esc(d.headline)}</strong><p style="margin:6px 0 10px">${esc(d.blurb)}</p><a href="${esc(d.link)}" style="background:#ff6b4a;color:#fff;padding:8px 14px;border-radius:999px;text-decoration:none">View this week</a></div>`).join("\n")}
<p>${esc(email.signoff)}</p>
<p style="font-size:12px;color:#5b6b7b">Prices are per boat per week in USD and are confirmed in writing before booking. You're receiving this because you subscribed at ${esc(site.domain)}. <a href="{{unsubscribe_url}}">Unsubscribe</a></p>
</div></div></body></html>`;

const dir = new URL("../../marketing/newsletter/", import.meta.url);
await mkdir(dir, { recursive: true });
await writeFile(new URL(`${today}.json`, dir), JSON.stringify({ ...email, generatedAt: new Date().toISOString() }, null, 2) + "\n");
await writeFile(new URL(`${today}.html`, dir), html);
console.log(`Newsletter "${email.subject}" saved to marketing/newsletter/${today}.html`);
