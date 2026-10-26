# Launch checklist

Everything the code needs from you, in the order to do it. Each step says where the value goes. Nothing here needs code changes.

GitHub settings referred to below are in the repository under **Settings > Secrets and variables > Actions**. "Secret" means the **Secrets** tab (hidden values); "variable" means the **Variables** tab (visible values).

## 1. Domain

- [ ] Confirm you own **vayug.com**. It has been registered since January 2021, so if it isn't yours it must be bought from its owner first.
- [ ] Register **vayugsailing.com** (it was free on 26 Oct 2026) and set it to forward to `https://vayug.com`.

## 2. Turn on the website (free)

- [ ] In the repository, go to **Settings > Pages** and set **Source** to **GitHub Actions**.
- [ ] Go to **Actions > Sync and deploy site > Run workflow**. In about two minutes the preview is live at `https://chetured.github.io/<repository name>/`.
- [ ] When you are ready to use the real domain:
  - Add a variable `CUSTOM_DOMAIN` = `vayug.com`.
  - At your domain registrar, add the DNS records GitHub lists under **Settings > Pages > Custom domain** (four `A` records for `vayug.com` and a `CNAME` for `www`).
  - Back in **Settings > Pages**, enter `vayug.com` as the custom domain and tick **Enforce HTTPS** once it's offered.

## 3. Business email

- [ ] Create **hello@vayug.com** with Google Workspace or Microsoft 365 (about $6–7 per user per month). The site and emails use this address; change it in `src/data/site.json` if you pick another.
- [ ] Add your phone and WhatsApp number to `src/data/site.json` (`phone`, `whatsapp`, digits with country code, for example `+16145550100`). A WhatsApp button appears on every page once it's set.

## 4. Enquiry form

Without this step the form opens the visitor's email app instead, which works but loses some leads.

- [ ] Create a free account at **formspree.io**, add a form, and set it to email hello@vayug.com.
- [ ] Add a variable `PUBLIC_FORM_ENDPOINT` = the form URL Formspree gives you (looks like `https://formspree.io/f/abcdwxyz`).

## 5. Booking systems (the real yachts)

Apply in this order. Each asks for your company documents and a live website, so do steps 1 to 4 first.

- [ ] **NauSYS** (Horizon Yacht Charters BVI uses it exclusively). Apply as an agency at nausys.com. When approved, ask for **agency web-service (API) access** and add:
  - secrets `NAUSYS_USERNAME` and `NAUSYS_PASSWORD`
- [ ] **Booking Manager (MMK)**. Register as an agency at booking-manager.com, then request an **API key** and add:
  - secret `BOOKING_MANAGER_API_KEY`
- [ ] **Sedna**. Contact Sedna for agency and API access; send me the API documents and I'll add an adapter.
- [ ] **The Moorings and Sunsail**. Join their travel partner programme. They don't feed this site automatically; their boats are booked through their partner portal.
- [ ] Inside each system, request agency agreements with the fleets you want to sell (Horizon first).
- [ ] Switch the site to live data: set the variable `AVAILABILITY_SOURCES` = `nausys,bookingmanager`. The sample fleet and the preview banner disappear on the next run.
- [ ] The first live run may need small field-mapping fixes (marked `VERIFY` in `scripts/providers/`). Send me the error from the Actions log and I'll fix it.

## 6. AI content (Claude)

- [ ] Create an account at **platform.claude.com**, add a payment method, and create an API key.
- [ ] Add it as secret `ANTHROPIC_API_KEY`.
- From then on, new boats get descriptions automatically each morning, and every Monday the email and social drafts appear in `marketing/`. Cost is roughly a few dollars a month at this size.

## 7. Analytics and search

- [ ] Create a **Google Analytics 4** property for vayug.com and add a variable `PUBLIC_GA_ID` = the measurement ID (`G-…`). Enquiries are tracked as `generate_lead` events.
- [ ] Add vayug.com to **Google Search Console** and submit `https://vayug.com/sitemap-index.xml`.
- [ ] Create a **Google Business Profile** for Vayu Sailing Co.

## 8. Email marketing and social

- [ ] Email: create a **Brevo** or **Mailchimp** account, verify vayug.com as the sending domain, and import each Monday's `marketing/newsletter/<date>.html` as a campaign.
- [ ] Social: claim **@vayugsailing** (or similar) on Instagram, Facebook, TikTok and YouTube and add the links to `src/data/site.json` under `social`.
- [ ] Scheduling: create a **Buffer** or **Later** account and import each Monday's `marketing/social/<date>.csv`.
- [ ] Ads (when you're ready to spend): **Google Ads** for searches like "BVI catamaran charter", and **Meta** ads to Instagram and Facebook.

## 9. Payments and legal

- [ ] **Stripe** account for card deposits (once you collect payments yourselves; at first, clients usually pay the charter company directly).
- [ ] Have your attorney review `/terms/` and `/privacy/` (`src/pages/terms.astro`, `src/pages/privacy.astro`) and remove the "Draft" notes.
- [ ] Professional liability (E&O) insurance for the agency before the first booking.

## Cost summary (approximate, per month)

| Item | Cost |
| --- | --- |
| GitHub Pages hosting, Formspree free tier, Search Console | $0 |
| Domains | about $2 |
| Business email | $6–14 |
| Claude API for content | a few dollars |
| Booking-system API fees | $0–350, depends on each system |
| Email marketing | $0 to start, free tiers cover small lists |
