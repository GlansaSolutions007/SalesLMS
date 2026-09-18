import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Icon from "../../components/Icon.jsx";
import Badge from "../../components/Badge.jsx";
import DataTable from "../../components/DataTable.jsx";
import Pagination from "../../components/Pagination.jsx";
import StatCard from "../../components/StatCard.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import FormField from "../../components/FormField.jsx";
import GroupedBarChart from "../../components/charts/GroupedBarChart.jsx";
import HorizontalBarChart from "../../components/charts/HorizontalBarChart.jsx";
import TrendChart from "../../components/charts/TrendChart.jsx";
import DonutChart from "../../components/charts/DonutChart.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { exportToCsv } from "../../utils/csv.js";
import { PERFORMANCE_STATUS_OPTIONS, statusTone, statusColor } from "./performanceStatus.js";
import { formatMetric } from "./formatMetric.js";
import EmployeeDetailModal from "./EmployeeDetailModal.jsx";
import { DUMMY_COMPANIES, DUMMY_EMPLOYEES, DUMMY_REPORT } from "./dummyReport.js";
import "../company/CompanyList.css";
import "../company/CompanyView.css";
import "./EmployeeTargetPerformance.css";

const TARGET_TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "sales", label: "Sales Target" },
  { value: "revenue", label: "Revenue Target" },
  { value: "lead", label: "Lead Target" },
];

const PERIOD_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom Date Range" },
];

const QUARTER_OPTIONS = [
  { value: "1", label: "Q1 (Jan – Mar)" },
  { value: "2", label: "Q2 (Apr – Jun)" },
  { value: "3", label: "Q3 (Jul – Sep)" },
  { value: "4", label: "Q4 (Oct – Dec)" },
];

const PER_PAGE = 10;

function defaultFilters() {
  const now = new Date();
  return {
    employee_id: "",
    target_type: "all",
    period: "monthly",
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    quarter: String(Math.floor(now.getMonth() / 3) + 1),
    year: String(now.getFullYear()),
    date_from: "",
    date_to: "",
    status: "all",
  };
}

