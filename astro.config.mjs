import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// SITE_URL lets the GitHub Pages preview (https://<user>.github.io/<repo>)
// and the real domain (https://vayug.com) share one build.
const site = process.env.SITE_URL || "https://vayug.com";
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  site,
  base,
  trailingSlash: "ignore",
  integrations: [sitemap()],
});
