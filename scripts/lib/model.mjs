// The single yacht shape every provider is mapped into. The website, the AI
// scripts and the marketing feeds read only this shape, so adding a booking
// system means writing one adapter, nothing else.

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function makeYacht(fields) {
  const yacht = {
    id: `${fields.source}-${fields.sourceId}`,
    slug: fields.slug || slugify(`${fields.name}-${fields.model}-${fields.source}-${fields.sourceId}`),
    source: fields.source,
    sourceId: String(fields.sourceId),
    sample: Boolean(fields.sample),
    name: fields.name,
    model: fields.model,
    type: fields.type === "monohull" ? "monohull" : "catamaran",
    lengthFt: Number(fields.lengthFt) || null,
    year: Number(fields.year) || null,
    cabins: Number(fields.cabins) || null,
    berths: Number(fields.berths) || null,
    heads: Number(fields.heads) || null,
    base: {
      name: fields.base?.name || "",
      destination: fields.base?.destination || "",
      country: fields.base?.country || "",
    },
    operator: fields.operator || "",
    images: fields.images || [],
    equipment: fields.equipment || [],
    description: fields.description || "",
    crewed: Boolean(fields.crewed),
    weeks: (fields.weeks || [])
      .map((w) => ({
        start: w.start,
        end: w.end,
        price: Math.round(w.price),
        listPrice: Math.round(w.listPrice || w.price),
        currency: w.currency || "USD",
      }))
      .filter((w) => w.start && w.end && w.price > 0)
      .sort((a, b) => a.start.localeCompare(b.start)),
  };
  return yacht;
}

export function discountPct(week) {
  if (!week.listPrice || week.listPrice <= week.price) return 0;
  return Math.round((1 - week.price / week.listPrice) * 100);
}
