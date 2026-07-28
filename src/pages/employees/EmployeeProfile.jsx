import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import Icon from "../../components/Icon.jsx";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Badge from "../../components/Badge.jsx";
import Avatar from "../../components/Avatar.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import DataTable from "../../components/DataTable.jsx";
import SubNavTabs from "../../components/SubNavTabs.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getCompanyEmployee, getCompanyEmployeeDocuments, ApiError } from "../../services/api/companyApi.js";
import { resolveApiAssetUrl } from "../../utils/apiAssetUrl.js";
import { ROUTES, employeeEditPath } from "../../router/routePaths.js";
import "./EmployeeProfile.css";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "documents", label: "Documents" },
  { key: "skills", label: "Skills" },
  { key: "emergency", label: "Emergency Contacts" },
];

const STATUS_TONE = { Active: "green", Inactive: "gray", Resigned: "orange", Terminated: "red" };
const SKILL_TONE = { Advanced: "green", Expert: "green", Intermediate: "blue", Beginner: "orange" };

const DOC_COLUMNS = [
  { key: "document_type", header: "Document", render: (r) => <b>{r.document_type}</b> },
  { key: "document_number", header: "Number", render: (r) => r.document_number || "—" },
  {
    key: "verification_status",
    header: "Status",
    render: (r) => <Badge tone={r.verification_status === "Verified" ? "green" : r.verification_status === "Rejected" ? "red" : "orange"}>{r.verification_status}</Badge>,
  },
  {
    key: "actions",
    header: "",
    render: (r) => (
      <a href={resolveApiAssetUrl(r.file_path)} target="_blank" rel="noreferrer" className="dash-icon-btn" aria-label={`Download ${r.file_name}`}>
        <Icon name="download" size={15} />
      </a>
    ),
  },
];

