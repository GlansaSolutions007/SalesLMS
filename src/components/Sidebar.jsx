import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";
import { menuConfig, isMenuItemVisible } from "../config/menuConfig.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ROUTES } from "../router/routePaths.js";
import "./Sidebar.css";

const STORAGE_KEY = "saleslms.sidebarCollapsed";

function readStoredCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function initials(name) {
  return (name ?? "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Sidebar({ collapsed: collapsedProp, onToggleCollapsed }) {
  const isControlled = collapsedProp !== undefined;
  const [internalCollapsed, setInternalCollapsed] = useState(readStoredCollapsed);
  const collapsed = isControlled ? collapsedProp : internalCollapsed;
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);

  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, roleName, permissions, logout } = useAuth();
  const access = { roleName, permissions };
  const visibleItems = menuConfig.filter((item) => isMenuItemVisible(item, access));

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
    if (isControlled) {
      onToggleCollapsed?.(!collapsed);
      return;
    }
    setInternalCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function isSectionActive(item) {
    return pathname === item.path || pathname.startsWith(`${item.path}/`);
  }

  function handleLinkClick() {
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

        {/* Only this region scrolls — header (brand) and footer (profile/logout)
            stay fixed regardless of how many menu items there are. */}
        <div className="sidebar-scroll">
          <nav className="sidebar-nav">
            {visibleItems.map((item) => {
              const active = isSectionActive(item);
              const visibleChildren = item.children?.filter((child) => isMenuItemVisible(child, access)) ?? [];
              const hasChildren = visibleChildren.length > 0;

              return (
                <div key={item.id}>
                  <NavLink
                    to={item.path}
                    className={`sidebar-link${active ? " is-active" : ""}`}
                    title={showAsCollapsed ? item.title : undefined}
                    onClick={handleLinkClick}
                  >
                    <Icon name={item.icon} size={19} />
                    <span>{item.title}</span>
                    {hasChildren && !showAsCollapsed && (
                      <Icon name="chevronRight" size={13} className={`sidebar-link-chevron${active ? " is-open" : ""}`} />
                    )}
                  </NavLink>

                  {hasChildren && !showAsCollapsed && (
                    <div className={`sidebar-submenu-wrap${active ? " is-expanded" : ""}`}>
                      <div className="sidebar-submenu-inner">
                        <div className="sidebar-submenu">
                          {visibleChildren.map((child) => (
                            <NavLink
                              key={child.id}
                              to={child.path}
                              className={({ isActive }) => `sidebar-sublink${isActive ? " is-active" : ""}`}
                              onClick={handleLinkClick}
                            >
                              {child.title}
                            </NavLink>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="sidebar-promo">
            <div className="promo-cap">
              <Icon name="cap" size={20} />
            </div>
            <h4>Keep learning.<br />Keep growing.</h4>
            <p className="promo-body">Access training modules and boost your skills.</p>
            <button type="button" className="promo-cta" onClick={() => navigate(ROUTES.COURSES)}>
              Explore Training
              <Icon name="arrow" size={14} />
            </button>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar" title={showAsCollapsed ? user?.name : undefined}>
              {initials(user?.name)}
              <span className="sidebar-avatar-dot" />
            </div>
            <div className="sidebar-user-text">
              <p>{user?.name}</p>
              <span>{roleName}</span>
            </div>
            <button
              type="button"
              className="sidebar-icon-btn"
              onClick={logout}
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
