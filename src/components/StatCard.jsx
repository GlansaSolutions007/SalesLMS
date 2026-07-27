import Icon from "./Icon.jsx";
import "./StatCard.css";

export default function StatCard({ icon, label, value, tone = "blue" }) {
  return (
    <div className="stat-card-lite">
      <div className={`stat-card-lite-icon tone-${tone}`}>
        <Icon name={icon} size={20} />
      </div>
      <div>
        <p className="stat-card-lite-value">{value}</p>
        <p className="stat-card-lite-label">{label}</p>
      </div>
    </div>
  );
}
