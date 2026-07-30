import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";
import ChangePasswordModal from "./ChangePasswordModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { ROUTES } from "../router/routePaths.js";
import "./Topbar.css";

function initials(name) {
  return String(name ?? "")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const DEFAULT_NOTIFICATIONS = [
  { id: 1, title: "New course assigned", message: "You have been assigned \"Sales Fundamentals 101\".", time: "5m ago" },
  { id: 2, title: "Assessment reminder", message: "Complete your pending assessment before it expires.", time: "1h ago" },
  { id: 3, title: "Certificate ready", message: "Your certificate for \"Negotiation Skills\" is ready to download.", time: "3h ago" },
  { id: 4, title: "Target updated", message: "Your monthly sales target has been revised.", time: "Yesterday" },
  { id: 5, title: "New reward unlocked", message: "You earned a new badge for course completion.", time: "2 days ago" },
];

export default function Topbar({
  onMenuClick,
  searchPlaceholder = "Search...",
  notifications = 0,
  messages = 0,
  user,
  rightExtra,
}) {
  const { user: authUser, roleName, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifItems, setNotifItems] = useState(() => DEFAULT_NOTIFICATIONS.slice(0, notifications || DEFAULT_NOTIFICATIONS.length));
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  // Callers can still pass an explicit `user` prop; when they don't, this
  // falls back to whoever is actually logged in instead of staying blank.
  const effectiveUser = user ?? (authUser ? { name: authUser.name, role: roleName, initials: initials(authUser.name) } : null);

  useEffect(() => {
    if (!menuOpen && !notifOpen) return undefined;
    function handleClickOutside(e) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (notifOpen && notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, notifOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  }

  return (
    <header className="topbar">
      {onMenuClick && (
        <button type="button" className="topbar-menu-btn" aria-label="Toggle sidebar" onClick={onMenuClick}>
          <Icon name="menu" size={19} />
        </button>
      )}

      <div className="topbar-search">
        <Icon name="search" size={17} />
        <input type="text" placeholder={searchPlaceholder} />
      </div>

      <div className="topbar-actions">
        {rightExtra}

        <div className="topbar-notif-wrap" ref={notifRef}>
          <button
            type="button"
            className="topbar-icon-btn"
            aria-label="Notifications"
            aria-haspopup="true"
            aria-expanded={notifOpen}
            onClick={() => setNotifOpen((open) => !open)}
          >
            <Icon name="bell" size={18} />
            {notifItems.length > 0 && <span className="topbar-badge">{notifItems.length}</span>}
          </button>

          {notifOpen && (
            <div className="topbar-notif-menu">
              <div className="topbar-notif-header">
                <b>Notifications</b>
                {notifItems.length > 0 && (
                  <button type="button" className="topbar-notif-clear" onClick={() => setNotifItems([])}>
                    Clear all
                  </button>
                )}
              </div>

              <div className="topbar-notif-list">
                {notifItems.length === 0 ? (
                  <div className="topbar-notif-empty">
                    <Icon name="bell" size={22} />
                    <span>No notifications</span>
                  </div>
                ) : (
                  notifItems.map((n) => (
                    <div key={n.id} className="topbar-notif-item">
                      <span className="topbar-notif-dot" />
                      <div className="topbar-notif-item-body">
                        <b>{n.title}</b>
                        <p>{n.message}</p>
                        <span className="topbar-notif-time">{n.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button type="button" className="topbar-icon-btn" aria-label="Messages">
          <Icon name="mail" size={18} />
          {messages > 0 && <span className="topbar-badge">{messages}</span>}
        </button>

        {effectiveUser && (
          <div className="topbar-profile-wrap" ref={menuRef}>
            <button
              type="button"
              className="topbar-profile"
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <span className="topbar-avatar">{effectiveUser.initials}</span>
              <span className="topbar-profile-text">
                <b>{effectiveUser.name}</b>
                <span>{effectiveUser.role}</span>
              </span>
              <Icon name="chevronDown" size={15} />
            </button>

            {menuOpen && (
              <div className="topbar-profile-menu">
                <button
                  type="button"
                  className="topbar-profile-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(ROUTES.MY_PROFILE);
                  }}
                >
                  <Icon name="users" size={15} />
                  My Profile
                </button>
                <button
                  type="button"
                  className="topbar-profile-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    setChangePasswordOpen(true);
                  }}
                >
                  <Icon name="lock" size={15} />
                  Change Password
                </button>
                <button type="button" className="topbar-profile-menu-item danger" onClick={handleLogout}>
                  <Icon name="logout" size={15} />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {changePasswordOpen && <ChangePasswordModal onClose={() => setChangePasswordOpen(false)} />}
    </header>
  );
}
