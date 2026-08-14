import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Icon from "../../components/Icon.jsx";
import Badge from "../../components/Badge.jsx";
import DataTable from "../../components/DataTable.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";
import StatCard from "../../components/StatCard.jsx";
import useCompanyOptions from "../company/useCompanyOptions.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { getCourseReport, getEmployeeReport, getCompletionReport } from "../../services/reportsService.js";
import {
  getEmployeePerformanceReport,
  getLeadConversionReport,
  getTargetAchievementReport,
  getIncentiveReport,
  getRevenueReport,
} from "../../services/api/salesReportsApi.js";
import { exportToCsv } from "../../utils/csv.js";
import "../company/CompanyList.css";

const TABS = [
  { key: "courses", label: "Course Report" },
  { key: "employees", label: "Employee Report" },
  { key: "completion", label: "Completion Report" },
  { key: "sales-performance", label: "Employee Performance" },
  { key: "sales-conversion", label: "Lead Conversion" },
  { key: "sales-target", label: "Target Achievement" },
  { key: "sales-incentive", label: "Monthly Incentive" },
  { key: "sales-revenue", label: "Revenue" },
];

const BATCH_STATUS_TONE = { Upcoming: "blue", Ongoing: "orange", Completed: "green", Cancelled: "red" };

function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function Reports() {
  const { toggleCollapsed } = useOutletContext();
  const { roleName, user } = useAuth();
  const isSuperAdmin = roleName === "Super Admin";

  const { options: companies, isLoading: companiesLoading, error: companiesError } = useCompanyOptions(isSuperAdmin);
  const [companyId, setCompanyId] = useState(() => (isSuperAdmin ? "" : String(user?.company?.id ?? "")));

  useEffect(() => {
    if (isSuperAdmin && !companyId && companies.length > 0) setCompanyId(String(companies[0].id));
  }, [isSuperAdmin, companies, companyId]);

  const [activeTab, setActiveTab] = useState("courses");

  const [courseRows, setCourseRows] = useState([]);
  const [employeeRows, setEmployeeRows] = useState([]);
  const [completion, setCompletion] = useState({ overall: {}, by_batch: [] });
  const [salesPerformance, setSalesPerformance] = useState({ overall: {}, by_employee: [] });
  const [salesConversion, setSalesConversion] = useState({ overall: {}, by_status: [] });
  const [salesTarget, setSalesTarget] = useState({ overall: {}, by_employee: [] });
  const [salesIncentive, setSalesIncentive] = useState({ overall: {}, by_employee: [] });
  const [salesRevenue, setSalesRevenue] = useState({ overall: {}, by_employee: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    const request =
      activeTab === "courses" ? getCourseReport(companyId).then(setCourseRows) :
      activeTab === "employees" ? getEmployeeReport(companyId).then(setEmployeeRows) :
      activeTab === "completion" ? getCompletionReport(companyId).then(setCompletion) :
      activeTab === "sales-performance" ? getEmployeePerformanceReport(companyId).then(setSalesPerformance) :
      activeTab === "sales-conversion" ? getLeadConversionReport(companyId).then(setSalesConversion) :
      activeTab === "sales-target" ? getTargetAchievementReport(companyId).then(setSalesTarget) :
      activeTab === "sales-incentive" ? getIncentiveReport(companyId).then(setSalesIncentive) :
      getRevenueReport(companyId).then(setSalesRevenue);

    request.catch((err) => setError(err.message ?? "Could not load this report.")).finally(() => setLoading(false));
  }, [companyId, activeTab]);

  useEffect(() => { load(); }, [load]);

  const courseColumns = [
    { key: "course_name", header: "Course", render: (r) => <strong>{r.course_name}</strong> },
    { key: "category", header: "Category", render: (r) => r.category || "—" },
    { key: "assigned_count", header: "Assigned" },
    { key: "completed_count", header: "Completed" },
    { key: "completion_rate", header: "Completion", render: (r) => <ProgressBar value={r.completion_rate} /> },
    { key: "average_score", header: "Avg. Assessment Score", render: (r) => (r.average_score != null ? `${r.average_score}%` : "—") },
    { key: "certificates_issued", header: "Certificates Issued" },
  ];

  const employeeColumns = [
    {
      key: "full_name",
      header: "Employee",
      render: (r) => (
        <div className="emp-cell">
          <span className="emp-avatar">{initials(r.full_name)}</span>
          <div>
            <p className="emp-name">{r.full_name}</p>
            <p className="emp-code">{r.employee_code}</p>
          </div>
        </div>
      ),
    },
    { key: "assigned_count", header: "Assigned" },
    { key: "completed_count", header: "Completed" },
    { key: "completion_rate", header: "Completion", render: (r) => <ProgressBar value={r.completion_rate} /> },
    { key: "certificates_count", header: "Certificates" },
  ];

  const batchColumns = [
    { key: "batch_name", header: "Batch", render: (r) => <strong>{r.batch_name}</strong> },
    { key: "course", header: "Course", render: (r) => r.course || "—" },
    { key: "status", header: "Status", render: (r) => <Badge tone={BATCH_STATUS_TONE[r.status] ?? "gray"}>{r.status}</Badge> },
    { key: "enrolled_count", header: "Enrolled" },
    { key: "completed_count", header: "Completed" },
    { key: "completion_rate", header: "Completion", render: (r) => <ProgressBar value={r.completion_rate} /> },
  ];

  const salesPerformanceColumns = [
    { key: "full_name", header: "Employee" },
    { key: "assigned_leads", header: "Assigned Leads" },
    { key: "verified_leads", header: "Verified Leads" },
    { key: "verified_sales", header: "Verified Sales" },
    { key: "verified_revenue", header: "Verified Revenue", render: (r) => `₹${Number(r.verified_revenue).toLocaleString()}` },
  ];

  const salesConversionColumns = [
    { key: "status", header: "Status" },
    { key: "count", header: "Count" },
  ];

  const salesTargetColumns = [
    { key: "full_name", header: "Employee" },
    { key: "lead_target", header: "Lead Target" },
    { key: "verified_leads", header: "Verified Leads" },
    { key: "lead_achievement_pct", header: "Lead %", render: (r) => <ProgressBar value={Math.min(r.lead_achievement_pct, 100)} /> },
    { key: "sales_target", header: "Sales Target" },
    { key: "verified_sales", header: "Verified Sales" },
    { key: "sales_achievement_pct", header: "Sales %", render: (r) => <ProgressBar value={Math.min(r.sales_achievement_pct, 100)} tone="success" /> },
    { key: "revenue_target", header: "Revenue Target", render: (r) => `₹${Number(r.revenue_target).toLocaleString()}` },
    { key: "verified_revenue", header: "Verified Revenue", render: (r) => `₹${Number(r.verified_revenue).toLocaleString()}` },
  ];

  const salesIncentiveColumns = [
    { key: "full_name", header: "Employee" },
    { key: "period_month", header: "Period" },
    { key: "verified_conversions_count", header: "Verified Conversions" },
    { key: "verified_revenue", header: "Verified Revenue", render: (r) => `₹${Number(r.verified_revenue).toLocaleString()}` },
    { key: "calculated_amount", header: "Incentive Amount", render: (r) => `₹${Number(r.calculated_amount).toLocaleString()}` },
    { key: "status", header: "Status", render: (r) => <Badge tone={r.status === "Paid" ? "green" : r.status === "Approved" ? "blue" : "orange"}>{r.status}</Badge> },
  ];

  const salesRevenueColumns = [
    { key: "full_name", header: "Employee" },
    { key: "verified_conversions", header: "Verified Conversions" },
    { key: "verified_revenue", header: "Verified Revenue", render: (r) => `₹${Number(r.verified_revenue).toLocaleString()}` },
  ];

  function handleExport() {
    if (activeTab === "courses") exportToCsv("course-report.csv", courseRows, courseColumns.map((c) => ({ key: c.key, header: c.header })));
    else if (activeTab === "employees") exportToCsv("employee-report.csv", employeeRows, employeeColumns.map((c) => ({ key: c.key, header: c.header })));
    else if (activeTab === "completion") exportToCsv("completion-report.csv", completion.by_batch, batchColumns.map((c) => ({ key: c.key, header: c.header })));
    else if (activeTab === "sales-performance") exportToCsv("employee-performance-report.csv", salesPerformance.by_employee, salesPerformanceColumns.map((c) => ({ key: c.key, header: c.header })));
    else if (activeTab === "sales-conversion") exportToCsv("lead-conversion-report.csv", salesConversion.by_status, salesConversionColumns.map((c) => ({ key: c.key, header: c.header })));
    else if (activeTab === "sales-target") exportToCsv("target-achievement-report.csv", salesTarget.by_employee, salesTargetColumns.map((c) => ({ key: c.key, header: c.header })));
    else if (activeTab === "sales-incentive") exportToCsv("incentive-report.csv", salesIncentive.by_employee, salesIncentiveColumns.map((c) => ({ key: c.key, header: c.header })));
    else exportToCsv("revenue-report.csv", salesRevenue.by_employee, salesRevenueColumns.map((c) => ({ key: c.key, header: c.header })));
  }

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Reports</h1>
            <Breadcrumb current="Reports" />
          </div>
        </div>

        <div className="panel cl-panel">
          <div className="dt-toolbar" style={{ paddingBottom: 0 }}>
            {isSuperAdmin && (
              <select
                className="dt-select"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                disabled={companiesLoading || companies.length === 0}
                aria-label="Select company"
              >
                {companies.length === 0 && <option value="">No companies found</option>}
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </select>
            )}

            <div className="cl-tabs" style={{ marginLeft: isSuperAdmin ? 16 : 0 }}>
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`cl-tab${activeTab === tab.key ? " is-active" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button type="button" className="cl-btn" style={{ marginLeft: "auto" }} onClick={handleExport} disabled={!companyId || loading}>
              <Icon name="download" size={15} />
              Export CSV
            </button>
          </div>

          {(error || companiesError) && <p className="cl-error">{error || companiesError}</p>}

          {!companyId ? (
            <p className="ep-empty-note">Select a company to view reports.</p>
          ) : activeTab === "completion" ? (
            <>
              <div className="cv-stats-grid" style={{ marginBottom: 16 }}>
                <StatCard icon="users" label="Total Enrolled" value={completion.overall?.total_enrolled ?? 0} tone="blue" />
                <StatCard icon="check" label="Total Completed" value={completion.overall?.total_completed ?? 0} tone="green" />
                <StatCard icon="pieChart" label="Overall Completion" value={`${completion.overall?.completion_rate ?? 0}%`} tone="purple" />
              </div>
              <DataTable columns={batchColumns} rows={completion.by_batch ?? []} isLoading={loading} emptyMessage="No batches found for this company." />
            </>
          ) : activeTab === "courses" ? (
            <DataTable columns={courseColumns} rows={courseRows} isLoading={loading} emptyMessage="No course assignments recorded for this company yet." />
          ) : activeTab === "employees" ? (
            <DataTable columns={employeeColumns} rows={employeeRows} isLoading={loading} emptyMessage="No employees found for this company." />
          ) : activeTab === "sales-performance" ? (
            <>
              <div className="cv-stats-grid" style={{ marginBottom: 16 }}>
                <StatCard icon="users" label="Employees" value={salesPerformance.overall?.total_employees ?? 0} tone="blue" />
                <StatCard icon="check" label="Verified Conversions" value={salesPerformance.overall?.total_verified_conversions ?? 0} tone="green" />
                <StatCard icon="coin" label="Verified Revenue" value={`₹${Number(salesPerformance.overall?.total_verified_revenue ?? 0).toLocaleString()}`} tone="purple" />
              </div>
              <DataTable columns={salesPerformanceColumns} rows={salesPerformance.by_employee ?? []} isLoading={loading} emptyMessage="No employees found for this company." />
            </>
          ) : activeTab === "sales-conversion" ? (
            <>
              <div className="cv-stats-grid" style={{ marginBottom: 16 }}>
                <StatCard icon="users" label="Total Leads" value={salesConversion.overall?.total_leads ?? 0} tone="blue" />
                <StatCard icon="flag" label="Assigned" value={salesConversion.overall?.total_assigned ?? 0} tone="purple" />
                <StatCard icon="check" label="Verified" value={salesConversion.overall?.total_verified ?? 0} tone="green" />
                <StatCard icon="pieChart" label="Conversion Rate" value={`${salesConversion.overall?.conversion_rate ?? 0}%`} tone="orange" />
              </div>
              <DataTable columns={salesConversionColumns} rows={salesConversion.by_status ?? []} isLoading={loading} emptyMessage="No leads found for this company." />
            </>
          ) : activeTab === "sales-target" ? (
            <>
              <div className="cv-stats-grid" style={{ marginBottom: 16 }}>
                <StatCard icon="users" label="Employees with Target" value={salesTarget.overall?.employees_with_target ?? 0} tone="blue" />
                <StatCard icon="flag" label="Avg. Lead Achievement" value={`${salesTarget.overall?.avg_lead_achievement_pct ?? 0}%`} tone="green" />
                <StatCard icon="coin" label="Avg. Revenue Achievement" value={`${salesTarget.overall?.avg_revenue_achievement_pct ?? 0}%`} tone="purple" />
              </div>
              <DataTable columns={salesTargetColumns} rows={salesTarget.by_employee ?? []} isLoading={loading} emptyMessage="No monthly targets set for this company." />
            </>
          ) : activeTab === "sales-incentive" ? (
            <>
              <div className="cv-stats-grid" style={{ marginBottom: 16 }}>
                <StatCard icon="clock" label="Pending" value={`₹${Number(salesIncentive.overall?.total_pending ?? 0).toLocaleString()}`} tone="orange" />
                <StatCard icon="check" label="Approved" value={`₹${Number(salesIncentive.overall?.total_approved ?? 0).toLocaleString()}`} tone="blue" />
                <StatCard icon="coin" label="Paid" value={`₹${Number(salesIncentive.overall?.total_paid ?? 0).toLocaleString()}`} tone="green" />
              </div>
              <DataTable columns={salesIncentiveColumns} rows={salesIncentive.by_employee ?? []} isLoading={loading} emptyMessage="No incentive records for this company." />
            </>
          ) : (
            <>
              <div className="cv-stats-grid" style={{ marginBottom: 16 }}>
                <StatCard icon="coin" label="Total Verified Revenue" value={`₹${Number(salesRevenue.overall?.total_verified_revenue ?? 0).toLocaleString()}`} tone="green" />
                <StatCard icon="check" label="Verified Conversions" value={salesRevenue.overall?.total_verified_conversions ?? 0} tone="blue" />
                <StatCard icon="pieChart" label="Avg. Deal Size" value={`₹${Number(salesRevenue.overall?.avg_deal_size ?? 0).toLocaleString()}`} tone="purple" />
              </div>
              <DataTable columns={salesRevenueColumns} rows={salesRevenue.by_employee ?? []} isLoading={loading} emptyMessage="No verified revenue for this company yet." />
            </>
          )}
        </div>
      </div>
    </>
  );
}
