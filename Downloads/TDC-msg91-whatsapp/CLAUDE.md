# CLAUDE.md

> Authoritative reference for Claude Code when working in this repository. Read fully before making any changes.

**CRITICAL RULE: ALWAYS PUSH TO GITHUB AFTER EVERY EDIT.**

---

## Project Overview

A **React Router 7 (SSR, `ssr: true`)** application built with the **Dazl** framework. Developer program site with authentication, project management, and a full admin dashboard. Backend is **Supabase** (Auth + Database).

---

## Commands

```bash
npm run dev        # Start dev server with HMR
npm run build      # Production build
npm run start      # Run production server (react-router-serve)
npm run typecheck  # Type-check (react-router typegen + tsc)
```

No test runner is configured.

---

## Workflow

- **Always push to GitHub**: After completing any meaningful task or set of changes, you MUST run `git add .`, `git commit -m "..."`, and `git push`. This ensures the remote repository is always in sync with the latest work.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 |
| Language | TypeScript |
| Routing | React Router v7 — SSR, framework mode **only** |
| Styling | CSS Modules + CSS custom properties (NO Tailwind) |
| Form Handling | React Hook Form |
| UI Primitives | Radix UI |
| Icons | lucide-react |
| Database / Auth | Supabase (`@supabase/supabase-js`) |
| Build Tool | Vite |
| Package Manager | npm / Node.js |

---

## Directory Structure

```
app/
  blocks/           # Reusable UI blocks grouped by page context
  │                 #   (home/*, projects/*, admin/*, __global/*)
  components/       # Shared, generic React components
  │   └── component-name/
  │       ├── component-name.tsx
  │       └── component-name.module.css
  data/             # Static fixture data — no business logic
  dev/              # Dev-time utilities only
  hooks/            # Client-side React hooks (one hook per file)
  lib/              # Low-level libraries
  │   ├── supabase.server.ts   # Supabase server client — NEVER import in client
  │   └── database.types.ts    # Generated DB types
  routes/           # Route modules (one file per route)
  services/         # Server-only business logic (*.server.ts)
  styles/           # Site-wide CSS
  │   ├── theme.css     # Design tokens — single source of truth
  │   ├── global.css    # Global defaults (never duplicate reset.css)
  │   └── reset.css     # CSS reset — READ before editing global.css
  types/            # Shared TypeScript types
  root.tsx          # App root — font links, NavigationHeader, SystemStatusFooter
  routes.ts         # Route config — edit LAST, after all other changes
```

---

## Code Patterns & Practices

- **One class or component per file.** No exceptions.
- **kebab-case** for all file and folder names.
- **TypeScript** everywhere. Avoid `any`; comment it if unavoidable.
- Every custom React component **must** have a co-located `.module.css` file, even if initially empty.
- Hooks live in `app/hooks/`. Never define reusable hooks inside component files.
- Use React Hook Form for all form state.
- Use Radix UI primitives for accessible interactive elements (dialogs, dropdowns, tooltips, etc.).
- Before importing any `lucide-react` icon, verify it is a named export. Fall back to `Square` if it isn't.

### New Component Checklist

```
app/components/my-widget/
├── my-widget.tsx          ✅ Component logic
└── my-widget.module.css   ✅ Always create — even if empty at first
```

---

## Routing

All routes are defined programmatically in `app/routes.ts` using `index`, `route`, `layout`, and `prefix` helpers.

### Current Route Map

- **Public / Auth**: `/` (home), `/login`, `/register`, `/logout`, `/onboarding`, `/profile`, `/projects`, `/projects/:id`, `/apply-action`
- **Admin** (`/admin/*`): shared layout at `routes/admin/layout.tsx`. Every admin loader must call `requireAdmin` from `services/admin.server.ts`.

### Root Layout

`root.tsx` wraps everything with `<NavigationHeader>` and `<SystemStatusFooter>` **except** admin pages, which render raw `{children}` via their own layout.

### Route Module Pattern

```tsx
// app/routes/example.tsx
import type { Route } from "./+types/example";
import { myService } from "~/services/my-service.server";

export async function loader({ params, request }: Route.LoaderArgs) {
  return { data: await myService.getData(params.id) };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  return await myService.handleAction(formData);
}

export default function ExamplePage({ loaderData }: Route.ComponentProps) {
  return <div>{loaderData.data}</div>;
}
```

