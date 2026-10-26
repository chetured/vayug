// Booking Manager (MMK) adapter. Booking Manager's agency API is a REST API
// authenticated with a bearer key from your agency account. As with NauSYS,
// confirm the endpoints and field names marked VERIFY against the API docs
// you receive with the account, then run
// `AVAILABILITY_SOURCES=bookingmanager npm run sync && npm run check`.

import { makeYacht, slugify } from "../lib/model.mjs";

const BASE = process.env.BOOKING_MANAGER_BASE_URL || "https://www.booking-manager.com/api/v2"; // VERIFY

async function get(path, params = {}) {
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${process.env.BOOKING_MANAGER_API_KEY}`, Accept: "application/json" } });
  if (!res.ok) throw new Error(`Booking Manager ${path} failed: HTTP ${res.status}`);
  return res.json();
}

const DESTINATION_BY_COUNTRY = {
  "British Virgin Islands": "british-virgin-islands", Bahamas: "bahamas", "Saint Martin": "st-martin", "Sint Maarten": "st-martin",
  Grenada: "grenadines", "Saint Vincent and the Grenadines": "grenadines", Greece: "greece", Croatia: "croatia",
};

export async function fetchYachts({ today = new Date(), weeksAhead = 40 } = {}) {
  if (!process.env.BOOKING_MANAGER_API_KEY) throw new Error("BOOKING_MANAGER_API_KEY is not set");
  const iso = (d) => d.toISOString().slice(0, 19);
  const until = new Date(today.getTime() + weeksAhead * 7 * 86400000);

  // VERIFY: offers = free periods with prices; yachts = boat details.
  const offers = await get("/offers", { dateFrom: iso(today), dateTo: iso(until), tripDuration: 7 });
  const byYacht = new Map();
  for (const o of offers) {
    if (!byYacht.has(o.yachtId)) byYacht.set(o.yachtId, { offer: o, weeks: [] });
    byYacht.get(o.yachtId).weeks.push(o);
  }

  const yachts = [];
  for (const [yachtId, { offer, weeks }] of byYacht) {
    const y = await get(`/yacht/${yachtId}`);
    yachts.push(
      makeYacht({
        source: "bookingmanager",
        sourceId: yachtId,
        name: y.name || offer.yacht,
        model: y.model || "",
        type: /cat/i.test(y.kind || "") ? "catamaran" : "monohull",
        lengthFt: y.length ? y.length * 3.281 : null,
        year: y.year,
        cabins: y.cabins,
        berths: y.berths,
        heads: y.wc,
        base: { name: offer.startBase || y.homeBase || "", destination: DESTINATION_BY_COUNTRY[offer.country] || slugify(offer.country || ""), country: offer.country || "" },
        operator: offer.company || y.company || "",
        images: (y.images || []).map((i) => i.url).filter(Boolean),
        equipment: (y.equipment || []).map((e) => e.name).filter(Boolean),
        weeks: weeks.map((w) => ({
          start: String(w.dateFrom).slice(0, 10),
          end: String(w.dateTo).slice(0, 10),
          price: w.finalPrice ?? w.price,
          listPrice: w.startPrice ?? w.price,
          currency: w.currency || "EUR",
        })),
      })
    );
  }
  return yachts;
}
