---
trigger: always_on
---

# CLAUDE.md

> Authoritative reference for Claude Code when working in this repository. Read fully before making any changes.

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

Dark-first. All tokens live in `app/styles/theme.css`. **Never hardcode colors, fonts, or spacing in component CSS.*

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
/* my-compo