import "./charts.css";

// Donut chart (Graph 6: Performance Distribution). Plain SVG circle with a
// dasharray-based stroke per segment — no charting library is installed in
// this project.
const SIZE = 140;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function DonutChart({ segments, centerLabel = "Total", emptyMessage = "No data for the selected filters." }) {
  const total = segments?.reduce((sum, s) => sum + s.value, 0) ?? 0;

  if (!segments?.length || total === 0) return <p className="chart-empty">{emptyMessage}</p>;

  let offset = 0;

  return (
    <div className="donut-wrap">
      <svg className="donut-svg" width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--color-surface)" strokeWidth={STROKE} />
        {segments.map((s) => {
          if (s.value === 0) return null;
          const length = (s.value / total) * CIRCUMFERENCE;
          const circle = (
            <circle
              key={s.label}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={s.color}
              strokeWidth={STROKE}
              strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            >
              <title>{`${s.label}: ${s.value}`}</title>
            </circle>
          );
          offset += length;
          return circle;
        })}
        <text x="50%" y="47%" textAnchor="middle" className="donut-center-value">{total}</text>
        <text x="50%" y="61%" textAnchor="middle" className="donut-center-label">{centerLabel}</text>
      </svg>

      <div className="donut-legend">
        {segments.map((s) => (
          <div className="donut-legend-row" key={s.label}>
            <span className="chart-legend-swatch" style={{ background: s.color }} />
            {s.label}
            <span className="donut-legend-count">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
