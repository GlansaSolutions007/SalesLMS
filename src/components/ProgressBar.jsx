import "./ProgressBar.css";

export default function ProgressBar({ value, tone = "primary", showLabel = true }) {
  return (
    <div className="progress">
      <div className="progress-track">
        <div className={`progress-fill progress-${tone}`} style={{ width: `${value}%` }} />
      </div>
      {showLabel && <span className="progress-label">{value}%</span>}
    </div>
  );
}
