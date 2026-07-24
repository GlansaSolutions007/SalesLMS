import Badge from "../../components/Badge.jsx";
import CrudPage from "../../components/CrudPage.jsx";
import CompanyTabs from "./CompanyTabs.jsx";
import { COMPANIES, INDUSTRIES, SUBSCRIPTION_PLANS } from "./companyData.js";

const STATUS_TONE = { Active: "green", Suspended: "orange", Inactive: "gray" };

const PLAN_TONE = { Enterprise: "purple", Professional: "blue", Standard: "green", Basic: "gray" };

const COLUMNS = [
  {
    key: "name",
    header: "Company",
    render: (r) => (
      <div className="emp-cell">
        <span className="emp-avatar">{r.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}</span>
        <div>
          <p className="emp-name">{r.name}</p>
          <p className="emp-code">{r.code}</p>
        </div>
      </div>
    ),
  },
  { key: "email", header: "Email" },
  { key: "industry", header: "Industry" },
  {
    key: "employees",
    header: "Employees",
    render: (r) => <span className="cl-numeric">{r.employees.toLocaleString()}</span>,
  },
  {
    key: "plan",
    header: "Plan",
    render: (r) => <Badge tone={PLAN_TONE[r.plan]}>{r.plan}</Badge>,
  },
  {
    key: "subscription",
    header: "Subscription",
    render: (r) => <span style={{ fontSize: 13, color: "var(--color-muted)" }}>{r.subscription}</span>,
  },
  { key: "joinDate", header: "Join Date" },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>,
  },
];

const FIELDS = [
  { key: "name", label: "Company Name", type: "text", required: true },
  { key: "code", label: "Company Code", type: "text", required: true },
  { key: "email", label: "Email", type: "text", required: true },
  { key: "phone", label: "Phone", type: "text" },
  { key: "industry", label: "Industry", type: "select", options: INDUSTRIES },
  { key: "employees", label: "Employees", type: "number" },
  { key: "plan", label: "Plan", type: "select", options: SUBSCRIPTION_PLANS },
  { key: "subscription", label: "Subscription", type: "select", options: ["Monthly", "Annual"] },
  { key: "joinDate", label: "Join Date", type: "text" },
  { key: "status", label: "Status", type: "select", options: ["Active", "Suspended", "Inactive"] },
];

export default function CompanyList() {
  return (
    <CrudPage
      title="Companies"
      breadcrumbLabel="All Companies"
      entityLabel="Company"
      seed={COMPANIES}
      columns={COLUMNS}
      searchFields={["name", "code", "email", "industry"]}
      statusOptions={["All", "Active", "Suspended", "Inactive"]}
      sortOptions={[
        { key: "name", label: "Name" },
        { key: "employees", label: "Employees" },
        { key: "joinDate", label: "Join Date" },
      ]}
      fields={FIELDS}
      subNav={<CompanyTabs />}
    />
  );
}
