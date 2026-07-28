import { useNavigate } from "react-router-dom";
import Badge from "../../components/Badge.jsx";
import CrudPage from "../../components/CrudPage.jsx";
import TrainingSectionTabs from "./TrainingSectionTabs.jsx";
import { SEED, STATUS_OPTIONS } from "./assignCourseData.js";
import { ROUTES } from "../../router/routePaths.js";

const STATUS_TONE = { Assigned: "blue", "In Progress": "orange", Completed: "green", Expired: "red" };

function initials(name) {
  return String(name ?? "")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const COLUMNS = [
  {
    key: "employeeName",
    header: "Employee",
    render: (r) => (
      <div className="emp-cell">
        <span className="emp-avatar">{initials(r.employeeName)}</span>
        <div>
          <p className="emp-name">{r.employeeName}</p>
          <p className="emp-code">{r.employeeCode}</p>
        </div>
      </div>
    ),
  },
  { key: "courseName", header: "Course", render: (r) => <b>{r.courseName}</b> },
  { key: "batchName", header: "Batch", render: (r) => r.batchName || "—" },
  { key: "assignedDate", header: "Assigned Date" },
  { key: "dueDate", header: "Due Date" },
  { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status] ?? "gray"}>{r.status}</Badge> },
];

const FIELDS = [
  { key: "employeeName", label: "Employee Name", type: "text", required: true },
  { key: "employeeCode", label: "Employee Code", type: "text", required: true },
  { key: "courseName", label: "Course", type: "text", required: true },
  { key: "batchName", label: "Batch", type: "text" },
  { key: "assignedDate", label: "Assigned Date", type: "text" },
  { key: "dueDate", label: "Due Date", type: "text" },
  { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
];

export default function AssignCourses() {
  const navigate = useNavigate();

  return (
    <CrudPage
      title="Assign Courses"
      breadcrumbLabel="Assign Courses"
      entityLabel="Assignment"
      seed={SEED}
      columns={COLUMNS}
      searchFields={["employeeName", "employeeCode", "courseName", "batchName"]}
      statusOptions={["All", ...STATUS_OPTIONS]}
      sortOptions={[
        { key: "employeeName", label: "Employee" },
        { key: "courseName", label: "Course" },
        { key: "dueDate", label: "Due Date" },
      ]}
      fields={FIELDS}
      subNav={<TrainingSectionTabs />}
      onAddClick={() => navigate(ROUTES.TRAINING_ASSIGN_COURSES_ADD)}
    />
  );
}
