import { useEffect, useState } from "react";
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
import { exportToCsv } from "../../utils/csv.js";
import { getTargetStatus } from "../../utils/targetStatus.js";
import "../company/CompanyList.css";

// This page is intentionally disconnected from the backend report APIs
// (reportsService.js / services/api/salesReportsApi.js) and shows static
// placeholder data instead — every tab below is seeded from the DUMMY_*
// constants, never fetched. Those service files are left untouched since
// EmployeeDetailModal.jsx and EmployeeTargetPerformance.jsx still call them
// for real data elsewhere.

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

// ── Dummy datasets (one per tab) ─────────────────────────────────────────

const DUMMY_COURSE_ROWS = [
  { course_name: "Sales Negotiation Mastery", category: "Sales Skills", assigned_count: 42, completed_count: 31, completion_rate: 74, average_score: 82, certificates_issued: 29 },
  { course_name: "Product Knowledge Bootcamp", category: "Product", assigned_count: 58, completed_count: 40, completion_rate: 69, average_score: 76, certificates_issued: 38 },
  { course_name: "Customer Objection Handling", category: "Sales Skills", assigned_count: 35, completed_count: 22, completion_rate: 63, average_score: 71, certificates_issued: 20 },
  { course_name: "CRM Essentials", category: "Tools", assigned_count: 50, completed_count: 45, completion_rate: 90, average_score: 88, certificates_issued: 45 },
];

const DUMMY_EMPLOYEE_ROWS = [
  { full_name: "Rahul Sharma", employee_code: "EMP-1001", assigned_count: 6, completed_count: 5, completion_rate: 83, certificates_count: 5 },
  { full_name: "Priya Menon", employee_code: "EMP-1002", assigned_count: 5, completed_count: 5, completion_rate: 100, certificates_count: 5 },
  { full_name: "Arjun Verma", employee_code: "EMP-1003", assigned_count: 7, completed_count: 3, completion_rate: 43, certificates_count: 3 },
  { full_name: "Sneha Iyer", employee_code: "EMP-1004", assigned_count: 4, completed_count: 4, completion_rate: 100, certificates_count: 4 },
];

const DUMMY_COMPLETION = {
  overall: { total_enrolled: 160, total_completed: 118, completion_rate: 74 },
  by_batch: [
    { batch_name: "Batch A – Onboarding", course: "Sales Negotiation Mastery", status: "Ongoing", enrolled_count: 30, completed_count: 21, completion_rate: 70 },
    { batch_name: "Batch B – Q3 Refresher", course: "Product Knowledge Bootcamp", status: "Completed", enrolled_count: 28, completed_count: 28, completion_rate: 100 },
    { batch_name: "Batch C – New Hires", course: "CRM Essentials", status: "Upcoming", enrolled_count: 20, completed_count: 0, completion_rate: 0 },
  ],
};

const DUMMY_SALES_PERFORMANCE = {
  overall: { total_employees: 24, total_verified_conversions: 96, total_verified_revenue: 4820000 },
  by_employee: [
    { full_name: "Rahul Sharma", assigned_leads: 120, verified_leads: 64, verified_sales: 22, verified_revenue: 980000 },
    { full_name: "Priya Menon", assigned_leads: 98, verified_leads: 58, verified_sales: 19, verified_revenue: 860000 },
    { full_name: "Arjun Verma", assigned_leads: 110, verified_leads: 41, verified_sales: 14, verified_revenue: 610000 },
  ],
};

const DUMMY_SALES_CONVERSION = {
  overall: { total_leads: 540, total_assigned: 480, total_verified: 210, conversion_rate: 39 },
  by_status: [
    { status: "New", count: 60 },
    { status: "Contacted", count: 120 },
    { status: "Interested", count: 90 },
    { status: "Converted", count: 240 },
    { status: "Verified", count: 210 },
    { status: "Closed Lost", count: 30 },
  ],
};

const DUMMY_SALES_TARGET_RAW = {
  overall: { employees_with_target: 24, avg_lead_achievement_pct: 68, avg_revenue_achievement_pct: 72 },
  by_employee: [
    {
      full_name: "Rahul Sharma", start_date: "2026-09-01", end_date: "2026-09-30",
      lead_target: 80, previous_leads: 10, platform_leads: 54, verified_leads: 64, lead_achievement_pct: 80,
      sales_target: 25, previous_sales: 3, platform_sales: 19, verified_sales: 22, sales_achievement_pct: 88,
      revenue_target: 1000000, previous_revenue: 120000, platform_revenue: 860000, verified_revenue: 980000,
    },
    {
      full_name: "Priya Menon", start_date: "2026-09-01", end_date: "2026-09-30",
      lead_target: 90, previous_leads: 8, platform_leads: 50, verified_leads: 58, lead_achievement_pct: 64,
      sales_target: 25, previous_sales: 2, platform_sales: 17, verified_sales: 19, sales_achievement_pct: 76,
      revenue_target: 1000000, previous_revenue: 90000, platform_revenue: 770000, verified_revenue: 860000,
    },
    {
      full_name: "Arjun Verma", start_date: "2026-09-01", end_date: "2026-09-30",
      lead_target: 70, previous_leads: 5, platform_leads: 36, verified_leads: 41, lead_achievement_pct: 59,
      sales_target: 20, previous_sales: 1, platform_sales: 13, verified_sales: 14, sales_achievement_pct: 70,
      revenue_target: 800000, previous_revenue: 40000, platform_revenue: 570000, verified_revenue: 610000,
    },
  ],
};

