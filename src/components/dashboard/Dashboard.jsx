import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import Icon from "../Icon.jsx";
import DashboardRouter from "./DashboardRouter.jsx";

function initials(name) {
  return (name ?? "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Dashboard() {
  const { user, roleName, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <header className="dash-topbar">
        <div className="dash-search">
          <Icon name="search" size={18} />
          <input placeholder="Search analytics, courses, or leads..." type="text" />
        </div>

        <div className="dash-topbar-actions">
          <div className="dash-status">
            <span className="dash-status-dot" />
            System Online
          </div>
          <button type="button" className="dash-icon-btn dash-bell">
            <Icon name="bell" size={18} />
          </button>
          <div className="dash-divider" />
          <button
            type="button"
            className="topbar-profile"
            style={{ cursor: "default" }}
          >
            <span className="topbar-avatar">
              {initials(user?.name)}
            </span>
            <span className="topbar-profile-text">
              <b>{user?.name}</b>
              <span>{roleName}</span>
            </span>
          </button>
          <button
            type="button"
            className="dash-ghost-btn"
            onClick={() => navigate("/settings")}
            title="Profile"
            style={{ padding: "6px 10px" }}
          >
            <Icon name="settings" size={16} />
          </button>
          <button
            type="button"
            className="dash-ghost-btn"
            onClick={logout}
            title="Log out"
            style={{ padding: "6px 10px", color: "var(--color-danger)" }}
          >
            <Icon name="logout" size={16} />
          </button>
        </div>
      </header>

      <DashboardRouter />
    </>
  );
}

