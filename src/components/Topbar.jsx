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
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const menuRef = useRef(null);

  // Callers can still pass an explicit `user` prop; when they don't, this
  // falls back to whoever is actually logged in instead of staying blank.
  const effectiveUser = user ?? (authUser ? { name: authUser.name, role: roleName, initials: initials(authUser.name) } : null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

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

        <button type="button" className="topbar-icon-btn" aria-label="Notifications">
          <Icon name="bell" size={18} />
          {notifications > 0 && <span className="topbar-badge">{notifications}</span>}
        </button>

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