const DUMMY_SALES_INCENTIVE = {
  overall: { total_pending: 45000, total_approved: 120000, total_paid: 310000 },
  by_employee: [
    { full_name: "Rahul Sharma", period_month: "Sep 2026", verified_conversions_count: 22, verified_revenue: 980000, calculated_amount: 49000, status: "Paid" },
    { full_name: "Priya Menon", period_month: "Sep 2026", verified_conversions_count: 19, verified_revenue: 860000, calculated_amount: 43000, status: "Approved" },
    { full_name: "Arjun Verma", period_month: "Sep 2026", verified_conversions_count: 14, verified_revenue: 610000, calculated_amount: 30500, status: "Pending" },
  ],
};

const DUMMY_SALES_REVENUE = {
  overall: { total_verified_revenue: 2450000, total_verified_conversions: 55, avg_deal_size: 44545 },
  by_employee: [
    { full_name: "Rahul Sharma", verified_conversions: 22, verified_revenue: 980000 },
    { full_name: "Priya Menon", verified_conversions: 19, verified_revenue: 860000 },
    { full_name: "Arjun Verma", verified_conversions: 14, verified_revenue: 610000 },
  ],
};

function formatPeriod(row) {
  if (!row.start_date || !row.end_date) return "—";
  return `${row.start_date} – ${row.end_date}`;
}