### Navigation API

| Use case | API |
|---|---|
| Standard links | `<Link to="/path" />` |
| Active-state nav links | `<NavLink to="/path" />` |
| Form submission / POST | `<Form method="post" />` |
| Programmatic (non-user) | `useNavigate()` — use sparingly |
| Inside loaders / actions | `redirect("/path")` |

### `routes.ts` Rule

Update `app/routes.ts` **only after** all route module files, components, and services are created and stable.

---

## Authentication

Session managed via a single HttpOnly cookie (`sb_session`) containing base64-encoded JSON `{ access_token, refresh_token }`. No external cookie library — raw cookie parsing only.

| File | Responsibility |
|---|---|
| `app/lib/supabase.server.ts` | Supabase server client with cookie-based session. Never import in client components. |
| `app/services/auth.server.ts` | `loginUser`, `registerUser`, `logoutUser`, `requireAuth`, `sanitizeAuthError` |
| `app/services/admin.server.ts` | `requireAdmin`, `writeAuditLog`, `getDashboardStats`, `getAllApplications`, `getAllMembers`, `updateApplicationStatus`, `adjustMemberXP`, `toggleBanMember`, `toggleAdminStatus` |

**Admin check** (in `root.tsx` loader): hardcoded founder email `amogh.vk.2005@gmail.com` **or** `profiles.is_admin === true` in DB.

---

## Database & Supabase

### Environment Variables

```
SUPABASE_PROJECT_URL   — e.g., https://your-project-id.supabase.co
SUPABASE_API_KEY       — API key for authentication
SUPABASE_ANON_KEY      — Anon key (alias)
```

### Layered Architecture (Mandatory)

```
Route Loader / Action
      ↓ calls
Service function   (app/services/*.server.ts)
      ↓ calls
Supabase client    (app/lib/supabase.server.ts)
      ↓ queries
Database
```

**Hard rules:**

1. Route loaders and actions call service functions only — never query Supabase directly.
2. UI components **never** import or call anything from `supabase.server.ts` or any `*.server.ts` file.
3. All database operations are **server-side only**.
4. Use TypeScript types from `app/lib/database.types.ts` wherever available.
5. **Always verify table names, column names, and types against the actual schema.** Never guess.

### Service Pattern Example

```ts
// app/services/user-service.server.ts
import { createSupabaseServerClient } from "~/lib/supabase.server";
import type { Database } from "~/lib/database.types";

export async function getUserById(request: Request, id: string) {
  const supabase = createSupabaseServerClient(request);
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}
```

---

## Design System

Dark-first. All tokens live in `app/styles/theme.css`. **Never hardcode colors, fonts, or spacing in component CSS.**

### Color Tokens

#### Surface (Backgrounds)

| Token | Hex | Usage |
|---|---|---|
| `--color-surface` | `#000000` | Page background — deepest layer |
| `--color-surface-elevated` | `#0d0d0d` | Slightly elevated surfaces |
| `--color-surface-container-lowest` | `#0a0a0a` | Lowest container |
| `--color-surface-container-low` | `#111111` | Low-priority container |
| `--color-surface-container` | `#1a1a1a` | Default card / panel |
| `--color-surface-container-high` | `#222222` | Higher-emphasis container |
| `--color-surface-container-highest` | `#2a2a2a` | Topmost container layer |

#### On-Surface (Text & Icons)

| Token | Hex | Usage |
|---|---|---|
| `--color-on-surface` | `#f0f0ee` | Primary text and icons |
| `--color-on-surface-muted` | `#7a7a78` | Secondary / supporting text |
| `--color-on-surface-subtle` | `#4a4a48` | Placeholder, disabled states |

#### Primary & Accent

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#f0f0ee` | Primary interactive elements, CTA labels |
| `--color-primary-on` | `#000000` | Text/icons on primary background |
| `--color-accent` | `#ffffff` | Pure white highlight accent |

#### Borders

| Token | Hex | Usage |
|---|---|---|
| `--color-border` | `#2a2a2a` | Default borders, dividers |
| `--color-border-interactive` | `#f0f0ee` | Focused / active element borders |

### Typography

