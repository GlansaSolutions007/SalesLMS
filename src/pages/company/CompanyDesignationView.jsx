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
import { getCompanyDesignation, getCompanyEmployees, ApiError } from "../../services/api/companyApi.js";
import { ROUTES } from "../../router/routePaths.js";
import { DetailField } from "./companyDisplay.jsx";
import DesignationFormModal from "./DesignationFormModal.jsx";
import "./CompanyView.css";

export default function CompanyDesignationView() {
  const { companyId, designationId } = useParams();
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [status, setStatus] = useState("loading"); // loading | notFound | error | success
  const [designation, setDesignation] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    Promise.all([
      getCompanyDesignation(companyId, designationId, token),
      getCompanyEmployees(companyId, { designation_id: designationId, per_page: 100 }, token),
    ])
      .then(([designationData, employeeResult]) => {
        if (cancelled) return;
        setDesignation(designationData);
        setEmployees(employeeResult.items);
        setStatus("success");
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) {
          setStatus("notFound");
        } else {
          setErrorMessage(error.message ?? "Could not load this designation.");
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, designationId, token, retryKey]);

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body wizard-page-body cv-body">
        <div className="cv-header">
          <div>
            <h1>Designation Details</h1>
            <p className="cl-breadcrumb">
              <span>Dashboard</span>
              <Icon name="chevronRight" size={13} />
              <span>Company Management</span>
              <Icon name="chevronRight" size={13} />
              <span>Designations</span>
              <Icon name="chevronRight" size={13} />
              <span className="is-current">View Designation</span>
            </p>
          </div>

          <div className="cv-header-actions">
            <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.COMPANY_DESIGNATIONS)}>
              <Icon name="back" size={15} />
              Back
            </button>
            {status === "success" && (
              <button type="button" className="dash-primary-btn" onClick={() => setEditOpen(true)}>
                <Icon name="edit" size={15} />
                Edit Designation
              </button>
            )}
          </div>
        </div>

        {status === "loading" && <DesignationViewSkeleton />}

        {status === "notFound" && (
          <div className="panel cv-state-panel">
            <Icon name="clipboard" size={28} />
            <h3>Designation not found</h3>
            <p>We couldn't find a designation with this ID. It may have been removed.</p>
            <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.COMPANY_DESIGNATIONS)}>
              Back to Designations
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="panel cv-state-panel">
            <Icon name="warning" size={28} />
            <h3>Couldn't load this designation</h3>
            <p>{errorMessage}</p>
            <button type="button" className="cl-btn" onClick={() => setRetryKey((k) => k + 1)}>
              <Icon name="refresh" size={15} />
              Try Again
            </button>
          </div>
        )}

        {status === "success" && designation && (
          <>
            <div className="panel cv-profile-card">
              <Avatar name={designation.designation_name} size={72} shape="square" />
              <div className="cv-profile-info">
                <div className="cv-profile-title">
                  <h2>{designation.designation_name}</h2>
                  <Badge tone={designation.status === "Active" ? "green" : "gray"}>{designation.status ?? "—"}</Badge>
                </div>
                <p className="cv-profile-code">{designation.designation_code}</p>
                <div className="cv-profile-meta">
                  <span>
                    <Icon name="barChart" size={14} />
                    Hierarchy Level {designation.hierarchy_level ?? 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="cv-stats-grid">
              <StatCard icon="users" label="Employees" value={designation.employees_count ?? 0} tone="blue" />
            </div>

            <div className="cv-columns">
              <div className="cv-main-col">
                <section className="panel cv-section">
                  <h3 className="cv-section-title">Designation Information</h3>
                  <div className="detail-grid">
                    <DetailField label="Hierarchy Level">{designation.hierarchy_level ?? 0}</DetailField>
                    <DetailField label="Description">{designation.description}</DetailField>
                  </div>
                </section>

                <section className="panel cv-section">
                  <h3 className="cv-section-title">Employees</h3>
                  {employees.length > 0 ? (
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
                          {employees.map((emp) => (
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
            </div>
          </>
        )}
      </div>

      {editOpen && designation && (
        <DesignationFormModal
          mode="edit"
          companyId={companyId}
          designationId={designationId}
          initialValues={{
            designation_name: designation.designation_name ?? "",
            designation_code: designation.designation_code ?? "",
            description: designation.description ?? "",
            hierarchy_level: designation.hierarchy_level != null ? String(designation.hierarchy_level) : "",
          }}
          onClose={() => setEditOpen(false)}
          onSuccess={() => {
            setEditOpen(false);
            setRetryKey((k) => k + 1);
            setToast({ tone: "success", message: "Designation updated successfully." });
          }}
        />
      )}

      {toast && <Toast tone={toast.tone} message={toast.message} onDismiss={() => setToast(null)} />}
    </>
  );
}

function DesignationViewSkeleton() {
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
                {Array.from({ length: 2 }).map((__, j) => (
                  <Skeleton key={j} height={38} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
