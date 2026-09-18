import Modal from "../../components/Modal.jsx";
import Badge from "../../components/Badge.jsx";
import TrendChart from "../../components/charts/TrendChart.jsx";
import GroupedBarChart from "../../components/charts/GroupedBarChart.jsx";
import { statusTone } from "./performanceStatus.js";
import { formatMetric } from "./formatMetric.js";
import { DUMMY_REPORT } from "./dummyReport.js";

// Reads from the SAME dummy report object EmployeeTargetPerformance.jsx
// renders its table/charts from, so the numbers here can never drift from
// what the page already shows for this employee — see this project's
// UI-only scope note on EmployeeTargetPerformance.jsx.
export default function EmployeeDetailModal({ employeeId, targetType, onClose }) {
  const row = DUMMY_REPORT.by_employee.find((r) => r.employee_id === employeeId);
  const trend = DUMMY_REPORT.monthly_trend;

  return (
    <Modal title="Employee Performance Details" size="lg" onClose={onClose}>
      {!row ? (
        <p className="chart-empty">No data found for this employee in the selected period.</p>
      ) : (
        <div className="form-fields-stack">
          <div>
            <h3 style={{ margin: "0 0 4px" }}>{row.full_name}</h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--color-muted)" }}>{row.team_name ?? "No team assigned"}</p>
          </div>

          <div className="cv-stats-grid">
            <DetailStat label="Target" value={formatMetric(row.target, targetType)} />
            <DetailStat label="Achievement" value={formatMetric(row.achievement, targetType)} />
            <DetailStat label="Remaining Target" value={formatMetric(Math.max(0, row.target - row.achievement), targetType)} />
            <DetailStat label="Achievement %" value={`${row.achievement_pct}%`} />
            <DetailStat label="Total Leads" value={row.leads} />
            <DetailStat label="Converted Leads" value={row.converted} />
            <DetailStat label="Conversion %" value={`${row.conversion_pct}%`} />
            <DetailStat label="Revenue" value={`₹${Number(row.revenue).toLocaleString()}`} />
          </div>

          <div>
            <Badge tone={statusTone(row.status)}>{row.status_label}</Badge>
          </div>

          <div className="chart-card">
            <h4 className="chart-title">Monthly Target vs Achievement</h4>
            <TrendChart
              categories={trend.map((t) => t.month)}
              series={[
                { name: "Target", color: "var(--color-primary-600)", values: trend.map((t) => t.target) },
                { name: "Achievement", color: "var(--color-accent)", values: trend.map((t) => t.achievement) },
              ]}
              formatValue={(v) => formatMetric(v, targetType)}
            />
          </div>

          <div className="chart-card">
            <h4 className="chart-title">Monthly Revenue</h4>
            <TrendChart
              categories={trend.map((t) => t.month)}
              series={[{ name: "Revenue", color: "var(--color-success)", values: trend.map((t) => t.revenue), area: true }]}
              formatValue={(v) => `₹${Number(v).toLocaleString()}`}
            />
          </div>

          <div className="chart-card">
            <h4 className="chart-title">Lead Conversion</h4>
            <GroupedBarChart
              categories={[row.full_name]}
              series={[
                { name: "Total Leads", color: "var(--color-primary-600)", values: [row.leads] },
                { name: "Converted Leads", color: "var(--color-success)", values: [row.converted] },
              ]}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}

function DetailStat({ label, value }) {
  return (
    <div className="stat-card-lite">
      <div>
        <p className="stat-card-lite-value">{value}</p>
        <p className="stat-card-lite-label">{label}</p>
      </div>
    </div>
  );
}