export default function EmployeeTargetPerformance() {
  const { toggleCollapsed } = useOutletContext();
  const { roleName, user } = useAuth();
  const isSuperAdmin = roleName === "Super Admin";

  const companies = DUMMY_COMPANIES;
  const [companyId, setCompanyId] = useState(() => (isSuperAdmin ? "" : String(user?.company?.id ?? "")));

  useEffect(() => {
    if (isSuperAdmin && !companyId && companies.length > 0) setCompanyId(String(companies[0].id));
  }, [isSuperAdmin, companies, companyId]);

  const employees = DUMMY_EMPLOYEES;

  // "pending" = what the filter form currently shows; "applied" = what was
  // last submitted via "Apply Filters". Filters stay interactive but the
  // report itself is the fixed dummy dataset above — see this file's top
  // note on the UI-only scope for this module.
  const [pending, setPending] = useState(defaultFilters);
  const [applied, setApplied] = useState(defaultFilters);

  const report = DUMMY_REPORT;
  const loading = false;
  const error = "";

  function updatePending(field, value) {
    setPending((prev) => ({ ...prev, [field]: value }));
  }

  function handleApply() {
    setApplied(pending);
  }

  function handleReset() {
    const fresh = defaultFilters();
    setPending(fresh);
    setApplied(fresh);
  }

  // ── Table: client-side search/sort/pagination over the (unpaginated)
  // by_employee list the backend already filtered by every other criterion.
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "achievement_pct", dir: "desc" });
  const [page, setPage] = useState(1);
  const [detailEmployeeId, setDetailEmployeeId] = useState(null);

  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exporting = false;
  const [exportError, setExportError] = useState("");
  const exportMenuRef = useRef(null);

  useEffect(() => {
    if (!exportMenuOpen) return undefined;
    function handleClickOutside(e) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) setExportMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [exportMenuOpen]);

  // Design-only — generates the file client-side from the dummy report
  // instead of calling the backend export endpoint. Both formats produce a
  // CSV (no Excel-writing library in this project); Excel can still open a
  // .csv file directly.
  function handleExport() {
    if (exporting) return;
    setExportMenuOpen(false);
    setExportError("");
    exportToCsv(
      "employee-target-performance.csv",
      report.by_employee.map((r) => ({
        full_name: r.full_name,
        team_name: r.team_name ?? "",
        target: r.target,
        achievement: r.achievement,
        achievement_pct: r.achievement_pct,
        leads: r.leads,
        converted: r.converted,
        conversion_pct: r.conversion_pct,
        revenue: r.revenue,
        status_label: r.status_label,
      })),
      [
        { key: "full_name", header: "Employee" },
        { key: "team_name", header: "Team" },
        { key: "target", header: "Target" },
        { key: "achievement", header: "Achievement" },
        { key: "achievement_pct", header: "Achievement %" },
        { key: "leads", header: "Leads" },
        { key: "converted", header: "Converted" },
        { key: "conversion_pct", header: "Conversion %" },
        { key: "revenue", header: "Revenue" },
        { key: "status_label", header: "Status" },
      ]
    );
  }

  useEffect(() => {
    setPage(1);
  }, [search, applied]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = term
      ? report.by_employee.filter((r) => r.full_name.toLowerCase().includes(term) || (r.team_name ?? "").toLowerCase().includes(term))
      : report.by_employee;

    return [...rows].sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      const av = a[sort.key];
      const bv = b[sort.key];
      if (typeof av === "string") return av.localeCompare(bv) * dir;
      return ((av ?? 0) - (bv ?? 0)) * dir;
    });
  }, [report.by_employee, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PER_PAGE));
  const pageRows = filteredRows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function toggleSort(key) {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));
  }

  function sortIndicator(key) {
    if (sort.key !== key) return "";
    return sort.dir === "asc" ? " ▲" : " ▼";
  }

  const targetType = applied.target_type;
  const chartRows = report.by_employee.slice(0, 10);
  const rankedRows = [...report.by_employee].sort((a, b) => b.achievement_pct - a.achievement_pct).slice(0, 5);

  const columns = [
    { key: "full_name", header: <button type="button" className="link-btn" onClick={() => toggleSort("full_name")}>Employee{sortIndicator("full_name")}</button>, render: (r) => <strong>{r.full_name}</strong> },
    { key: "team_name", header: "Team", render: (r) => r.team_name ?? "—" },
    { key: "target", header: <button type="button" className="link-btn" onClick={() => toggleSort("target")}>Target{sortIndicator("target")}</button>, render: (r) => formatMetric(r.target, targetType) },
    { key: "achievement", header: "Achieved", render: (r) => formatMetric(r.achievement, targetType) },
    { key: "achievement_pct", header: <button type="button" className="link-btn" onClick={() => toggleSort("achievement_pct")}>Achievement %{sortIndicator("achievement_pct")}</button>, render: (r) => `${r.achievement_pct}%` },
    { key: "leads", header: "Leads" },
    { key: "converted", header: "Converted" },
    { key: "conversion_pct", header: "Conversion %", render: (r) => `${r.conversion_pct}%` },
    { key: "revenue", header: <button type="button" className="link-btn" onClick={() => toggleSort("revenue")}>Revenue{sortIndicator("revenue")}</button>, render: (r) => `₹${Number(r.revenue).toLocaleString()}` },
    { key: "status", header: "Status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status_label}</Badge> },
    {
      key: "actions", header: "", render: (r) => (
        <button type="button" className="cl-btn" onClick={() => setDetailEmployeeId(r.employee_id)}>View Details</button>
      ),
    },
  ];

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." />
      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Employee Target Performance</h1>
            <p style={{ margin: "4px 0 0", color: "var(--color-muted)", fontSize: 13 }}>
              Track employee-wise target achievement, sales performance, leads and revenue.
            </p>
            <Breadcrumb current="Employee Target Performance" />
          </div>
        </div>

        <div className="panel cl-panel">
          {isSuperAdmin && (
            <div style={{ padding: "18px 22px 0" }}>
              <select className="dt-select" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                {companies.length === 0 && <option value="">No companies found</option>}
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="etp-filter-grid">
            <FormField label="Employee">
              <select value={pending.employee_id} onChange={(e) => updatePending("employee_id", e.target.value)}>
                <option value="">All Employees</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.full_name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Target Type">
              <select value={pending.target_type} onChange={(e) => updatePending("target_type", e.target.value)}>
                {TARGET_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>

            <FormField label="Period">
              <select value={pending.period} onChange={(e) => updatePending("period", e.target.value)}>
                {PERIOD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>

            {pending.period === "monthly" && (
              <FormField label="Month">
                <input type="month" value={pending.month} onChange={(e) => updatePending("month", e.target.value)} />
              </FormField>
            )}

            {pending.period === "quarterly" && (
              <>
                <FormField label="Quarter">
                  <select value={pending.quarter} onChange={(e) => updatePending("quarter", e.target.value)}>
                    {QUARTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </FormField>
                <FormField label="Year">
                  <input type="number" value={pending.year} onChange={(e) => updatePending("year", e.target.value)} />
                </FormField>
              </>
            )}

            {pending.period === "yearly" && (
              <FormField label="Year">
                <input type="number" value={pending.year} onChange={(e) => updatePending("year", e.target.value)} />
              </FormField>
            )}

            {pending.period === "custom" && (
              <>
                <FormField label="From">
                  <input type="date" value={pending.date_from} onChange={(e) => updatePending("date_from", e.target.value)} />
                </FormField>
                <FormField label="To">
                  <input type="date" value={pending.date_to} min={pending.date_from} onChange={(e) => updatePending("date_to", e.target.value)} />
                </FormField>
              </>
            )}

            <FormField label="Performance Status">
              <select value={pending.status} onChange={(e) => updatePending("status", e.target.value)}>
                {PERFORMANCE_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>

            <div className="etp-filter-actions">
              <button type="button" className="dash-primary-btn" onClick={handleApply}>Apply Filters</button>
              <button type="button" className="cl-btn" onClick={handleReset}>Reset</button>
            </div>
          </div>

          {error && <p className="cl-error">{error}</p>}

          {!companyId ? (
            <p className="ep-empty-note">Select a company to view this report.</p>
          ) : loading ? (
            <div style={{ padding: 22 }}><Skeleton height={220} /></div>
          ) : (
            <>
              <div className="cv-stats-grid" style={{ padding: "0 22px 20px" }}>
                <StatCard icon="flag" label="Total Target" value={formatMetric(report.kpis.total_target, targetType)} tone="blue" />
                <StatCard
                  icon="check"
                  label="Total Achievement"
                  value={formatMetric(report.kpis.total_achievement, targetType)}
                  tone="green"
                  sub={`${(report.kpis.achievement_pct ?? 0) >= 100 ? "↑" : "↓"} ${report.kpis.achievement_pct ?? 0}% of target`}
                />
                {/* <StatCard icon="pieChart" label="Achievement %" value={`${report.kpis.achievement_pct ?? 0}%`} tone="purple" /> */}
                {/* <StatCard icon="coin" label="Total Revenue" value={`₹${Number(report.kpis.total_revenue ?? 0).toLocaleString()}`} tone="purple" /> */}
                <StatCard icon="users" label="Total Leads" value={report.kpis.total_leads ?? 0} tone="orange" />
                <StatCard icon="check" label="Converted Leads" value={report.kpis.converted_leads ?? 0} tone="green" />
                {/* <StatCard
                  icon="pieChart"
                  label="Conversion Rate"
                  value={`${report.kpis.conversion_rate ?? 0}%`}
                  tone="blue"
                  sub={`${report.kpis.converted_leads ?? 0} of ${report.kpis.total_leads ?? 0} leads converted`}
                /> */}
              </div>

              <div className="etp-charts-stack" style={{ padding: "0 22px" }}>
                <div className="panel etp-chart-panel etp-chart-main">
                  <h3 className="chart-title">Target vs Achievement</h3>
                  <p className="chart-subtitle">Compare employee target allocation with actual achievement.</p>
                  <GroupedBarChart
                    categories={chartRows.map((r) => r.full_name)}
                    series={[
                      { name: "Target", color: "var(--color-primary-600)", values: chartRows.map((r) => r.target) },
                      { name: "Achieved", color: "var(--color-accent)", values: chartRows.map((r) => r.achievement) },
                    ]}
                    formatValue={(v) => formatMetric(v, targetType)}
                    showValues
                  />
                </div>

                {/* <div className="panel etp-chart-panel">
                  <h3 className="chart-title">Achievement Percentage</h3>
                  <p className="chart-subtitle">Colored by performance status.</p>
                  <HorizontalBarChart
                    items={[...chartRows].sort((a, b) => b.achievement_pct - a.achievement_pct).map((r) => ({
                      key: r.employee_id, label: r.full_name, value: r.achievement_pct, color: statusColor(r.status),
                    }))}
                    formatValue={(v) => `${v}%`}
                    maxValue={Math.max(100, ...chartRows.map((r) => r.achievement_pct))}
                  />
                </div>

                <div className="panel etp-chart-panel">
                  <h3 className="chart-title">Monthly Target vs Achievement</h3>
                  <p className="chart-subtitle">Track target and actual performance over time.</p>
                  <TrendChart
                    categories={report.monthly_trend.map((t) => t.month)}
                    series={[
                      { name: "Target", color: "var(--color-primary-600)", values: report.monthly_trend.map((t) => t.target) },
                      { name: "Achievement", color: "var(--color-accent)", values: report.monthly_trend.map((t) => t.achievement) },
                    ]}
                    formatValue={(v) => formatMetric(v, targetType)}
                  />
                </div> */}

                <div className="etp-charts-grid">
                  <div className="panel etp-chart-panel">
                    <h3 className="chart-title">Leads vs Converted Leads</h3>
                    <p className="chart-subtitle">By employee, for the selected period.</p>
                    <GroupedBarChart
                      categories={chartRows.map((r) => r.full_name)}
                      series={[
                        { name: "Total Leads", color: "var(--color-primary-600)", values: chartRows.map((r) => r.leads) },
                        { name: "Converted Leads", color: "var(--color-success)", values: chartRows.map((r) => r.converted) },
                      ]}
                      showValues
                    />
                  </div>

                  <div className="panel etp-chart-panel">
                    <h3 className="chart-title">Revenue Performance</h3>
                    <p className="chart-subtitle">Monthly revenue trend.</p>
                    <TrendChart
                      categories={report.monthly_trend.map((t) => t.month)}
                      series={[{ name: "Revenue", color: "var(--color-success)", values: report.monthly_trend.map((t) => t.revenue), area: true }]}
                      formatValue={(v) => `₹${Number(v).toLocaleString()}`}
                      showValues
                    />
                  </div>
                </div>

                <div className="etp-charts-grid">
                  <div className="panel etp-chart-panel">
                    <h3 className="chart-title">Performance Distribution</h3>
                    <p className="chart-subtitle">Employee count by performance status.</p>
                    <DonutChart
                      centerLabel="Employees"
                      segments={[
                        { label: "Exceeded", value: report.distribution.exceeded ?? 0, color: statusColor("exceeded") },
                        { label: "On Track", value: report.distribution.on_track ?? 0, color: statusColor("on_track") },
                        { label: "At Risk", value: report.distribution.at_risk ?? 0, color: statusColor("at_risk") },
                        { label: "Below Target", value: report.distribution.below_target ?? 0, color: statusColor("below_target") },
                      ]}
                    />
                  </div>

                  <div className="panel etp-chart-panel">
                    <h3 className="chart-title">Employee Achievement</h3>
                    <p className="chart-subtitle">Ranked by Achievement %.</p>
                    <HorizontalBarChart
                      showRank
                      items={rankedRows.map((r) => ({ key: r.employee_id, label: r.full_name, value: r.achievement_pct, color: statusColor(r.status) }))}
                      formatValue={(v) => `${v}%`}
                      maxValue={Math.max(100, ...rankedRows.map((r) => r.achievement_pct))}
                    />
                  </div>
                </div>
              </div>

              <div className="panel-head with-border">
                <h3>Employee Performance</h3>
                <div className="etp-export" ref={exportMenuRef}>
                  <button
                    type="button"
                    className="cl-btn"
                    onClick={() => setExportMenuOpen((open) => !open)}
                    disabled={exporting}
                  >
                    <Icon name="download" size={15} />
                    {exporting ? "Exporting…" : "Export"}
                    <Icon name="chevronDown" size={13} />
                  </button>
                  {exportMenuOpen && (
                    <div className="etp-export-menu">
                      <button type="button" onClick={() => handleExport("xlsx")}>Export to Excel</button>
                      <button type="button" onClick={() => handleExport("csv")}>Export to CSV</button>
                    </div>
                  )}
                </div>
              </div>

              {exportError && <p className="cl-error" style={{ margin: "0 22px" }}>{exportError}</p>}

              <div className="etp-table-toolbar">
                <div className="cl-search" style={{ width: 280 }}>
                  <Icon name="search" size={16} />
                  <input
                    type="text"
                    placeholder="Search employee or team..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--color-muted)" }}>
                  {filteredRows.length} employee{filteredRows.length === 1 ? "" : "s"}
                </span>
              </div>

              <DataTable columns={columns} rows={pageRows} idField="employee_id" emptyMessage="No employees match the selected filters." />

              {filteredRows.length > 0 && (
                <div className="cl-footer">
                  <p>Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filteredRows.length)} of {filteredRows.length}</p>
                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {detailEmployeeId && (
        <EmployeeDetailModal
          companyId={companyId}
          employeeId={detailEmployeeId}
          targetType={targetType}
          filters={applied}
          onClose={() => setDetailEmployeeId(null)}
        />
      )}
    </>
  );
}
