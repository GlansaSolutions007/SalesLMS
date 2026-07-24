import Badge from "../../components/Badge.jsx";
import CrudPage from "../../components/CrudPage.jsx";
import EmployeeTabs from "./EmployeeTabs.jsx";

const STATUS_TONE = { Approved: "green", Pending: "orange", Rejected: "gray" };

const SEED = [
  { id: 1, employeeName: "Alice Monroe", leaveType: "Sick Leave", from: "2026-07-10", to: "2026-07-12", days: 3, status: "Approved" },
  { id: 2, employeeName: "David Chen", leaveType: "Casual Leave", from: "2026-07-20", to: "2026-07-25", days: 5, status: "Pending" },
  { id: 3, employeeName: "Jessica Wang", leaveType: "Earned Leave", from: "2026-08-01", to: "2026-08-03", days: 3, status: "Pending" },
  { id: 4, employeeName: "Robert Jackson", leaveType: "Sick Leave", from: "2026-06-15", to: "2026-06-16", days: 2, status: "Approved" },
  { id: 5, employeeName: "Tom Reid", leaveType: "Unpaid Leave", from: "2026-06-01", to: "2026-06-10", days: 8, status: "Rejected" },
  { id: 6, employeeName: "Emma Clarke", leaveType: "Casual Leave", from: "2026-07-05", to: "2026-07-05", days: 1, status: "Approved" },
];

const COLUMNS = [
  { key: "employeeName", header: "Employee", render: (r) => <b>{r.employeeName}</b> },
  { key: "leaveType", header: "Leave Type" },
  { key: "from", header: "From" },
  { key: "to", header: "To" },
  { key: "days", header: "Days" },
  { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge> },
];

const FIELDS = [
  { key: "employeeName", label: "Employee Name", type: "text", required: true },
  { key: "leaveType", label: "Leave Type", type: "select", options: ["Sick Leave", "Casual Leave", "Earned Leave", "Unpaid Leave"] },
  { key: "from", label: "From Date", type: "text" },
  { key: "to", label: "To Date", type: "text" },
  { key: "days", label: "Days", type: "number" },
  { key: "status", label: "Status", type: "select", options: ["Pending", "Approved", "Rejected"] },
];

export default function EmployeeLeave() {
  return (
    <CrudPage
      title="Leave Management"
      breadcrumbLabel="Leave Management"
      entityLabel="Leave Request"
      seed={SEED}
      columns={COLUMNS}
      searchFields={["employeeName", "leaveType"]}
      statusOptions={["All", "Pending", "Approved", "Rejected"]}
      sortOptions={[
        { key: "employeeName", label: "Employee" },
        { key: "from", label: "From Date" },
      ]}
      fields={FIELDS}
      subNav={<EmployeeTabs />}
    />
  );
}