// Same shape the live Target Achievement report used to compute after
// fetching — derived once from the dummy rows above instead.
const DUMMY_SALES_TARGET = {
  ...DUMMY_SALES_TARGET_RAW,
  by_employee: DUMMY_SALES_TARGET_RAW.by_employee.map((r) => {
    const status = getTargetStatus(r.lead_achievement_pct);
    return { ...r, period: formatPeriod(r), status_label: status.label, status_tone: status.tone };
  }),
};

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

  // Static placeholder data — never fetched, so there's nothing to load per
  // company/tab; switching either just changes which of these is displayed.
  const courseRows = DUMMY_COURSE_ROWS;
  const employeeRows = DUMMY_EMPLOYEE_ROWS;
  const completion = DUMMY_COMPLETION;
  const salesPerformance = DUMMY_SALES_PERFORMANCE;
  const salesConversion = DUMMY_SALES_CONVERSION;
  const salesTarget = DUMMY_SALES_TARGET;
  const salesIncentive = DUMMY_SALES_INCENTIVE;
  const salesRevenue = DUMMY_SALES_REVENUE;

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
    { key: "period", header: "Period" },
    { key: "lead_target", header: "Lead Target" },
    { key: "previous_leads", header: "Previous Leads" },
    { key: "platform_leads", header: "Platform Leads" },
    { key: "verified_leads", header: "Total Leads" },
    { key: "lead_achievement_pct", header: "Lead %", render: (r) => <ProgressBar value={Math.min(r.lead_achievement_pct, 100)} /> },
    { key: "sales_target", header: "Sales Target" },
    { key: "previous_sales", header: "Previous Sales" },
    { key: "platform_sales", header: "Platform Sales" },
    { key: "verified_sales", header: "Total Sales" },
    { key: "sales_achievement_pct", header: "Sales %", render: (r) => <ProgressBar value={Math.min(r.sales_achievement_pct, 100)} tone="success" /> },
    { key: "revenue_target", header: "Revenue Target", render: (r) => `₹${Number(r.revenue_target).toLocaleString()}` },
    { key: "previous_revenue", header: "Previous Revenue", render: (r) => `₹${Number(r.previous_revenue).toLocaleString()}` },
    { key: "platform_revenue", header: "Platform Revenue", render: (r) => `₹${Number(r.platform_revenue).toLocaleString()}` },
    { key: "verified_revenue", header: "Total Revenue", render: (r) => `₹${Number(r.verified_revenue).toLocaleString()}` },
    { key: "status_label", header: "Status", render: (r) => <Badge tone={r.status_tone}>{r.status_label}</Badge> },
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

            <button type="button" className="cl-btn" style={{ marginLeft: "auto" }} onClick={handleExport} disabled={!companyId}>
              <Icon name="download" size={15} />
              Export CSV
            </button>
          </div>

          {companiesError && <p className="cl-error">{companiesError}</p>}

          {!companyId ? (
            <p className="ep-empty-note">Select a company to view reports.</p>
          ) : activeTab === "completion" ? (
            <>
              <div className="cv-stats-grid" style={{ marginBottom: 16 }}>
                <StatCard icon="users" label="Total Enrolled" value={completion.overall?.total_enrolled ?? 0} tone="blue" />
                <StatCard icon="check" label="Total Completed" value={completion.overall?.total_completed ?? 0} tone="green" />
                <StatCard icon="pieChart" label="Overall Completion" value={`${completion.overall?.completion_rate ?? 0}%`} tone="purple" />
              </div>
              <DataTable columns={batchColumns} rows={completion.by_batch ?? []} isLoading={false} emptyMessage="No batches found for this company." />
            </>
          ) : activeTab === "courses" ? (
            <DataTable columns={courseColumns} rows={courseRows} isLoading={false} emptyMessage="No course assignments recorded for this company yet." />
          ) : activeTab === "employees" ? (
            <DataTable columns={employeeColumns} rows={employeeRows} isLoading={false} emptyMessage="No employees found for this company." />
          ) : activeTab === "sales-performance" ? (
            <>
              <div className="cv-stats-grid" style={{ marginBottom: 16 }}>
                <StatCard icon="users" label="Employees" value={salesPerformance.overall?.total_employees ?? 0} tone="blue" />
                <StatCard icon="check" label="Verified Conversions" value={salesPerformance.overall?.total_verified_conversions ?? 0} tone="green" />
                <StatCard icon="coin" label="Verified Revenue" value={`₹${Number(salesPerformance.overall?.total_verified_revenue ?? 0).toLocaleString()}`} tone="purple" />
              </div>
              <DataTable columns={salesPerformanceColumns} rows={salesPerformance.by_employee ?? []} isLoading={false} emptyMessage="No employees found for this company." />
            </>
          ) : activeTab === "sales-conversion" ? (
            <>
              <div className="cv-stats-grid" style={{ marginBottom: 16 }}>
                <StatCard icon="users" label="Total Leads" value={salesConversion.overall?.total_leads ?? 0} tone="blue" />
                <StatCard icon="flag" label="Assigned" value={salesConversion.overall?.total_assigned ?? 0} tone="purple" />
                <StatCard icon="check" label="Verified" value={salesConversion.overall?.total_verified ?? 0} tone="green" />
                <StatCard icon="pieChart" label="Conversion Rate" value={`${salesConversion.overall?.conversion_rate ?? 0}%`} tone="orange" />
              </div>
              <DataTable columns={salesConversionColumns} rows={salesConversion.by_status ?? []} isLoading={false} emptyMessage="No leads found for this company." />
            </>
          ) : activeTab === "sales-target" ? (
            <>
              <div className="cv-stats-grid" style={{ marginBottom: 16 }}>
                <StatCard icon="users" label="Employees with Target" value={salesTarget.overall?.employees_with_target ?? 0} tone="blue" />
                <StatCard icon="flag" label="Avg. Lead Achievement" value={`${salesTarget.overall?.avg_lead_achievement_pct ?? 0}%`} tone="green" />
                <StatCard icon="coin" label="Avg. Revenue Achievement" value={`${salesTarget.overall?.avg_revenue_achievement_pct ?? 0}%`} tone="purple" />
              </div>
              <DataTable columns={salesTargetColumns} rows={salesTarget.by_employee ?? []} isLoading={false} emptyMessage="No monthly targets set for this company." />
            </>
          ) : activeTab === "sales-incentive" ? (
            <>
              <div className="cv-stats-grid" style={{ marginBottom: 16 }}>
                <StatCard icon="clock" label="Pending" value={`₹${Number(salesIncentive.overall?.total_pending ?? 0).toLocaleString()}`} tone="orange" />
                <StatCard icon="check" label="Approved" value={`₹${Number(salesIncentive.overall?.total_approved ?? 0).toLocaleString()}`} tone="blue" />
                <StatCard icon="coin" label="Paid" value={`₹${Number(salesIncentive.overall?.total_paid ?? 0).toLocaleString()}`} tone="green" />
              </div>
              <DataTable columns={salesIncentiveColumns} rows={salesIncentive.by_employee ?? []} isLoading={false} emptyMessage="No incentive records for this company." />
            </>
          ) : (
            <>
              <div className="cv-stats-grid" style={{ marginBottom: 16 }}>
                <StatCard icon="coin" label="Total Verified Revenue" value={`₹${Number(salesRevenue.overall?.total_verified_revenue ?? 0).toLocaleString()}`} tone="green" />
                <StatCard icon="check" label="Verified Conversions" value={salesRevenue.overall?.total_verified_conversions ?? 0} tone="blue" />
                <StatCard icon="pieChart" label="Avg. Deal Size" value={`₹${Number(salesRevenue.overall?.avg_deal_size ?? 0).toLocaleString()}`} tone="purple" />
              </div>
              <DataTable columns={salesRevenueColumns} rows={salesRevenue.by_employee ?? []} isLoading={false} emptyMessage="No verified revenue for this company yet." />
            </>
          )}
        </div>
      </div>
    </>
  );
}
