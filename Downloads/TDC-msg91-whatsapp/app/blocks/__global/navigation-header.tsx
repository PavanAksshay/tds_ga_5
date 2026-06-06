import { NavLink, useLocation, useFetcher } from "react-router";
import { Settings, LogOut, ShieldCheck } from "lucide-react";
import classnames from "classnames";
import { useState, useRef, useEffect } from "react";
import styles from "./navigation-header.module.css";

export interface NavigationHeaderProps {
  className?: string;
  isLoggedIn: boolean;
  displayName: string | null;
  avatarUrl?: string | null;
  isAdmin?: boolean;
}

function ComingSoonNavItem({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <li className={styles.comingSoonItem} ref={ref}>
      <button
        className={styles.navLinkDisabled}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        type="button"
      >
        {label}
        <span className={styles.comingSoonBadge}>SOON</span>
      </button>
      {open && (
        <div className={styles.comingSoonPopover}>
          <span className={styles.comingSoonPopoverLabel}>// COMING SOON</span>
          <p className={styles.comingSoonPopoverText}>
            {label.charAt(0) + label.slice(1).toLowerCase()} is currently under development.
            Stay tuned for updates.
          </p>
        </div>
      )}
    </li>
  );
}

function LogoutButton() {
  const fetcher = useFetcher();
  return (
    <fetcher.Form method="post" action="/logout">
      <button type="submit" className={styles.logoutBtn} aria-label="Logout">
        <LogOut size={14} />
        <span>LOGOUT</span>
      </button>
    </fetcher.Form>
  );
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  const words = name.trim().split(/[\s_]+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function NavigationHeader({ className, isLoggedIn, displayName, avatarUrl, isAdmin = false }: NavigationHeaderProps) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auto-close mobile menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/onboarding" ||
    location.pathname === "/connect-github";

  // Hide main nav on admin pages — admin has its own sidebar
  const isAdminPage = location.pathname.startsWith("/admin");
  if (isAdminPage) return null;

  const initials = getInitials(displayName);

  return (
    <nav className={classnames(styles.root, className)}>
      <div className={styles.navBrandWrapper}>
        <button 
          className={styles.hamburgerBtn}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
        <NavLink to="/" className={styles.logoWrapper} aria-label="Home">
          <img src="/tdc-wide.svg" alt="TDC Logo" className={styles.logoImage} />
          <div className={styles.logo}>THE DEVELOPER COMMUNITY</div>
          <div className={styles.mobileLogo}>TDC</div>
        </NavLink>
      </div>

      <ul className={classnames(styles.navList, isMobileMenuOpen && styles.open)}>
        {isLoggedIn ? (
          <>
            <li>
              <NavLink
                to="/profile"
                end
                prefetch="intent"
                className={({ isActive }) => classnames(styles.navLink, isActive && styles.active)}
              >
                PROFILE
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/projects"
                prefetch="intent"
                className={({ isActive }) => classnames(styles.navLink, isActive && styles.active)}
              >
                PROJECTS
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/careers"
                prefetch="intent"
                className={({ isActive }) => classnames(styles.navLink, isActive && styles.active)}
              >
                CAREERS
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/ideas-submit"
                prefetch="intent"
                className={({ isActive }) => classnames(styles.navLink, isActive && styles.active)}
              >
                IDEAS
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/updates"
                prefetch="intent"
                className={({ isActive }) => classnames(styles.navLink, isActive && styles.active)}
              >
                UPDATES
              </NavLink>
            </li>
          </>
        ) : (
          <>
            <li>
              <NavLink
                to="/"
                end
                prefetch="intent"
                className={({ isActive }) => classnames(styles.navLink, isActive && styles.active)}
              >
                HOME
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/projects"
                prefetch="intent"
                className={({ isActive }) => classnames(styles.navLink, isActive && styles.active)}
              >
                PROJECTS
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/careers"
                prefetch="intent"
                className={({ isActive }) => classnames(styles.navLink, isActive && styles.active)}
              >
                CAREERS
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/about"
                prefetch="intent"
                className={({ isActive }) => classnames(styles.navLink, isActive && styles.active)}
              >
                ABOUT
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/updates"
                prefetch="intent"
                className={({ isActive }) => classnames(styles.navLink, isActive && styles.active)}
              >
                UPDATES
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/contact"
                prefetch="intent"
                className={({ isActive }) => classnames(styles.navLink, isActive && styles.active)}
              >
                CONTACT
              </NavLink>
            </li>
          </>
        )}
        <ComingSoonNavItem label="THREADS" />
        <ComingSoonNavItem label="LEADERBOARD" />
      </ul>

      <div className={styles.utils}>
        {isLoggedIn ? (
          <>
            <NavLink to="/profile?tab=SETTINGS" className={styles.iconBtn} aria-label="Settings">
              <Settings size={16} />
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={styles.adminBtn} aria-label="Admin Panel">
                <ShieldCheck size={12} />
                <span>ADMIN</span>
              </NavLink>
            )}
            <NavLink to="/profile" className={styles.avatarBtn} aria-label="Profile">
              {avatarUrl ? (
                <img src={avatarUrl} alt="User avatar" className={styles.avatarImage} />
              ) : (
                <span className={styles.avatarInitials}>{initials}</span>
              )}
            </NavLink>
            <LogoutButton />
          </>
        ) : (
          <>
            {!isAuthPage && (
              <NavLink
                to="/login"
                className={({ isActive }) => classnames(styles.loginBtn, isActive && styles.active)}
              >
                LOGIN
              </NavLink>
            )}
          </>
        )}
      </div>
    </nav>
  );
}
