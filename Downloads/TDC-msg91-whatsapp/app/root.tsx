/**
 * Application Entry Point
 * Manages core layout, authentication restoration, and global context.
 */
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLocation, useNavigation, useLoaderData } from "react-router";
import type { Route } from "./+types/root";
import colorSchemeApi from "@dazl/color-scheme/client?url";
import { ErrorBoundary as ErrorBoundaryRoot } from "~/components/error-boundary/error-boundary";
import { useColorScheme } from "@dazl/color-scheme/react";
import { createSupabaseServerClient } from "./lib/supabase.server";
import { useRef, useEffect, useState } from "react";
import classnames from "classnames";
import { SpeedInsights } from '@vercel/speed-insights/react';

import "./styles/reset.css";
import "./styles/global.css";
import "./styles/theme.css";
import styles from "./root.module.css";

import { NavigationHeader } from "./blocks/__global/navigation-header";
import { SystemStatusFooter } from "./blocks/__global/system-status-footer";
import { SiteFooter } from "./components/site-footer/site-footer";

const SITE_URL = "https://www.thedevcommunity.in";
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID ?? "G-T9CQ8NRVZB";
const GSC_CODE = import.meta.env.VITE_GSC_VERIFICATION ?? "";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },

  // PWA Manifest
  { rel: "manifest", href: "/manifest.json" },

  // DNS prefetch + preconnect for all external domains
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "dns-prefetch", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  { rel: "dns-prefetch", href: "https://fonts.gstatic.com" },
  { rel: "preconnect", href: "https://www.googletagmanager.com" },
  { rel: "dns-prefetch", href: "https://www.googletagmanager.com" },
  { rel: "preconnect", href: "https://ivhlsmpxxricfytyswzi.supabase.co" },
  { rel: "dns-prefetch", href: "https://ivhlsmpxxricfytyswzi.supabase.co" },

  // Google Fonts
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&family=VT323&display=swap",
  },

  // Preload OG image (used on all pages)
  { rel: "preload", as: "image", href: "/og-image.png" },

  // Sitemap reference
  { rel: "sitemap", href: "/sitemap.xml", type: "application/xml" },
];

interface RootLoaderData {
  userId: string | null;
  userEmail: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  githubConnected: boolean;
  stats: {
    totalMembers: number;
    shippedProjects: number;
    openRoles: number;
  };
}

export async function loader({ request }: Route.LoaderArgs): Promise<Response> {
  const headers = new Headers();
  const url = new URL(request.url);
  const isAdminPath = url.pathname.startsWith('/admin');

  // CRITICAL ARCHITECTURE FIX:
  // Prevent React Router from executing getUser() simultaneously with exchangeCodeForSession().
  if (url.pathname.startsWith('/auth/callback')) {
    return Response.json({
      userId: null,
      userEmail: null,
      displayName: null,
      avatarUrl: null,
      isAdmin: false,
      githubConnected: false,
      stats: { totalMembers: 0, shippedProjects: 0, openRoles: 0 },
    }, { headers });
  }

  // Security headers for all responses
  headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  const supabase = await createSupabaseServerClient(request, headers);

  // OPTIMIZATION: Fetch user session and ONLY fetch stats if we are NOT in admin portal or immersive pages.
  // Admin and immersive pages don't usually need the footer counts which save 3 DB round trips.
  const authPromise = supabase.auth.getUser();
  const isImmersivePath = url.pathname === '/login' || url.pathname === '/register' || url.pathname === '/onboarding' || url.pathname === '/connect-github';
  
  const statsQueries = (isAdminPath || isImmersivePath) ? [
    Promise.resolve({ count: 0 }),
    Promise.resolve({ count: 0 }),
    Promise.resolve({ count: 0 })
  ] : [
    (supabase as any).from("profiles").select("*", { count: "exact", head: true }),
    (supabase as any).from("projects").select("*", { count: "exact", head: true }).eq("is_published", true),
    (supabase as any).from("career_listings").select("*", { count: "exact", head: true }).eq("status", "OPEN").eq("is_published", true),
  ];

  const [
    { data: { user } },
    { count: totalMembers },
    { count: shippedProjects },
    { count: openRoles }
  ] = await Promise.all([authPromise, ...statsQueries]);

  let isAdmin = false;
  let avatarUrl = null;
  let displayName = user?.user_metadata?.display_name ?? null;
  let githubConnected = false;

  if (user) {
    const { verifySuperAdmin } = await import("./services/admin.crypto.server");
    if (verifySuperAdmin(user.email)) {
      isAdmin = true;
    }

    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("is_admin, avatar_url, display_name, github_id")
      .eq("id", user.id)
      .single();

    if (profile) {
      if (profile.is_admin) isAdmin = true;
      avatarUrl = profile.avatar_url;
      if (profile.display_name) displayName = profile.display_name;
      githubConnected = Boolean(profile.github_id);
    }
  }

  const data: RootLoaderData = {
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    displayName,
    avatarUrl,
    isAdmin,
    githubConnected,
    stats: {
      totalMembers: totalMembers || 0,
      shippedProjects: shippedProjects || 0,
      openRoles: openRoles || 0,
    }
  };
  return Response.json(data, { headers });
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { rootCssClass, resolvedScheme } = useColorScheme();
  return (
    <html lang="en-IN" suppressHydrationWarning className={rootCssClass} style={{ colorScheme: resolvedScheme }}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="theme-color" content="#000000" />
        {/* Google Search Console Verification — replace with actual code from GSC */}
        {GSC_CODE && GSC_CODE !== "REPLACE_WITH_GSC_CODE" && (
          <meta name="google-site-verification" content={GSC_CODE} />
        )}
        <Meta />
        {/* Google Analytics 4 */}
        {GA_ID && GA_ID !== "G-XXXXXXXXXX" && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', {
  send_page_view: true,
  cookie_flags: 'SameSite=None;Secure',
  custom_map: { custom_parameter_1: 'site_section' }
});
// Enhanced events: scroll depth
gtag('event', 'page_view');
if (typeof window !== 'undefined') {
  // Scroll depth tracking
  let maxScroll = 0;
  const scrollThresholds = [25, 50, 75, 90];
  window.addEventListener('scroll', function() {
    const pct = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    scrollThresholds.forEach(t => {
      if (pct >= t && maxScroll < t) {
        maxScroll = t;
        gtag('event', 'scroll', { percent_scrolled: t });
      }
    });
  }, { passive: true });
  // Outbound link tracking
  document.addEventListener('click', function(e) {
    const anchor = e.target.closest('a');
    if (anchor && anchor.href && !anchor.href.startsWith(location.origin)) {
      gtag('event', 'outbound_click', { link_url: anchor.href, link_text: anchor.innerText });
    }
  });
  // CTA click tracking
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-cta]');
    if (btn) gtag('event', 'cta_click', { cta_label: btn.dataset.cta });
  });
  // Form submit tracking
  document.addEventListener('submit', function(e) {
    const form = e.target;
    if (form && form.id) gtag('event', 'form_submit', { form_id: form.id });
  });
}
                `.trim(),
              }}
            />
          </>
        )}
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').catch(function(){});
  });
}
            `.trim(),
          }}
        />
        <script src={colorSchemeApi} data-light-class="light-theme" data-dark-class="dark-theme"></script>
        <Links />
      </head>
      <body className={styles.body}>
        {/* Skip navigation link for accessibility */}
        <a href="#main-content" className={styles.skipLink}>
          Skip to main content
        </a>
        {children}
        <SpeedInsights />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function AdminAwareLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const pathname = location.pathname.toLowerCase();
  const isAdminPage = pathname.startsWith("/admin");
  const isImmersivePage = pathname === "/onboarding" || pathname === "/login" || pathname === "/register" || pathname === "/connect-github";

  if (isAdminPage || isImmersivePage) {
    return <>{children}</>;
  }

  return (
    <>
      <a id="main-content" aria-hidden="true" style={{ position: "absolute", top: 0 }} />
      <header className={styles.header}>
        <NavigationHeaderWrapper />
      </header>
      <main className={styles.main}>{children}</main>
      <SiteFooter />
      <footer className={styles.footer}>
        <SystemStatusFooterWrapper />
      </footer>
    </>
  );
}

