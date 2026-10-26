import yachtData from "../data/yachts.json";
import destinations from "../data/destinations.json";
import site from "../data/site.json";

export { site, destinations };

const today = new Date().toISOString().slice(0, 10);

// Only weeks that haven't started yet are ever shown.
export const yachts = yachtData.yachts.map((y) => ({
  ...y,
  weeks: y.weeks.filter((w) => w.start > today),
}));

export const generatedAt = yachtData.generatedAt;
export const hasSampleData = yachts.some((y) => y.sample);

export function destination(slug) {
  return destinations.find((d) => d.slug === slug);
}

export function discountPct(week) {
  if (!week.listPrice || week.listPrice <= week.price) return 0;
  return Math.round((1 - week.price / week.listPrice) * 100);
}

export function fromPrice(yacht) {
  return yacht.weeks.length ? Math.min(...yacht.weeks.map((w) => w.price)) : null;
}

export function bestDiscount(yacht) {
  return yacht.weeks.reduce((best, w) => Math.max(best, discountPct(w)), 0);
}

// Open weeks starting within `days`, biggest discounts first.
export function openWeeks({ days = 60, destinationSlug } = {}) {
  const until = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
  return yachts
    .filter((y) => !destinationSlug || y.base.destination === destinationSlug)
    .flatMap((y) => y.weeks.filter((w) => w.start <= until).map((w) => ({ yacht: y, week: w, discount: discountPct(w) })))
    .sort((a, b) => b.discount - a.discount || a.week.start.localeCompare(b.week.start));
}

export const money = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export function dateRange(start, end) {
  const f = (d, opts) => new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", ...opts });
  return `${f(start, { month: "short", day: "numeric" })} to ${f(end, { month: "short", day: "numeric", year: "numeric" })}`;
}

export function url(path = "/") {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}${path}`;
}