| Token | Font | Usage |
|---|---|---|
| `--family-display` | Space Grotesk | Headings, hero text, large display |
| `--family-body` | Space Grotesk | Body copy, UI labels |
| `--family-mono` | JetBrains Mono | Code, technical labels, monospace data |
| `--family-pixel` | VT323 | Decorative retro/pixel accents — use sparingly |

### CSS Variable Naming Conventions

| Category | Pattern | Example |
|---|---|---|
| Color | `--color-{semantic}-{*}` | `--color-primary`, `--color-on-surface-muted` |
| Font Family | `--family-{*}` | `--family-display`, `--family-mono` |
| Spacing | `--space-{*}` | `--space-4`, `--space-8` |
| Font Size | `--text-{*}` | `--text-sm`, `--text-xl` |
| Font shorthand | `--font-{*}` | `--font-heading` |
| Border Radius | `--radius-{*}` | `--radius-md` |
| Shadow | `--shadow-{*}` / `--inner-shadow-{*}` | `--shadow-lg` |

> ✅ Semantic names only. `--color-primary` ✓ — `--color-blue` ✗

### Full `theme.css` Definition

```css
/* app/styles/theme.css */
:root {
  /* Surface */
  --color-surface:                   #000000;
  --color-surface-elevated:          #0d0d0d;
  --color-surface-container-lowest:  #0a0a0a;
  --color-surface-container-low:     #111111;
  --color-surface-container:         #1a1a1a;
  --color-surface-container-high:    #222222;
  --color-surface-container-highest: #2a2a2a;

  /* On Surface */
  --color-on-surface:        #f0f0ee;
  --color-on-surface-muted:  #7a7a78;
  --color-on-surface-subtle: #4a4a48;

  /* Primary & Accent */
  --color-primary:    #f0f0ee;
  --color-primary-on: #000000;
  --color-accent:     #ffffff;

  /* Border */
  --color-border:             #2a2a2a;
  --color-border-interactive: #f0f0ee;

  /* Typography */
  --family-display: 'Space Grotesk', sans-serif;
  --family-body:    'Space Grotesk', sans-serif;
  --family-mono:    'JetBrains Mono', monospace;
  --family-pixel:   'VT323', monospace;

  /* Spacing */
  --space-1:  4px;   --space-2:  8px;
  --space-3:  12px;  --space-4:  16px;
  --space-5:  20px;  --space-6:  24px;
  --space-8:  32px;  --space-10: 40px;
  --space-12: 48px;  --space-16: 64px;

  /* Border Radius */
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.8);
}
```

---

## Styling Rules

- Every component has a co-located `.module.css`. Import it in the component — missing import = no styles applied.
- Use `styles.className` — never inline styles or global selectors in module files.
- `reset.css` is **read-only context**. Read it before editing `global.css` to avoid duplicating rules.
- `global.css` — global defaults only. No component styles here.
- `theme.css` — tokens only. No component or layout styles here.
- Light/dark switching: **dark only by default**. Add `@dazl/color-scheme` only if explicitly requested.
- Fonts loaded via `links` export in `root.tsx`. **Never** use CSS `@import` for fonts.

### Font Loading (`root.tsx`)

```tsx
export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=JetBrains+Mono:wght@400;500;700&family=VT323&display=swap",
  },
];
```

### CSS Module Composition Example

```css
/* my-component.module.css */
.container {
  background: var(--color-surface-container);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  font-family: var(--family-body);
  color: var(--color-on-surface);
}
.container:focus-within {
  border-color: var(--color-border-interactive);
}
.label {
  color: var(--color-on-surface-muted);
  font-family: var(--family-mono);
  font-size: 0.75rem;
}
```

---

## Mobile Responsiveness & Layout Guidelines

When styling or building new pages, **all mobile layouts must strictly adhere to the "True-Native" philosophy**:

