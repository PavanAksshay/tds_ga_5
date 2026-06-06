#!/usr/bin/env node
/**
 * SEO Pre-flight Check Script
 * Run before every deploy to catch missing meta, schema, canonical, and noindex issues.
 *
 * Usage: node scripts/seo-preflight.mjs
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join, resolve } from "path";

const ROOT = resolve(process.cwd());
const ROUTES_DIR = join(ROOT, "app", "routes");
const PUBLIC_DIR = join(ROOT, "public");

const SITE_URL = "https://www.thedevcommunity.in";

let errors = 0;
let warnings = 0;
let passed = 0;

function check(condition, message, level = "error") {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    if (level === "error") {
      console.error(`  ❌ ${message}`);
      errors++;
    } else {
      console.warn(`  ⚠️  ${message}`);
      warnings++;
    }
  }
}

console.log("\n🔍 TDC SEO Pre-flight Check\n");

// ───────────────────────────────────────────────────────────────────────────
// 1. Public files
// ───────────────────────────────────────────────────────────────────────────
console.log("📁 Public Files:");
check(existsSync(join(PUBLIC_DIR, "robots.txt")), "robots.txt exists");
check(existsSync(join(PUBLIC_DIR, "manifest.json")), "manifest.json exists");
check(existsSync(join(PUBLIC_DIR, "sw.js")), "sw.js (service worker) exists");
check(existsSync(join(PUBLIC_DIR, "og-image.png")), "og-image.png exists");

const robotsContent = readFileSync(join(PUBLIC_DIR, "robots.txt"), "utf-8");
check(robotsContent.includes(SITE_URL), `robots.txt uses correct domain (${SITE_URL})`);
check(robotsContent.includes("Sitemap:"), "robots.txt includes Sitemap directive");
check(robotsContent.includes("Disallow: /admin"), "robots.txt disallows /admin");
check(robotsContent.includes("Disallow: /login"), "robots.txt disallows /login");

// ───────────────────────────────────────────────────────────────────────────
// 2. Route file audit
// ───────────────────────────────────────────────────────────────────────────
const PUBLIC_ROUTES = ["home.tsx", "about.tsx", "projects.tsx", "careers.tsx", "contact.tsx", "updates.tsx", "terms.tsx", "privacy.tsx"];
const NOINDEX_ROUTES = ["login.tsx", "register.tsx", "profile.tsx", "onboarding.tsx", "applications.tsx", "apply-action.tsx", "career-apply-action.tsx", "forgot-password.tsx", "reset-password.tsx", "logout.tsx", "auth.callback.tsx", "ideas-submit.tsx"];
const DYNAMIC_ROUTES = ["project-detail.tsx", "career-detail.tsx"];

console.log("\n📄 Public Routes — must have meta export:");
for (const file of PUBLIC_ROUTES) {
  const path = join(ROUTES_DIR, file);
  if (!existsSync(path)) { console.warn(`  ⚠️  ${file} not found`); warnings++; continue; }
  const content = readFileSync(path, "utf-8");
  const hasMeta = content.includes("export function meta");
  const hasOG = content.includes("og:title") || content.includes("buildMeta");
  const hasCanonical = content.includes("canonical") || content.includes("buildMeta");
  const hasDescription = content.includes("description");
  const hasDazlUrl = content.includes("the-developer-community-4730.dazl.live");

  console.log(`\n  ${file}:`);
  check(hasMeta, "has meta export");
  check(hasOG, "has OG tags");
  check(hasCanonical, "has canonical");
  check(hasDescription, "has description");
  check(!hasDazlUrl, "no hardcoded dazl.live URL (using seo lib)", hasDazlUrl ? "error" : "pass");
}

console.log("\n🔒 Private Routes — must have noindex:");
for (const file of NOINDEX_ROUTES) {
  const path = join(ROUTES_DIR, file);
  if (!existsSync(path)) { console.warn(`  ⚠️  ${file} not found`); warnings++; continue; }
  const content = readFileSync(path, "utf-8");
  const hasNoIndex = content.includes("noindex");
  const hasDazlUrl = content.includes("the-developer-community-4730.dazl.live");
  console.log(`\n  ${file}:`);
  check(hasNoIndex, "has noindex robots meta");
  check(!hasDazlUrl, "no hardcoded dazl.live URL");
}

console.log("\n📊 Dynamic Routes — must have schema:");
for (const file of DYNAMIC_ROUTES) {
  const path = join(ROUTES_DIR, file);
  if (!existsSync(path)) { console.warn(`  ⚠️  ${file} not found`); warnings++; continue; }
  const content = readFileSync(path, "utf-8");
  const hasSchema = content.includes("application/ld+json");
  const hasDazlUrl = content.includes("the-developer-community-4730.dazl.live");
  console.log(`\n  ${file}:`);
  check(hasSchema, "has JSON-LD schema");
  check(!hasDazlUrl, "no hardcoded dazl.live URL");
}

// ───────────────────────────────────────────────────────────────────────────
// 3. Admin routes — must have noindex
// ───────────────────────────────────────────────────────────────────────────
console.log("\n🛡️  Admin Layout — must have noindex:");
const adminLayout = readFileSync(join(ROUTES_DIR, "admin", "layout.tsx"), "utf-8");
check(adminLayout.includes("noindex"), "admin layout has noindex meta");

// ───────────────────────────────────────────────────────────────────────────
// 4. SEO Library
// ───────────────────────────────────────────────────────────────────────────
console.log("\n🔧 SEO Library:");
check(existsSync(join(ROOT, "app", "lib", "seo.ts")), "app/lib/seo.ts exists");
const seoLib = readFileSync(join(ROOT, "app", "lib", "seo.ts"), "utf-8");
check(seoLib.includes("www.thedevcommunity.in"), "seo.ts has correct domain");
check(seoLib.includes("buildMeta"), "seo.ts exports buildMeta");
check(seoLib.includes("buildFAQSchema"), "seo.ts exports buildFAQSchema");
check(seoLib.includes("buildOrganizationSchema"), "seo.ts exports buildOrganizationSchema");

// ───────────────────────────────────────────────────────────────────────────
// 5. Root.tsx checks
// ───────────────────────────────────────────────────────────────────────────
console.log("\n🏠 Root.tsx:");
const rootContent = readFileSync(join(ROOT, "app", "root.tsx"), "utf-8");
check(rootContent.includes("manifest.json"), "root.tsx links manifest.json");
check(rootContent.includes("sw.js"), "root.tsx registers service worker");
check(rootContent.includes("skipLink"), "root.tsx has skip navigation link");
check(rootContent.includes("google-site-verification") || rootContent.includes("GSC_CODE"), "root.tsx has GSC verification");
check(rootContent.includes("googletagmanager"), "root.tsx has GA4");
check(!rootContent.includes("the-developer-community-4730.dazl.live"), "root.tsx has no hardcoded dazl.live domain");

// ───────────────────────────────────────────────────────────────────────────
// Summary
// ───────────────────────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(50));
console.log(`\n📊 Results: ${passed} passed | ${warnings} warnings | ${errors} errors\n`);

if (errors > 0) {
  console.error(`🚨 ${errors} critical SEO issue(s) found. Fix before deploying!\n`);
  process.exit(1);
} else if (warnings > 0) {
  console.warn(`⚠️  ${warnings} warning(s). Review before deploying.\n`);
} else {
  console.log("🎉 All SEO checks passed! Ready to deploy.\n");
}
