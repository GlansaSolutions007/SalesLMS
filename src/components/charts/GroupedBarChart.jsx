import "./charts.css";

// Grouped bar chart: one group of bars per category (employee), one bar per
// series (Target/Achieved, or Leads/Converted). Hand-rolled with plain divs
// sized by inline `height: %` — same technique as the existing
// .bar-chart/.bar-track/.bar-fill pattern in dashboard.css — since no chart
// library is installed in this project.
export default function GroupedBarChart({ categories, series, formatValue = (v) => v, emptyMessage = "No data for the selected filters.", showValues = false }) {
  if (!categories?.length) return <p className="chart-empty">{emptyMessage}</p>;

  const max = Math.max(1, ...series.flatMap((s) => s.values));

  return (
    <div>
      <div className="chart-legend">
        {series.map((s) => (
          <span className="chart-legend-item" key={s.name}>
            <span className="chart-legend-swatch" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
      <div className="gbar-chart">
        {categories.map((category, i) => (
          <div className="gbar-group" key={category}>
            <div className="gbar-bars">
              {series.map((s) => {
                const value = s.values[i] ?? 0;
                const heightPct = Math.max(1, (value / max) * 100);
                return (
                  <div className="gbar-bar-wrap" key={s.name} title={`${s.name}: ${formatValue(value)}`}>
                    {showValues && (
                      <span className="gbar-value" style={{ bottom: `${heightPct}%` }}>
                        {formatValue(value)}
                      </span>
                    )}
                    <div className="gbar-bar" style={{ height: `${heightPct}%`, background: s.color }} />
                  </div>
                );
              })}
            </div>
            <span className="gbar-label">{category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