1. **Footer Pinning (Root Layouts)**: Every page container must use `display: flex; flex-direction: column; flex: 1;`. The `<main>` container must have `flex: 1` so that it expands fully. This ensures the footer dynamically pins to the immediate absolute bottom bezel.
2. **Geometric Alignment & Padding Limits**: Mobile layouts must be strictly professional and mathematically clean. Drastically reduce padding on mobile cards and form containers (e.g., override `var(--space-12)` with `var(--space-6)` or `var(--space-4)`) so content is never squished. Align filter lists symmetrically (e.g., using `grid-template-columns: 1fr 1fr`).
3. **No Show-Off Terminals**: Explicitly hide (`display: none`) decorative "show-off" text that wastes vertical space on small screens (e.g., fake server statuses like "DEPLOYED 99.9%", OS-style breadcrumbs `SYS://...`, and massive page subtitles).
4. **Navigational Control Elements (Mini-Dashboards)**: **Never** apply horizontal scrolling (`overflow-x: auto`) to navigational elements or filter tabs. Use `flex-wrap: wrap` to gracefully wrap them into a "mini-dashboard" layout, ensuring they remain fully visible simultaneously.
5. **Swipeable Carousels (Cards Only)**: For actual project cards or large data panels, convert grid rows into edge-to-edge scroll-snap carousels:
   - Root swipe container: `display: flex; flex-wrap: nowrap; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none;`
   - Apply `scroll-padding-left: var(--space-4)` with matching negative margins `margin-left: calc(-1 * var(--space-4));` to keep touches flush.
   - Child items: `flex: 0 0 85vw; min-width: 85vw; scroll-snap-align: start;`
6. **No 100vw Hacks**: Manage padding granularly at the component level. Avoid using `width: 100vw; left: 50%; transform: translateX(-50%);` as it improperly includes the scrollbar leading to cut-offs.

---

## Forbidden Technologies & Files

### Never Use

| ❌ Forbidden | Reason |
|---|---|
| Tailwind CSS | Do not use, mention, install, or reference — ever |
| CSS `@import` for fonts | Use `links` export in `root.tsx` |
| React Router v5 / v6 APIs | v7 framework mode only |
| Direct Supabase queries in route components | Use service functions |
| Any `*.server.ts` import in client components | Server-only modules |
| External cookie libraries | Raw cookie parsing only for `sb_session` |

### Read-Only (Context Only)

| File | Notes |
|---|---|
| `package.json` | Check available packages/scripts. Use install tool to add deps. |
| `reset.css` | Read before editing `global.css`. |

### Strictly Off-Limits (No Read or Write)

```
.gitignore
package-lock.json
tsconfig.json
react-router.config.ts
.github/
```

---

## Feature Development Checklist

### New Page / Route

- [ ] Create route module in `app/routes/` (kebab-case filename)
- [ ] Write loader calling a service function (never raw DB)
- [ ] Write action if form POST is needed (via service function)
- [ ] Add `ErrorBoundary` export if the route can fail
- [ ] Admin routes: call `requireAdmin` at the top of the loader
- [ ] Update `app/routes.ts` **last**

### New Component / Block

- [ ] `component-name.tsx` + `component-name.module.css` (always both)
- [ ] Import the CSS module in the component
- [ ] Use only `var(--color-*)`, `var(--family-*)`, `var(--space-*)` — no hardcoded values
- [ ] Use Radix UI for accessible interactive elements
- [ ] Verify lucide-react icons exist before importing

### New Database Operation

- [ ] Verify table name, column names, and types in schema first
- [ ] Add to the appropriate `app/services/*.server.ts` file
- [ ] Call from a loader or action only — never from a component
- [ ] Use/extend TypeScript types from `database.types.ts`

---

## Quick Reference

```
New component?      → component-name.tsx + component-name.module.css (always both)
New page?           → app/routes/page-name.tsx → update routes.ts LAST
Admin route?        → call requireAdmin() at top of loader
DB query?           → app/services/*.server.ts only, called from loaders/actions
Color / Font?       → var(--color-*) / var(--family-*)
Icon?               → verify named export in lucide-react first, else use Square
Font loading?       → links export in root.tsx — never @import
Tailwind?           → NEVER
Cookie library?     → NEVER — raw parsing only
React Router ver?   → v7 framework mode ONLY
SITE_URL?           → import from ~/lib/seo — NEVER hardcode
```

---

## MANDATORY SEO RULES — EVERY CHANGE

> **CRITICAL**: These rules apply to EVERY route you create or modify. No exceptions.

### 1. SITE_URL — Never Hardcode

```ts
// ✅ CORRECT — import from the central SEO library
import { buildMeta, SITE_URL } from "~/lib/seo";

// ❌ WRONG — never do this
const SITE_URL = "https://the-developer-community-4730.dazl.live"; // ← BANNED
const SITE_URL = "https://www.thedevcommunity.in"; // ← BANNED (use library)
```