function NavigationHeaderWrapper() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const data = useLoaderData<RootLoaderData>();
    return (
      <NavigationHeader
        isLoggedIn={!!data?.userId}
        displayName={data?.displayName ?? null}
        avatarUrl={data?.avatarUrl ?? null}
        isAdmin={data?.isAdmin ?? false}
      />
    );
  } catch {
    return <NavigationHeader isLoggedIn={false} displayName={null} isAdmin={false} />;
  }
}

function SystemStatusFooterWrapper() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const data = useLoaderData<RootLoaderData>();
    return <SystemStatusFooter stats={data?.stats} />;
  } catch {
    return <SystemStatusFooter />;
  }
}

/**
 * Paths exempt from the client-side GitHub enforcement redirect.
 * These are public pages, auth flows, or the connect-github page itself.
 */
const GITHUB_EXEMPT_PATHS = new Set([
  "/", "/login", "/register", "/logout", "/onboarding", "/connect-github",
  "/projects", "/careers", "/about", "/terms", "/privacy", "/contact", "/updates",
]);

function isGithubExempt(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  if (GITHUB_EXEMPT_PATHS.has(lower)) return true;
  // Exempt path prefixes: auth callbacks, API, SEO infra, public profiles, project/career detail
  if (lower.startsWith("/auth/")) return true;
  if (lower.startsWith("/api/")) return true;
  if (lower.startsWith("/dev/")) return true;
  if (lower.startsWith("/projects/")) return true;
  if (lower.startsWith("/careers/")) return true;
  if (lower.startsWith("/sitemap")) return true;
  if (lower.startsWith("/health")) return true;
  return false;
}

export default function App() {
  const navigation = useNavigation();
  const location = useLocation();
  
  const currentPath = location.pathname.toLowerCase();
  const nextPath = navigation.location?.pathname.toLowerCase();
  
  const isNavigating = navigation.state === "loading";

  // Only fade transition if moving between completely different sections
  const currentBase = currentPath.split('/')[1] || '';
  const nextBase = nextPath ? nextPath.split('/')[1] || '' : '';
  const isSameSection = isNavigating && currentBase === nextBase;
  const shouldAnimate = isNavigating && !isSameSection;

  const isImmersive = currentPath === "/onboarding" || currentPath === "/login" || currentPath === "/register" || currentPath === "/connect-github";

  // Client-side safety net: redirect logged-in users without GitHub to /connect-github
  let loaderData: RootLoaderData | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    loaderData = useLoaderData<RootLoaderData>();
  } catch {
    // Loader data may not be available during error boundaries
  }

  useEffect(() => {
    if (
      loaderData?.userId &&
      !loaderData.githubConnected &&
      !isGithubExempt(location.pathname)
    ) {
      const dest = `/connect-github?redirect=${encodeURIComponent(location.pathname + location.search)}`;
      window.location.replace(dest);
    }
  }, [loaderData, location.pathname, location.search]);

  return (
    <div className={classnames(
      styles.pageContainer, 
      shouldAnimate && styles.navigating,
      isImmersive && styles.immersive
    )}>
      <AdminAwareLayout>
        <Outlet />
      </AdminAwareLayout>
    </div>
  );
}

export const ErrorBoundary = ErrorBoundaryRoot;
