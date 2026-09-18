import "./charts.css";

// Horizontal bar chart used for both "Achievement %" (Graph 2, colored by
// performance status) and the "Top Employee Performance" ranking (Graph 10,
// with a leading rank number). `items` is pre-sorted by the caller — this
// component only renders.
export default function HorizontalBarChart({ items, showRank = false, formatValue = (v) => `${v}%`, maxValue, emptyMessage = "No data for the selected filters." }) {
  if (!items?.length) return <p className="chart-empty">{emptyMessage}</p>;

  const max = maxValue ?? Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="hbar-list">
      {items.map((item, i) => (
        <div className={`hbar-row${showRank ? " hbar-row-rank" : ""}`} key={item.key ?? item.label}>
          {showRank && <span className="hbar-rank">{i + 1}.</span>}
          <span className="hbar-name" title={item.label}>{item.label}</span>
          <div className="hbar-track">
            <div className="hbar-fill" style={{ width: `${Math.min(100, Math.max(2, (item.value / max) * 100))}%`, background: item.color ?? "var(--color-primary-600)" }} />
          </div>
          <span className="hbar-value">{formatValue(item.value)}</span>
        </div>
      ))}
    </div>
  );
}
