import "./SubNavTabs.css";

export default function SubNavTabs({ tabs, active, onNavigate }) {
  return (
    <div className="subnav-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`subnav-tab${active === tab.key ? " is-active" : ""}`}
          onClick={() => onNavigate(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
