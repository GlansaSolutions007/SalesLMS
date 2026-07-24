import { useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import Icon from "../../components/Icon.jsx";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Badge from "../../components/Badge.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";
import DataTable from "../../components/DataTable.jsx";
import SubNavTabs from "../../components/SubNavTabs.jsx";
import { EMPLOYEES } from "./employeeData.js";
import { ROUTES } from "../../router/routePaths.js";
import "./EmployeeProfile.css";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "documents", label: "Documents" },
  { key: "skills", label: "Skills" },
  { key: "emergency", label: "Emergency Contacts" },
  { key: "targets", label: "Targets" },
  { key: "performance", label: "Performance" },
];

const STATUS_TONE = { Active: "green", "On Leave": "orange", Inactive: "gray" };

// Mock per-employee detail (frontend-only stage — same shape for every
// employee until a real backend can serve per-employee records).
const DOCUMENTS = [
  { id: 1, name: "Offer Letter.pdf", type: "PDF", uploadedAt: "2023-02-14" },
  { id: 2, name: "ID Proof.pdf", type: "PDF", uploadedAt: "2023-02-14" },
  { id: 3, name: "Resume.pdf", type: "PDF", uploadedAt: "2023-02-10" },
  { id: 4, name: "Bank Details Form.pdf", type: "PDF", uploadedAt: "2023-02-16" },
];

const SKILLS = [
  { name: "Negotiation", level: "Advanced" },
  { name: "Cold Calling", level: "Advanced" },
  { name: "CRM Tools", level: "Intermediate" },
  { name: "Objection Handling", level: "Advanced" },
  { name: "Presentation", level: "Intermediate" },
  { name: "Public Speaking", level: "Beginner" },
];

const SKILL_TONE = { Advanced: "green", Intermediate: "blue", Beginner: "orange" };

const EMERGENCY_CONTACTS = [
  { id: 1, name: "James Monroe", relation: "Spouse", phone: "+1 415 555 0900" },
  { id: 2, name: "Linda Monroe", relation: "Parent", phone: "+1 415 555 0911" },
];

const TARGETS = [
  { id: 1, label: "Monthly Sales Target", value: "$42,000 / $50,000", progress: 84 },
  { id: 2, label: "New Leads Converted", value: "18 / 25", progress: 72 },
  { id: 3, label: "Training Completion", value: "9 / 10 courses", progress: 90 },
];

const PERFORMANCE = [
  { id: 1, label: "Jan", score: 78 },
  { id: 2, label: "Feb", score: 82 },
  { id: 3, label: "Mar", score: 75 },
  { id: 4, label: "Apr", score: 88 },
  { id: 5, label: "May", score: 91 },
  { id: 6, label: "Jun", score: 85 },
];

const DOC_COLUMNS = [
  { key: "name", header: "Document", render: (r) => <b>{r.name}</b> },
  { key: "type", header: "Type" },
  { key: "uploadedAt", header: "Uploaded" },
  {
    key: "actions",
    header: "",
    render: () => (
      <button type="button" className="dash-icon-btn" aria-label="Download document">
        <Icon name="download" size={15} />
      </button>
    ),
  },
];

function initials(name) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function EmployeeProfile() {
  const { toggleCollapsed } = useOutletContext();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");

  // No employee id in the URL by design (see /employees/profile) — the row
  // is passed via router state from EmployeeList; direct URL access falls
  // back to the first employee so the route still renders something real.
  const employee = state?.employee ?? EMPLOYEES[0];

  return (
    <>
      <Topbar
        onMenuClick={toggleCollapsed}
        searchPlaceholder="Search..."
        notifications={3}
        messages={5}
        user={{ name: "John Smith", role: "Sales Manager", initials: "JS" }}
      />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <button type="button" className="cl-btn ep-back-btn" onClick={() => navigate(ROUTES.EMPLOYEES)}>
              <Icon name="back" size={15} />
              Back to Employees
            </button>
            <h1>{employee.name}</h1>
            <Breadcrumb current={employee.name} />
          </div>
        </div>

          <div className="panel ep-header-card">
            <span className="emp-avatar ep-avatar">{initials(employee.name)}</span>
            <div className="ep-header-info">
              <h2>{employee.name}</h2>
              <p>
                {employee.designation} · {employee.department}
              </p>
              <div className="ep-header-meta">
                <span>
                  <Icon name="mail" size={14} />
                  {employee.email}
                </span>
                <span>
                  <Icon name="calendar" size={14} />
                  Joined {employee.joinDate}
                </span>
              </div>
            </div>
            <Badge tone={STATUS_TONE[employee.status]}>{employee.status}</Badge>
          </div>

          <SubNavTabs tabs={TABS} active={tab} onNavigate={setTab} />

          <div className="panel ep-tab-panel">
            {tab === "overview" && (
              <div className="ep-overview-grid">
                <div>
                  <span>Employee Code</span>
                  <p>{employee.employeeCode}</p>
                </div>
                <div>
                  <span>Department</span>
                  <p>{employee.department}</p>
                </div>
                <div>
                  <span>Designation</span>
                  <p>{employee.designation}</p>
                </div>
                <div>
                  <span>Phone</span>
                  <p>{employee.phone}</p>
                </div>
                <div>
                  <span>Join Date</span>
                  <p>{employee.joinDate}</p>
                </div>
                <div>
                  <span>Status</span>
                  <p>{employee.status}</p>
                </div>
              </div>
            )}

            {tab === "documents" && <DataTable columns={DOC_COLUMNS} rows={DOCUMENTS} emptyMessage="No documents uploaded." />}

            {tab === "skills" && (
              <div className="ep-skills">
                {SKILLS.map((skill) => (
                  <div className="ep-skill-row" key={skill.name}>
                    <span>{skill.name}</span>
                    <Badge tone={SKILL_TONE[skill.level]}>{skill.level}</Badge>
                  </div>
                ))}
              </div>
            )}

            {tab === "emergency" && (
              <div className="ep-contacts">
                {EMERGENCY_CONTACTS.map((c) => (
                  <div className="ep-contact-card" key={c.id}>
                    <span className="emp-avatar">{initials(c.name)}</span>
                    <div>
                      <p className="emp-name">{c.name}</p>
                      <p className="emp-code">
                        {c.relation} · {c.phone}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "targets" && (
              <div className="ep-targets">
                {TARGETS.map((t) => (
                  <div className="ep-target-row" key={t.id}>
                    <div className="ep-target-head">
                      <span>{t.label}</span>
                      <span className="ep-target-value">{t.value}</span>
                    </div>
                    <ProgressBar value={t.progress} />
                  </div>
                ))}
              </div>
            )}

            {tab === "performance" && (
              <div className="ep-targets">
                {PERFORMANCE.map((p) => (
                  <div className="ep-target-row" key={p.id}>
                    <div className="ep-target-head">
                      <span>{p.label}</span>
                      <span className="ep-target-value">{p.score}/100</span>
                    </div>
                    <ProgressBar value={p.score} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
    </>
  );
}
