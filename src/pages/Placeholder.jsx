import Icon from "../components/Icon.jsx";
import Sidebar, { NAV_ITEMS } from "../components/Sidebar.jsx";
import "./dashboard.css";
import "./placeholder.css";

export default function Placeholder({ page, onNavigate, onLogout }) {
  const item = NAV_ITEMS.find((n) => n.key === page);

  return (
    <div className="dash-shell">
      <Sidebar active={page} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="dash-main">
        <div className="placeholder-wrap">
          <div className="placeholder-icon">
            <Icon name={item?.icon ?? "grid"} size={26} />
          </div>
          <h1>{item?.label ?? "Page"}</h1>
          <p>This section isn't built yet — wire it up the same way as the dashboard page, using the shared Sidebar and design tokens.</p>
          <button type="button" className="dash-primary-btn" onClick={() => onNavigate("dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
