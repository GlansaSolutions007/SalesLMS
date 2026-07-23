import { useEffect, useState } from "react";
import Icon from "./Icon.jsx";
import "./Sidebar.css";

export const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "grid" },
  { key: "courses", label: "Courses", icon: "book" },
  { key: "pipeline", label: "Sales Pipeline", icon: "pipeline" },
  { key: "leads", label: "Leads", icon: "users" },
  { key: "leaderboard", label: "Team Leaderboard", icon: "trophy" },
];

const STORAGE_KEY = "saleslms.sidebarCollapsed";

function readStoredCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export default function Sidebar({ active, onNavigate, onLogout }) {
  const [collapsed, setCollapsed] = useState(readStoredCollapsed);
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);

  // Track viewport so mobile always renders the full (uncollapsed) drawer.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1100px)");
    const update = (e) => {
      setIsMobile(e.matches);
      setOpen(false);
    };
    update(mq);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function handleNavigate(key) {
    onNavigate?.(key);
    setOpen(false);
  }

  const showAsCollapsed = collapsed && !isMobile;

  return (
    <>
      {isMobile && (
        <button
          type="button"
          className="sidebar-mobile-trigger"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((s) => !s)}
        >
          <Icon name={open ? "close" : "menu"} size={19} />
        </button>
      )}

      {isMobile && open && (
        <div className="sidebar-overlay" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      <aside
        className={`sidebar${showAsCollapsed ? " collapsed" : ""}${isMobile && open ? " open" : ""}`}
      >
        <div className="sidebar-bg" aria-hidden="true">
          <span className="sidebar-glow glow-a" />
          <span className="sidebar-glow glow-b" />
          <svg className="sidebar-strokes" viewBox="0 0 300 320" preserveAspectRatio="none">
            <path d="M-10 230 C70 160 150 120 310 60" />
            <path d="M-10 290 C90 230 170 170 310 130" />
            <circle cx="248" cy="72" r="34" />
          </svg>
        </div>

        <svg className="sidebar-mesh" viewBox="0 0 200 200" fill="none" aria-hidden="true">
          <path d="M0 0C50 100 150 50 200 200" stroke="white" strokeWidth="0.5" />
          <path d="M50 0C100 150 150 100 200 150" stroke="white" strokeWidth="0.5" />
        </svg>

        {!isMobile && (
          <button
            type="button"
            className="sidebar-collapse-btn"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            onClick={toggleCollapsed}
          >
            <Icon name="chevron" size={13} />
          </button>
        )}

        <div className="sidebar-brand">
          <div className="sidebar-mark">
            <Icon name="car" size={20} />
          </div>
          <div className="sidebar-brand-text">
            <b>Sales LMS</b>
            <span>Enterprise Tier</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`sidebar-link${active === item.key ? " is-active" : ""}`}
              title={showAsCollapsed ? item.label : undefined}
              onClick={() => handleNavigate(item.key)}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-promo">
            <p className="promo-eyebrow">New Feature</p>
            <h4>AI Sales Coach</h4>
            <button type="button" className="promo-cta">
              Try Beta Now
            </button>
            <Icon name="rocket" size={54} />
          </div>

          <div className="sidebar-user">
            <div className="sidebar-avatar" title={showAsCollapsed ? "John Anderson" : undefined}>
              JA
              <span className="sidebar-avatar-dot" />
            </div>
            <div className="sidebar-user-text">
              <p>John Anderson</p>
              <span>Sales Director</span>
            </div>
            <button
              type="button"
              className="sidebar-icon-btn"
              onClick={onLogout}
              title="Log out"
            >
              <Icon name="logout" size={17} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}