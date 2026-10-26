// NauSYS adapter (Horizon Yacht Charters BVI books only through NauSYS).
//
// NauSYS gives approved agencies a JSON web service. The exact endpoint
// versions and field names come with your agency credentials, so every
// NauSYS-specific detail is kept in this file and marked VERIFY. When the
// account is approved: confirm the URLs below against the NauSYS agency API
// documentation, run `AVAILABILITY_SOURCES=nausys npm run sync`, and adjust
// the field mapping in `toYacht` until `npm run check` passes.

import { makeYacht, slugify } from "../lib/model.mjs";

const BASE = process.env.NAUSYS_BASE_URL || "https://ws.nausys.com/CBMS-external/rest"; // VERIFY

async function call(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      credentials: { username: process.env.NAUSYS_USERNAME, password: process.env.NAUSYS_PASSWORD },
      ...body,
    }),
  });
  if (!res.ok) throw new Error(`NauSYS ${path} failed: HTTP ${res.status}`);
  const data = await res.json();
  if (data.status && data.status !== "OK") throw new Error(`NauSYS ${path}: ${data.status} ${data.errorCode || ""}`);
  return data;
}

const DESTINATION_BY_COUNTRY = {
  VG: "british-virgin-islands", BS: "bahamas", MF: "st-martin", SX: "st-martin",
  GD: "grenadines", VC: "grenadines", GR: "greece", HR: "croatia",
};

function toYacht(y, freeWeeks, lookups) {
  const base = lookups.bases.get(y.homeBaseId) || {};
  return makeYacht({
    source: "nausys",
    sourceId: y.id,
    name: y.name,
    model: lookups.models.get(y.yachtModelId) || "",
    type: /cat/i.test(lookups.categories.get(y.yachtCategoryId) || "") ? "catamaran" : "monohull",
    lengthFt: y.loa ? y.loa * 3.281 : null,
    year: y.buildYear,
    cabins: y.cabins,
    berths: y.berthsTotal,
    heads: y.wc,
    base: { name: base.name || "", destination: DESTINATION_BY_COUNTRY[base.countryCode] || slugify(base.country || ""), country: base.country || "" },
    operator: lookups.companies.get(y.charterCompanyId) || "",
    images: (y.pictures || []).map((p) => p.url || p).filter(Boolean),
    equipment: (y.standardEquipment || []).map((e) => e.name).filter(Boolean),
    weeks: freeWeeks.map((w) => ({
      start: String(w.periodFrom).slice(0, 10),
      end: String(w.periodTo).slice(0, 10),
      price: w.price?.clientPrice ?? w.clientPrice,
      listPrice: w.price?.priceListPrice ?? w.priceListPrice,
      currency: w.price?.currency || "EUR",
    })),
  });
}

export async function fetchYachts({ today = new Date(), weeksAhead = 40 } = {}) {
  if (!process.env.NAUSYS_USERNAME) throw new Error("NAUSYS_USERNAME is not set");

  // VERIFY: catalogue endpoints for companies, bases, models and yachts.
  const [companies, bases, models, categories] = await Promise.all([
    call("/catalogue/v6/charterCompanies", {}),
    call("/catalogue/v6/charterBases", {}),
    call("/catalogue/v6/yachtModels", {}),
    call("/catalogue/v6/yachtCategories", {}),
  ]);
  const lookups = {
    companies: new Map((companies.companies || []).map((c) => [c.id, c.name])),
    bases: new Map((bases.bases || []).map((b) => [b.id, { name: b.name || b.location, country: b.country, countryCode: b.countryCode }])),
    models: new Map((models.models || []).map((m) => [m.id, m.name])),
    categories: new Map((categories.categories || []).map((c) => [c.id, c.name])),
  };

  const yachts = [];
  for (const company of companies.companies || []) {
    const list = await call(`/catalogue/v6/yachts/${company.id}`, {});
    for (const y of list.yachts || []) yachts.push(y);
  }

  // VERIFY: free-yacht search, one request per week window.
  const free = new Map();
  const start = new Date(today);
  for (let i = 0; i < weeksAhead; i++) {
    const from = new Date(start.getTime() + i * 7 * 86400000);
    const to = new Date(from.getTime() + 7 * 86400000);
    const fmt = (d) => d.toISOString().slice(0, 10).split("-").reverse().join(".");
    const res = await call("/yachtReservation/v6/freeYachtsSearch", { periodFrom: fmt(from), periodTo: fmt(to), yachts: yachts.map((y) => y.id) });
    for (const w of res.freeYachts || []) {
      if (!free.has(w.yachtId)) free.set(w.yachtId, []);
      free.get(w.yachtId).push(w);
    }
  }

  return yachts.filter((y) => free.has(y.id)).map((y) => toYacht(y, free.get(y.id), lookups));
}
