import Icon from "./Icon.jsx";
import "./Topbar.css";

export default function Topbar({
  onMenuClick,
  searchPlaceholder = "Search...",
  notifications = 0,
  messages = 0,
  user,
  rightExtra,
}) {
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

        {user && (
          <button type="button" className="topbar-profile">
            <span className="topbar-avatar">{user.initials}</span>
            <span className="topbar-profile-text">
              <b>{user.name}</b>
              <span>{user.role}</span>
            </span>
            <Icon name="chevronDown" size={15} />
          </button>
        )}
      </div>
    </header>
  );
}
