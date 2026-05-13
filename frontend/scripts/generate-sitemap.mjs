#!/usr/bin/env node
/**
 * Build-time sitemap generator.
 *
 * Writes public/sitemap.xml from a static list of indexable routes plus
 * hreflang alternates for EN/EL. Run automatically before each `vite build`
 * via the `prebuild` npm script — also safe to run by hand.
 *
 * Why a script instead of vite-plugin-sitemap? Zero dependencies, full
 * control over hreflang shape, and the route list lives next to its
 * runtime counterpart in src/seo.ts so they can't drift.
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, "..", "public");

const SITE_URL = (process.env.VITE_SITE_URL ?? "https://home-seaside.gr").replace(/\/+$/, "");

/** Mirror of INDEXABLE_ROUTES in src/seo.ts. Keep in sync. */
const ROUTES = [
  { path: "/",                priority: 1.0,  changefreq: "weekly"  },
  { path: "/menu",            priority: 0.9,  changefreq: "weekly"  },
  { path: "/menu/coffee",     priority: 0.8,  changefreq: "monthly" },
  { path: "/menu/cocktails",  priority: 0.8,  changefreq: "monthly" },
  { path: "/menu/spirits",    priority: 0.8,  changefreq: "monthly" },
  { path: "/menu/food",       priority: 0.8,  changefreq: "monthly" },
  { path: "/about",           priority: 0.7,  changefreq: "yearly"  },
];

const today = new Date().toISOString().split("T")[0];

const urls = ROUTES.map(({ path, priority, changefreq }) => {
  const loc = `${SITE_URL}${path}`;
  const alternates = [
    `    <xhtml:link rel="alternate" hreflang="en" href="${loc}?lang=en" />`,
    `    <xhtml:link rel="alternate" hreflang="el" href="${loc}?lang=el" />`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}" />`,
  ].join("\n");
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    `    <lastmod>${today}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority.toFixed(1)}</priority>`,
    alternates,
    "  </url>",
  ].join("\n");
}).join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;

const outPath = resolve(PUBLIC_DIR, "sitemap.xml");
writeFileSync(outPath, xml, "utf8");
console.log(`✓ wrote sitemap.xml — ${ROUTES.length} URLs, base: ${SITE_URL}`);
