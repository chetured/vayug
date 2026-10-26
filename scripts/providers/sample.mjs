// Sample fleet used until real booking-system accounts are connected.
// Every yacht is flagged `sample: true`, and the website shows a banner while
// any sample yacht is live, so nothing here can be mistaken for a real offer.

import { makeYacht } from "../lib/model.mjs";

const FLEET = [
  { id: "1", name: "Sample: Trade Breeze", model: "Lagoon 46", type: "catamaran", lengthFt: 46, year: 2024, cabins: 4, berths: 10, heads: 4, base: { name: "Tortola", destination: "british-virgin-islands", country: "BVI" }, weekly: 11500 },
  { id: "2", name: "Sample: Island Hop", model: "Bali 4.6", type: "catamaran", lengthFt: 46, year: 2023, cabins: 4, berths: 10, heads: 4, base: { name: "Tortola", destination: "british-virgin-islands", country: "BVI" }, weekly: 10200 },
  { id: "3", name: "Sample: Coral Run", model: "Leopard 45", type: "catamaran", lengthFt: 45, year: 2022, cabins: 4, berths: 10, heads: 4, base: { name: "Tortola", destination: "british-virgin-islands", country: "BVI" }, weekly: 9400 },
  { id: "4", name: "Sample: Blue Lagoon", model: "Lagoon 50", type: "catamaran", lengthFt: 50, year: 2023, cabins: 6, berths: 12, heads: 6, base: { name: "Nassau", destination: "bahamas", country: "Bahamas" }, weekly: 15800 },
  { id: "5", name: "Sample: Salt Kiss", model: "Fountaine Pajot Elba 45", type: "catamaran", lengthFt: 45, year: 2024, cabins: 4, berths: 10, heads: 4, base: { name: "Marigot", destination: "st-martin", country: "St. Martin" }, weekly: 10900 },
  { id: "6", name: "Sample: Spice Wind", model: "Lagoon 42", type: "catamaran", lengthFt: 42, year: 2021, cabins: 4, berths: 10, heads: 2, base: { name: "St. George's", destination: "grenadines", country: "Grenada" }, weekly: 7200 },
  { id: "7", name: "Sample: Aegean Light", model: "Bali 4.4", type: "catamaran", lengthFt: 44, year: 2023, cabins: 4, berths: 10, heads: 4, base: { name: "Lefkada", destination: "greece", country: "Greece" }, weekly: 7900 },
  { id: "8", name: "Sample: Olive Grove", model: "Beneteau Oceanis 46.1", type: "monohull", lengthFt: 46, year: 2022, cabins: 4, berths: 10, heads: 3, base: { name: "Athens (Alimos)", destination: "greece", country: "Greece" }, weekly: 5200 },
  { id: "9", name: "Sample: Adriatic Star", model: "Lagoon 46", type: "catamaran", lengthFt: 46, year: 2024, cabins: 4, berths: 12, heads: 4, base: { name: "Split", destination: "croatia", country: "Croatia" }, weekly: 9800 },
  { id: "10", name: "Sample: Pine Bay", model: "Jeanneau Sun Odyssey 440", type: "monohull", lengthFt: 44, year: 2021, cabins: 4, berths: 10, heads: 2, base: { name: "Split", destination: "croatia", country: "Croatia" }, weekly: 4300 }
];

const EQUIPMENT = {
  catamaran: ["Air conditioning", "Generator", "Watermaker", "Dinghy with outboard", "Snorkel gear", "Solar panels", "Bluetooth audio"],
  monohull: ["Bimini and sprayhood", "Dinghy with outboard", "Electric windlass", "Chart plotter", "Snorkel gear", "Bluetooth audio"],
};

// Deterministic pseudo-random numbers so a rebuild on the same day gives the
// same sample weeks.
function seeded(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

function nextSaturday(from) {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + ((6 - d.getUTCDay() + 7) % 7 || 7));
  return d;
}

const iso = (d) => d.toISOString().slice(0, 10);

function seasonFactor(destination, month) {
  const caribbean = ["british-virgin-islands", "bahamas", "st-martin", "grenadines"].includes(destination);
  if (caribbean) {
    if ([11, 0, 1, 2, 3].includes(month)) return 1.25; // Dec to Apr
    if ([7, 8, 9].includes(month)) return 0.7; // Aug to Oct
    return 0.9;
  }
  if ([6, 7].includes(month)) return 1.35; // Jul, Aug
  if ([4, 5, 8].includes(month)) return 1.0; // May, Jun, Sep
  if ([3, 9].includes(month)) return 0.75;
  return 0; // Med boats are not chartered in winter
}

export async function fetchYachts({ today = new Date(), weeksAhead = 40 } = {}) {
  const daySeed = Number(iso(today).replaceAll("-", ""));
  return FLEET.map((boat) => {
    const rand = seeded(daySeed + Number(boat.id) * 7919);
    const weeks = [];
    let start = nextSaturday(today);
    for (let i = 0; i < weeksAhead; i++) {
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 7);
      const factor = seasonFactor(boat.base.destination, start.getUTCMonth());
      // About 40% of weeks are still open; closer weeks get bigger discounts.
      if (factor > 0 && rand() < 0.4) {
        const listPrice = Math.round((boat.weekly * factor) / 50) * 50;
        const daysOut = (start - today) / 86400000;
        const discount = daysOut < 30 ? 0.2 + rand() * 0.15 : daysOut < 75 ? 0.1 + rand() * 0.1 : rand() < 0.3 ? 0.05 : 0;
        weeks.push({ start: iso(start), end: iso(end), listPrice, price: Math.round((listPrice * (1 - discount)) / 10) * 10 });
      }
      start = end;
    }
    return makeYacht({
      ...boat,
      source: "sample",
      sourceId: boat.id,
      sample: true,
      operator: "Sample fleet (not a real offer)",
      equipment: EQUIPMENT[boat.type],
      weeks,
    });
  });
}
