import { useNavigate } from "react-router-dom";
import Badge from "../../components/Badge.jsx";
import Icon from "../../components/Icon.jsx";
import CrudPage from "../../components/CrudPage.jsx";
import EmployeeTabs from "./EmployeeTabs.jsx";
import { EMPLOYEES, DEPARTMENTS } from "./employeeData.js";
import { ROUTES } from "../../router/routePaths.js";

const STATUS_TONE = { Active: "green", "On Leave": "orange", Inactive: "gray" };

function initials(name) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const COLUMNS = [
  {
    key: "name",
    header: "Employee",
    render: (r) => (
      <div className="emp-cell">
        <span className="emp-avatar">{initials(r.name)}</span>
        <div>
          <p className="emp-name">{r.name}</p>
          <p className="emp-code">{r.employeeCode}</p>
        </div>
      </div>
    ),
  },
  { key: "department", header: "Department" },
  { key: "designation", header: "Designation" },
  { key: "email", header: "Email" },
  { key: "phone", header: "Phone" },
  { key: "joinDate", header: "Join Date" },
  { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge> },
];

const FIELDS = [
  { key: "name", label: "Full Name", type: "text", required: true },
  { key: "employeeCode", label: "Employee Code", type: "text", required: true },
  { key: "department", label: "Department", type: "select", options: DEPARTMENTS },
  { key: "designation", label: "Designation", type: "text" },
  { key: "email", label: "Email", type: "text", required: true },
  { key: "phone", label: "Phone", type: "text" },
  { key: "joinDate", label: "Join Date", type: "text" },
  { key: "status", label: "Status", type: "select", options: ["Active", "On Leave", "Inactive"] },
];

export default function EmployeeList() {
  const navigate = useNavigate();

  return (
    <CrudPage
      title="Employees"
      breadcrumbLabel="All Employees"
      entityLabel="Employee"
      seed={EMPLOYEES}
      columns={COLUMNS}
      searchFields={["name", "employeeCode", "email", "department"]}
      statusOptions={["All", "Active", "On Leave", "Inactive"]}
      sortOptions={[
        { key: "name", label: "Name" },
        { key: "joinDate", label: "Join Date" },
      ]}
      fields={FIELDS}
      subNav={<EmployeeTabs />}
      onAddClick={() => navigate(ROUTES.EMPLOYEES_ADD)}
      extraRowAction={(row) => (
        <button
          type="button"
          className="dash-icon-btn"
          aria-label={`View ${row.name}`}
          onClick={() => navigate(ROUTES.EMPLOYEE_PROFILE, { state: { employee: row } })}
        >
          <Icon name="eye" size={15} />
        </button>
      )}
    />
  );
}
