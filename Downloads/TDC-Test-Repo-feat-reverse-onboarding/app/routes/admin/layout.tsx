import { useState, useEffect } from "react";
import { Outlet, NavLink, useFetcher, useLoaderData, useLocation, redirect } from "react-router";
import type { Route } from "./+types/layout";
import { hasPermission, isSrAdmin, isJrAdmin, type AdminSection } from "../../services/admin-shared";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Users,
  UserCheck,
  CalendarClock,
  TrendingUp,
  Megaphone,
  DollarSign,
  Bell,
  Trophy,
  Settings,
  ClipboardList,
  BarChart3,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Mailbox,
  Radio,
  Briefcase,
  ClipboardCheck,
  CheckCircle2,
  Lock,
  Lightbulb,
  Target
} from "lucide-react";
import classnames from "classnames";
import styles from "./layout.module.css";

/** Prevent ALL admin routes from being indexed by search engines */
export function meta() {
  return [
    { title: "Admin Panel | The Developer Community" },
    { name: "robots", content: "noindex, nofollow" },
    { name: "X-Robots-Tag", content: "noindex" },
  ];
}

export async function loader({ request }: Route.LoaderArgs): Promise<Response> {
  const { requireAdminGate } = await import("../../services/admin.server");
  const { verifySuperAdmin } = await import("../../services/admin.crypto.server");

  const headers = new Headers();
  const { user, profile } = await requireAdminGate(request, headers);
  const data = {
    adminEmail: user.email ?? "",
    displayName: (profile as { display_name?: string | null })?.display_name ?? user.email ?? "Admin",
    profile: profile as any,
    isFounder: verifySuperAdmin(user.email)
  };
  return Response.json(data, { headers });
}

interface NavItem {
  to: string;
  label: string;
  icon: any;
  end?: boolean;
  section: AdminSection | "NONE";
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "CORE",
    items: [
      { to: "/admin", label: "DASHBOARD", icon: LayoutDashboard, end: true, section: "DASHBOARD" },
      { to: "/admin/approvals", label: "APPROVALS", icon: CheckCircle2, section: "APPROVALS" },
      { to: "/admin/planner", label: "PLANNER", icon: Target, section: "PLANNER" },
    ]
  },
  {
    title: "OPERATIONS",
    items: [
      { to: "/admin/projects", label: "PROJECTS", icon: FolderKanban, section: "PROJECTS" },
      { to: "/admin/applications", label: "APPLICATIONS", icon: FileText, section: "APPLICATIONS" },
      { to: "/admin/careers", label: "CAREERS", icon: Briefcase, section: "CAREERS" },
      { to: "/admin/career-applications", label: "JOB APPS", icon: ClipboardCheck, section: "CAREER_APPS" },
      { to: "/admin/teams", label: "TEAMS", icon: UserCheck, section: "TEAMS" },
      { to: "/admin/members", label: "MEMBERS", icon: Users, section: "MEMBERS" },
      { to: "/admin/interviews", label: "INTERVIEWS", icon: CalendarClock, section: "INTERVIEWS" },
      { to: "/admin/ideas", label: "IDEAS", icon: Lightbulb, section: "IDEAS" },
      { to: "/admin/contacts", label: "CONTACTS", icon: Mailbox, section: "CONTACTS" },
    ]
  },
  {
    title: "STRATEGY",
    items: [
      { to: "/admin/progress", label: "PROGRESS", icon: TrendingUp, section: "PROGRESS" },
      { to: "/admin/revenue", label: "REVENUE", icon: DollarSign, section: "REVENUE" },
      { to: "/admin/leaderboard", label: "LEADERBOARD", icon: Trophy, section: "LEADERBOARD" },
      { to: "/admin/certificates", label: "CERTIFICATES", icon: ShieldCheck, section: "CERTIFICATES" },
      { to: "/admin/analytics", label: "ANALYTICS", icon: BarChart3, section: "ANALYTICS" },
    ]
  },
  {
    title: "MARKETING",
    items: [
      { to: "/admin/updates", label: "UPDATES", icon: Radio, section: "UPDATES" },
      { to: "/admin/showcase", label: "SHOWCASE", icon: Megaphone, section: "SHOWCASE" },
      { to: "/admin/comms", label: "COMMS", icon: Bell, section: "COMMS" },
    ]
  },
  {
    title: "SYSTEM",
    items: [
      { to: "/admin/audit", label: "AUDIT LOG", icon: ClipboardList, section: "AUDIT_LOG" },
      { to: "/admin/settings", label: "SETTINGS", icon: Settings, section: "SETTINGS" },
    ]
  }
];

function LogoutButton() {
  const fetcher = useFetcher();
  return (
    <fetcher.Form method="post" action="/logout">
      <button type="submit" className={styles.logoutBtn}>
        <LogOut size={14} />
        <span>LOGOUT</span>
      </button>
    </fetcher.Form>
  );
}

export default function AdminLayout() {
  const { adminEmail, displayName, profile, isFounder } = useLoaderData<typeof loader>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on navigation on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className={styles.root}>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div className={styles.backdrop} onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={classnames(styles.sidebar, isSidebarOpen && styles.sidebarOpen)}>
        <div className={styles.sidebarHeader}>
          <ShieldCheck size={18} className={styles.adminIcon} />
          <div className={styles.sidebarHeaderText}>
            <div className={styles.sidebarTitle}>ADMIN PANEL</div>
            <div className={styles.sidebarSub}>{adminEmail}</div>
            {/* Role badge sits inline below the email */}
            {isFounder
              ? <span className={styles.roleBadgeSuper}>SUPER ADMIN</span>
              : isSrAdmin(profile)
                ? <span className={styles.roleBadgeSr}>SR. ADMIN</span>
                : isJrAdmin(profile)
                  ? <span className={styles.roleBadgeJr}>JR. ADMIN</span>
                  : null
            }
          </div>
          <button 
            className={styles.mobileCloseBtn}
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter(item => 
              item.section === "NONE" || hasPermission(profile, item.section as any, isFounder)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className={styles.navGroup}>
                <div className={styles.groupTitle}>{group.title}</div>
                {visibleItems.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      classnames(styles.navItem, isActive && styles.navItemActive)
                    }
                  >
                    <Icon size={14} className={styles.navIcon} />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarFooterCredits}>
            TDC OS v2.4.0
          </div>
        </div>
      </aside>

      <div className={styles.content}>
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button 
              className={styles.hamburgerBtn}
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>
            {isFounder
              ? <span className={classnames(styles.adminBadge, styles.adminBadgeSuper)}>SUPER ADMIN</span>
              : isSrAdmin(profile)
                ? <span className={classnames(styles.adminBadge, styles.adminBadgeSr)}>SR. ADMIN</span>
                : isJrAdmin(profile)
                  ? <span className={classnames(styles.adminBadge, styles.adminBadgeJr)}>JR. ADMIN</span>
                  : <span className={styles.adminBadge}>ADMIN</span>
            }
            <span className={styles.adminName}>{displayName}</span>
          </div>

          <div className={styles.topBarRight}>
            <NavLink to="/" className={styles.topBarLink}>
              ← MAIN SITE
            </NavLink>
            <div className={styles.topBarDivider} />
            <LogoutButton />
          </div>
        </div>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
