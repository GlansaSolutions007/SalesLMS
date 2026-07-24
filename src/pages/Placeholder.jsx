import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { findMenuItemById } from "../config/menuConfig.js";
import { ROUTES } from "../router/routePaths.js";
import "./dashboard.css";
import "./placeholder.css";

export default function Placeholder({ pageId }) {
  const navigate = useNavigate();
  const item = findMenuItemById(pageId);

  return (
    <div className="placeholder-wrap">
      <div className="placeholder-icon">
        <Icon name={item?.icon ?? "grid"} size={26} />
      </div>
      <h1>{item?.title ?? "Page"}</h1>
      <p>This section isn't built yet — wire it up the same way as the other pages, using the shared Sidebar and design tokens.</p>
      <button type="button" className="dash-primary-btn" onClick={() => navigate(ROUTES.DASHBOARD)}>
        Back to Dashboard
      </button>
    </div>
  );
}
