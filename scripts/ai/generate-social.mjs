// Drafts a week of social posts (Instagram, Facebook, TikTok captions and a
// WhatsApp broadcast) from live open weeks and saves them to
// marketing/social/<date>.json and .csv. The CSV imports into Buffer or
// Later for scheduling.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { generateJSON, site } from "./claude.mjs";

const data = JSON.parse(await readFile(new URL("../../src/data/yachts.json", import.meta.url), "utf8"));
const destinations = JSON.parse(await readFile(new URL("../../src/data/destinations.json", import.meta.url), "utf8"));
const siteUrl = (process.env.SITE_URL || `https://${site.domain}`) + (process.env.BASE_PATH || "").replace(/\/$/, "");
const today = new Date().toISOString().slice(0, 10);
const until = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);

const deals = data.yachts
  .flatMap((y) => y.weeks.filter((w) => w.start > today && w.start <= until).map((w) => ({
    boat: y.model, cabins: y.cabins, type: y.type,
    where: `${y.base.name}, ${destinations.find((d) => d.slug === y.base.destination)?.name}`,
    dates: `${w.start} to ${w.end}`, priceUSD: w.price, discountPct: Math.round((1 - w.price / w.listPrice) * 100),
    link: `${siteUrl}/yachts/${y.slug}/`, sample: y.sample,
  })))
  .sort((a, b) => b.discountPct - a.discountPct)
  .slice(0, 10);

const schema = {
  type: "object",
  properties: {
    posts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "string", enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
          channel: { type: "string", enum: ["instagram", "facebook", "tiktok", "whatsapp"] },
          language: { type: "string", enum: ["English", "Hindi", "Telugu"] },
          caption: { type: "string" },
          hashtags: { type: "array", items: { type: "string" } },
          imageIdea: { type: "string", description: "What photo or short video to pair with it." },
          link: { type: "string" },
        },
        required: ["day", "channel", "language", "caption", "hashtags", "imageIdea", "link"],
        additionalProperties: false,
      },
    },
  },
  required: ["posts"],
  additionalProperties: false,
};

const { posts } = await generateJSON({
  schema,
  prompt: `Plan 7 days of social posts for ${site.name}, about 10 posts in total across Instagram, Facebook, TikTok and one WhatsApp broadcast. Mix: open-week deals from the list below, one destination tip, one behind-the-scenes post about owning a charter catamaran in the BVI. Write two posts in Hindi and one in Telugu for our Indian-American audience; the rest in English. Use each deal's link exactly as given; for non-deal posts link to ${siteUrl}/.

Open weeks (JSON):
${JSON.stringify(deals, null, 2)}`,
});

const dir = new URL("../../marketing/social/", import.meta.url);
await mkdir(dir, { recursive: true });
await writeFile(new URL(`${today}.json`, dir), JSON.stringify({ generatedAt: new Date().toISOString(), sampleData: deals.some((d) => d.sample), posts }, null, 2) + "\n");
const csv = ["day,channel,language,text,link,image idea", ...posts.map((p) => [p.day, p.channel, p.language, `${p.caption}\n\n${p.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}`, p.link, p.imageIdea].map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))].join("\n");
await writeFile(new URL(`${today}.csv`, dir), csv + "\n");
console.log(`${posts.length} posts saved to marketing/social/${today}.csv`);