### 2. Every Public Route — Full Meta Required

Every public (indexable) route **must** include:

```ts
export function meta(_: Route.MetaArgs) {
  return [
    ...buildMeta({
      title: "Page Title — The Developer Community",
      description: "150 chars max. High-intent. Include primary keyword.",
      path: "/your-path",
      keywords: "keyword1, keyword2, keyword3",
      // ogType defaults to "website"; use "article" for blog posts
    }),
  ];
}
```

The `buildMeta()` utility automatically adds:
- `<title>`
- `<meta name="description">`
- `<meta name="robots" content="index, follow...">`
- All 6 Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`)
- All 5 Twitter Card tags
- `<link rel="canonical">`
- `<meta name="theme-color">`
- og:locale = en_IN

### 3. Private / Auth Routes — noindex Required

Every protected or private route MUST have:

```ts
export function meta() {
  return [
    { title: "Page Name | The Developer Community" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}
```

**Private routes** (always noindex): `/login`, `/register`, `/profile`, `/onboarding`, `/applications`, `/admin/*`, `/logout`, `/auth/callback`, `/forgot-password`, `/reset-password`, `/apply-action`, `/career-apply-action`, `/ideas-submit`

### 4. JSON-LD Structured Data — Required per Page Type

| Page Type | Required Schema(s) |
|---|---|
| Homepage | Organization + WebSite + WebPage + FAQPage + HowTo + Speakable |
| About | Organization + WebPage + BreadcrumbList + FAQPage |
| Projects listing | CollectionPage + BreadcrumbList |
| Project detail | WebPage + BreadcrumbList + SoftwareApplication (optional) |
| Careers listing | CollectionPage + JobPosting |
| Career detail | JobPosting (full) + BreadcrumbList |
| Contact | ContactPage |
| Updates | Blog + BlogPosting per entry |
| Legal pages | WebPage |

Use the builders from `~/lib/seo`:
```ts
import { buildOrganizationSchema, buildFAQSchema, buildBreadcrumbSchema, buildWebPageSchema } from "~/lib/seo";
```

Inject via `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />`

### 5. GEO/AEO Direct Answer Blocks

For AI search indexing (Google AI Overviews, ChatGPT, Perplexity), all key pages **should** include:

```tsx
{/* GEO Direct Answer Block — parsed by AI Overviews */}
<div className="geo-answer speakable-answer" style={{ display: "none" }}>
  <strong>In short:</strong> [Concise answer to "What is this page about" in 1-2 sentences]
</div>
```

These are hidden from users but readable by AI crawlers.

### 6. Image Requirements

Every `<img>` tag must have:
- `alt=""` — descriptive, not empty (unless purely decorative)
- `width` + `height` — explicit values to prevent CLS
- `loading="lazy"` — on all below-fold images
- `fetchpriority="high"` — on LCP hero image only

### 7. Breadcrumb Navigation

Every multi-level page must have a visual breadcrumb AND BreadcrumbList schema:

```ts
buildBreadcrumbSchema([
  { name: "Home", path: "/" },
  { name: "Projects", path: "/projects" },
  { name: project.title, path: `/projects/${project.id}` },
])
```

### 8. New Route Checklist

When creating any new public route, verify all these before committing:

```
[ ] meta() exports buildMeta() with correct title, description, path, keywords
[ ] Page has canonical URL (via buildMeta)
[ ] Page has OG tags (via buildMeta)
[ ] Page has JSON-LD schema inline in JSX (in <script> tag)
[ ] Page has BreadcrumbList schema
[ ] No hardcoded dazl.live URL anywhere
[ ] Images have alt, width, height, loading=lazy
[ ] SITE_URL imported from ~/lib/seo
[ ] route registered in app/routes.ts
```

For new private/auth routes:
```
[ ] meta() has noindex, nofollow
[ ] No OG tags
[ ] No canonical link
```

### 9. Pre-deploy Validation

Before every deploy, run:

```bash
node scripts/seo-preflight.mjs
```

This checks for missing meta, hardcoded dazl.live URLs, missing noindex on auth pages, and missing public files.

### 10. Domain Rules

- **Production domain**: `https://www.thedevcommunity.in`
- **Always use**: `import { SITE_URL } from "~/lib/seo"`
- **Never use**: Any hardcoded URL strings for the site domain

---
