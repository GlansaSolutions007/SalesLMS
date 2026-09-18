import "./charts.css";

// Line/area trend chart (Graph 3: Monthly Target vs Achievement; Graph 5:
// Revenue). A plain SVG polyline/path per series, percentage-based viewBox
// so it scales with its container — no charting library is installed in
// this project. `vectorEffect="non-scaling-stroke"` keeps line thickness
// constant even though `preserveAspectRatio="none"` stretches the 100x100
// viewBox non-uniformly to fill the actual (wide, short) chart area.
export default function TrendChart({ categories, series, formatValue = (v) => v, emptyMessage = "No data for the selected filters.", showValues = false }) {
  if (!categories?.length) return <p className="chart-empty">{emptyMessage}</p>;

  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const n = categories.length;
  const xFor = (i) => (n <= 1 ? 50 : (i / (n - 1)) * 100);
  const yFor = (v) => 92 - (v / max) * 82; // keep the plotted line within an 8–92 vertical band

  return (
    <div className="trend-chart-wrap">
      <div className="chart-legend">
        {series.map((s) => (
          <span className="chart-legend-item" key={s.name}>
            <span className="chart-legend-swatch" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>

      <div className="trend-chart-plot">
        <svg className="trend-chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          {series.map((s) => {
            const points = s.values.map((v, i) => [xFor(i), yFor(v)]);
            const linePoints = points.map(([x, y]) => `${x},${y}`).join(" ");

            return (
              <g key={s.name}>
                {s.area && (
                  <path
                    d={`M${points[0][0]},100 ${points.map(([x, y]) => `L${x},${y}`).join(" ")} L${points[points.length - 1][0]},100 Z`}
                    fill={s.color}
                    fillOpacity={0.12}
                    stroke="none"
                  />
                )}
                <polyline points={linePoints} fill="none" stroke={s.color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
                {points.map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r={2.2} fill={s.color} vectorEffect="non-scaling-stroke">
                    <title>{`${categories[i]} — ${s.name}: ${formatValue(s.values[i])}`}</title>
                  </circle>
                ))}
              </g>
            );
          })}
        </svg>

        {showValues && (
          // Plain HTML overlay, not SVG <text> — the viewBox above is
          // stretched non-uniformly (preserveAspectRatio="none"), which
          // would squash/stretch SVG text glyphs. xFor/yFor already return
          // 0–100 values that equal a percentage of this same-sized overlay,
          // so positioning by left/top % lines up with each plotted point.
          <div className="trend-value-labels">
            {series.map((s) =>
              s.values.map((v, i) => (
                <span
                  key={`${s.name}-${i}`}
                  className="trend-value-label"
                  style={{ left: `${xFor(i)}%`, top: `${yFor(v)}%`, color: s.color }}
                >
                  {formatValue(v)}
                </span>
              ))
            )}
          </div>
        )}
      </div>

      <div className="trend-chart-labels">
        {categories.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
    </div>
  );
}