function initials(name) {
  return String(name ?? "")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function EmployeeProfile() {
  const { toggleCollapsed } = useOutletContext();
  const { companyId, employeeId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [tab, setTab] = useState("overview");

  const [status, setStatus] = useState("loading"); // loading | notFound | error | success
  const [employee, setEmployee] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    Promise.all([getCompanyEmployee(companyId, employeeId, token), getCompanyEmployeeDocuments(companyId, employeeId, token)])
      .then(([employeeData, documentsData]) => {
        if (cancelled) return;
        setEmployee(employeeData);
        setDocuments(documentsData);
        setStatus("success");
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) {
          setStatus("notFound");
        } else {
          setErrorMessage(error.message ?? "Could not load this employee.");
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, employeeId, token, retryKey]);

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <button type="button" className="cl-btn ep-back-btn" onClick={() => navigate(ROUTES.EMPLOYEES)}>
              <Icon name="back" size={15} />
              Back to Employees
            </button>
            <h1>{employee?.full_name ?? "Employee"}</h1>
            <Breadcrumb current={employee?.full_name ?? "Employee"} />
          </div>
          {status === "success" && (
            <button type="button" className="dash-primary-btn" onClick={() => navigate(employeeEditPath(companyId, employeeId))}>
              <Icon name="edit" size={15} />
              Edit Employee
            </button>
          )}
        </div>

        {status === "loading" && <ProfileSkeleton />}

        {status === "notFound" && (
          <div className="panel ep-state-panel">
            <Icon name="users" size={28} />
            <h3>Employee not found</h3>
            <p>We couldn't find an employee with this ID. They may have been removed.</p>
            <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.EMPLOYEES)}>
              Back to Employees
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="panel ep-state-panel">
            <Icon name="warning" size={28} />
            <h3>Couldn't load this employee</h3>
            <p>{errorMessage}</p>
            <button type="button" className="cl-btn" onClick={() => setRetryKey((k) => k + 1)}>
              <Icon name="refresh" size={15} />
              Try Again
            </button>
          </div>
        )}

        {status === "success" && employee && (
          <>
            <div className="panel ep-header-card">
              <Avatar src={resolveApiAssetUrl(employee.profile_photo)} name={employee.full_name} size={64} />
              <div className="ep-header-info">
                <h2>{employee.full_name}</h2>
                <p>
                  {employee.designation?.designation_name ?? "—"} · {employee.department?.department_name ?? "—"}
                </p>
                <div className="ep-header-meta">
                  <span>
                    <Icon name="mail" size={14} />
                    {employee.email}
                  </span>
                  <span>
                    <Icon name="calendar" size={14} />
                    Joined {employee.joining_date ? String(employee.joining_date).slice(0, 10) : "—"}
                  </span>
                </div>
              </div>
              <Badge tone={STATUS_TONE[employee.status] ?? "gray"}>{employee.status}</Badge>
            </div>

            <SubNavTabs tabs={TABS} active={tab} onNavigate={setTab} />

            <div className="panel ep-tab-panel">
              {tab === "overview" && (
                <div className="detail-grid">
                  <div>
                    <span>Employee Code</span>
                    <p>{employee.employee_code}</p>
                  </div>
                  <div>
                    <span>Branch</span>
                    <p>{employee.branch?.branch_name ?? "—"}</p>
                  </div>
                  <div>
                    <span>Department</span>
                    <p>{employee.department?.department_name ?? "—"}</p>
                  </div>
                  <div>
                    <span>Designation</span>
                    <p>{employee.designation?.designation_name ?? "—"}</p>
                  </div>
                  <div>
                    <span>Reporting Manager</span>
                    <p>{employee.manager?.full_name ?? "—"}</p>
                  </div>
                  <div>
                    <span>Mobile</span>
                    <p>{employee.mobile ?? "—"}</p>
                  </div>
                  <div>
                    <span>Employment Type</span>
                    <p>{employee.employment_type}</p>
                  </div>
                  <div>
                    <span>Join Date</span>
                    <p>{employee.joining_date ? String(employee.joining_date).slice(0, 10) : "—"}</p>
                  </div>
                  <div>
                    <span>Status</span>
                    <p>{employee.status}</p>
                  </div>
                  <div>
                    <span>Portal Login</span>
                    <p>{employee.user ? employee.user.email : "Not created"}</p>
                  </div>
                </div>
              )}

              {tab === "documents" && (
                <DataTable columns={DOC_COLUMNS} rows={documents} emptyMessage="No documents uploaded." />
              )}

              {tab === "skills" && (
                <div className="ep-skills">
                  {(employee.skills ?? []).length === 0 ? (
                    <p className="ep-empty-note">No skills added.</p>
                  ) : (
                    employee.skills.map((skill) => (
                      <div className="ep-skill-row" key={skill.id}>
                        <span>{skill.skill_name}</span>
                        <Badge tone={SKILL_TONE[skill.skill_level] ?? "gray"}>{skill.skill_level ?? "—"}</Badge>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === "emergency" && (
                <div className="ep-contacts">
                  {(employee.emergency_contacts ?? []).length === 0 ? (
                    <p className="ep-empty-note">No emergency contacts added.</p>
                  ) : (
                    employee.emergency_contacts.map((c) => (
                      <div className="ep-contact-card" key={c.id}>
                        <span className="emp-avatar">{initials(c.contact_name)}</span>
                        <div>
                          <p className="emp-name">{c.contact_name}</p>
                          <p className="emp-code">
                            {c.relationship ?? "—"} · {c.mobile ?? "—"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function ProfileSkeleton() {
  return (
    <>
      <div className="panel ep-header-card">
        <Skeleton width={64} height={64} circle />
        <div className="ep-header-info">
          <Skeleton width="30%" height={20} />
          <Skeleton width="20%" height={14} className="cv-skeleton-gap" />
        </div>
      </div>
      <div className="panel ep-tab-panel">
        <div className="detail-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={38} />
          ))}
        </div>
      </div>
    </>
  );
}
