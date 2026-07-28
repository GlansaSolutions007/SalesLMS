import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Icon from "../../components/Icon.jsx";
import Badge from "../../components/Badge.jsx";
import Avatar from "../../components/Avatar.jsx";
import StatCard from "../../components/StatCard.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import Toast from "../../components/Toast.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getCompanyDepartment, ApiError } from "../../services/api/companyApi.js";
import { ROUTES } from "../../router/routePaths.js";
import { DetailField } from "./companyDisplay.jsx";
import DepartmentFormModal from "./DepartmentFormModal.jsx";
import "./CompanyView.css";

export default function CompanyDepartmentView() {
  const { companyId, departmentId } = useParams();
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [status, setStatus] = useState("loading"); // loading | notFound | error | success
  const [department, setDepartment] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    getCompanyDepartment(companyId, departmentId, token)
      .then((data) => {
        if (cancelled) return;
        setDepartment(data);
        setStatus("success");
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) {
          setStatus("notFound");
        } else {
          setErrorMessage(error.message ?? "Could not load this department.");
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, departmentId, token, retryKey]);

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body wizard-page-body cv-body">
        <div className="cv-header">
          <div>
            <h1>Department Details</h1>
            <p className="cl-breadcrumb">
              <span>Dashboard</span>
              <Icon name="chevronRight" size={13} />
              <span>Company Management</span>
              <Icon name="chevronRight" size={13} />
              <span>Departments</span>
              <Icon name="chevronRight" size={13} />
              <span className="is-current">View Department</span>
            </p>
          </div>

          <div className="cv-header-actions">
            <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.COMPANY_DEPARTMENTS)}>
              <Icon name="back" size={15} />
              Back
            </button>
            {status === "success" && (
              <button type="button" className="dash-primary-btn" onClick={() => setEditOpen(true)}>
                <Icon name="edit" size={15} />
                Edit Department
              </button>
            )}
          </div>
        </div>

        {status === "loading" && <DepartmentViewSkeleton />}

        {status === "notFound" && (
          <div className="panel cv-state-panel">
            <Icon name="gridView" size={28} />
            <h3>Department not found</h3>
            <p>We couldn't find a department with this ID. It may have been removed.</p>
            <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.COMPANY_DEPARTMENTS)}>
              Back to Departments
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="panel cv-state-panel">
            <Icon name="warning" size={28} />
            <h3>Couldn't load this department</h3>
            <p>{errorMessage}</p>
            <button type="button" className="cl-btn" onClick={() => setRetryKey((k) => k + 1)}>
              <Icon name="refresh" size={15} />
              Try Again
            </button>
          </div>
        )}

        {status === "success" && department && (
          <>
            <div className="panel cv-profile-card">
              <Avatar name={department.department_name} size={72} shape="square" />
              <div className="cv-profile-info">
                <div className="cv-profile-title">
                  <h2>{department.department_name}</h2>
                  <Badge tone={department.status === "Active" ? "green" : "gray"}>{department.status ?? "—"}</Badge>
                </div>
                <p className="cv-profile-code">{department.department_code}</p>
                <div className="cv-profile-meta">
                  <span>
                    <Icon name="building" size={14} />
                    {department.branch?.branch_name || "Company-wide (no branch)"}
                  </span>
                </div>
              </div>
            </div>

            <div className="cv-stats-grid">
              <StatCard icon="users" label="Employees" value={department.employees_count ?? 0} tone="blue" />
            </div>

            <div className="cv-columns">
              <div className="cv-main-col">
                <section className="panel cv-section">
                  <h3 className="cv-section-title">Department Information</h3>
                  <div className="detail-grid">
                    <DetailField label="Branch">{department.branch?.branch_name}</DetailField>
                    <DetailField label="Branch Code">{department.branch?.branch_code}</DetailField>
                    <DetailField label="Description">{department.description}</DetailField>
                  </div>
                </section>

                <section className="panel cv-section">
                  <h3 className="cv-section-title">Employees</h3>
                  {department.employees?.length > 0 ? (
                    <div className="dtable-wrap">
                      <table className="dtable">
                        <thead>
                          <tr>
                            <th>Employee</th>
                            <th>Code</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {department.employees.map((emp) => (
                            <tr key={emp.id}>
                              <td>{emp.full_name}</td>
                              <td>{emp.employee_code}</td>
                              <td>
                                <Badge tone={emp.status === "Active" ? "green" : "gray"}>{emp.status ?? "—"}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="cv-empty-inline">
                      <Icon name="users" size={22} />
                      <p>No Employees Assigned</p>
                    </div>
                  )}
                </section>
              </div>

              <div className="cv-side-col">
                <section className="panel cv-section">
                  <h3 className="cv-section-title">Department Head</h3>
                  {department.head ? (
                    <div className="detail-grid cv-settings-grid">
                      <DetailField label="Name">{department.head.full_name}</DetailField>
                      <DetailField label="Employee Code">{department.head.employee_code}</DetailField>
                      <DetailField label="Mobile">{department.head.mobile}</DetailField>
                      <DetailField label="Email">{department.head.email}</DetailField>
                    </div>
                  ) : (
                    <div className="cv-empty-inline">
                      <Icon name="users" size={22} />
                      <p>No Department Head Assigned</p>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </>
        )}
      </div>

      {editOpen && department && (
        <DepartmentFormModal
          mode="edit"
          companyId={companyId}
          departmentId={departmentId}
          initialValues={{
            department_name: department.department_name ?? "",
            department_code: department.department_code ?? "",
            description: department.description ?? "",
            branch_id: department.branch?.id ?? "",
            department_head: department.head?.id ?? "",
          }}
          onClose={() => setEditOpen(false)}
          onSuccess={() => {
            setEditOpen(false);
            setRetryKey((k) => k + 1);
            setToast({ tone: "success", message: "Department updated successfully." });
          }}
        />
      )}

      {toast && <Toast tone={toast.tone} message={toast.message} onDismiss={() => setToast(null)} />}
    </>
  );
}

function DepartmentViewSkeleton() {
  return (
    <>
      <div className="panel cv-profile-card">
        <Skeleton width={72} height={72} radius={14} />
        <div className="cv-profile-info">
          <Skeleton width="40%" height={22} />
          <Skeleton width="20%" height={14} className="cv-skeleton-gap" />
          <Skeleton width="60%" height={14} className="cv-skeleton-gap" />
        </div>
      </div>

      <div className="cv-stats-grid">
        {Array.from({ length: 1 }).map((_, i) => (
          <div className="panel cv-skeleton-stat" key={i}>
            <Skeleton width={44} height={44} circle />
            <div>
              <Skeleton width={50} height={20} />
              <Skeleton width={70} height={12} className="cv-skeleton-gap" />
            </div>
          </div>
        ))}
      </div>

      <div className="cv-columns">
        <div className="cv-main-col">
          {Array.from({ length: 2 }).map((_, i) => (
            <div className="panel cv-section" key={i}>
              <Skeleton width="30%" height={16} className="cv-skeleton-gap" />
              <div className="detail-grid">
                {Array.from({ length: 3 }).map((__, j) => (
                  <Skeleton key={j} height={38} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="cv-side-col">
          <div className="panel cv-section">
            <Skeleton width="50%" height={16} className="cv-skeleton-gap" />
            <div className="detail-grid cv-settings-grid">
              {Array.from({ length: 4 }).map((__, j) => (
                <Skeleton key={j} height={38} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
