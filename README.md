# Vayu Sailing Co. website (vayug.com)

The website and sales automation for Vayu Sailing Co., a yacht charter agency selling open charter weeks worldwide.

**Start here:** [docs/LAUNCH-CHECKLIST.md](docs/LAUNCH-CHECKLIST.md) lists every account to sign up for, in order, and exactly where each key goes.

## What it does

1. **Pulls live availability** from charter booking systems (NauSYS, Booking Manager) every morning into one list of boats and open weeks (`src/data/yachts.json`).
2. **Writes a description for each new boat** with Claude, in the brand voice, using only the facts from the feed.
3. **Builds and publishes the website** to GitHub Pages: open-week deals, yacht search, a page per yacht and per destination, enquiry forms, and SEO tags so each page can rank in Google.
4. **Drafts marketing every Monday** with Claude: an "open weeks" email and a week of social posts in English, Hindi and Telugu, saved to `marketing/` for review.

Until the booking-system accounts are approved, the site runs on a clearly labelled **sample fleet**: every sample boat says "Sample", a banner says the prices aren't real offers, and sample pages are hidden from Google.

## Pages

| Page | Path |
| --- | --- |
| Home with search and best deals | `/` |
| Open weeks (last-minute deals, filterable) | `/open-weeks/` |
| Yacht search | `/yachts/` |
| Yacht page with open weeks and enquiry form | `/yachts/<boat>/` |
| Destinations and one page per destination | `/destinations/`, `/destinations/<place>/` |
| About, How booking works, Contact | `/about/`, `/how-it-works/`, `/contact/` |
| Booking terms, Privacy (drafts for attorney review) | `/terms/`, `/privacy/` |

## Run it on your computer

Needs Node.js 20 or newer.

```bash
npm install
npm run sync      # refresh availability (sample data by default)
npm run dev       # open http://localhost:4321
```

Other commands:

| Command | What it does |
| --- | --- |
| `npm run build` | Build the site into `dist/` |
| `npm run check` | Check the yacht data for problems |
| `npm run ai:listings` | Write descriptions for boats that don't have one (needs `ANTHROPIC_API_KEY`) |
| `npm run ai:newsletter` | Draft this week's open-weeks email into `marketing/newsletter/` |
| `npm run ai:social` | Draft a week of social posts into `marketing/social/` (CSV imports into Buffer or Later) |

## How it fits together

```
NauSYS ──┐
Booking  ├─> scripts/sync-availability.mjs ─> src/data/yachts.json ─┬─> Astro site ─> GitHub Pages (vayug.com)
Manager ─┘        (scripts/providers/*)                             ├─> Claude: yacht descriptions
                                                                    └─> Claude: weekly email + social posts
Enquiry form ─> Formspree (or email) ─> your inbox / CRM
```

- `scripts/providers/` has one adapter per booking system. Each maps its feed into the shared shape in `scripts/lib/model.mjs`. NauSYS and Booking Manager endpoints are marked `VERIFY`: confirm them against the API documents you receive with each agency account.
- `src/data/site.json` holds the business name, email, phone, WhatsApp and social links. Edit it and the whole site updates.
- `src/data/destinations.json` holds the destination pages' content and SEO keywords.
- `.github/workflows/deploy.yml` runs sync, descriptions, checks, build and deploy daily and on every push.
- `.github/workflows/marketing.yml` drafts the weekly email and social posts.

## Editing content

- Business details: `src/data/site.json`
- Destination text: `src/data/destinations.json`
- Page wording: `src/pages/*.astro`
- Colours and fonts: `src/styles/global.css`
