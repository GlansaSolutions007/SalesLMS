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
import { getCompanyBranch, ApiError } from "../../services/api/companyApi.js";
import { ROUTES } from "../../router/routePaths.js";
import { DetailField } from "./companyDisplay.jsx";
import BranchFormModal from "./BranchFormModal.jsx";
import "./CompanyView.css";

export default function CompanyBranchView() {
  const { companyId, branchId } = useParams();
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [status, setStatus] = useState("loading"); // loading | notFound | error | success
  const [branch, setBranch] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    getCompanyBranch(companyId, branchId, token)
      .then((data) => {
        if (cancelled) return;
        setBranch(data);
        setStatus("success");
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) {
          setStatus("notFound");
        } else {
          setErrorMessage(error.message ?? "Could not load this branch.");
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, branchId, token, retryKey]);

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body wizard-page-body cv-body">
        <div className="cv-header">
          <div>
            <h1>Branch Details</h1>
            <p className="cl-breadcrumb">
              <span>Dashboard</span>
              <Icon name="chevronRight" size={13} />
              <span>Company Management</span>
              <Icon name="chevronRight" size={13} />
              <span>Branches</span>
              <Icon name="chevronRight" size={13} />
              <span className="is-current">View Branch</span>
            </p>
          </div>

          <div className="cv-header-actions">
            <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.COMPANY_BRANCHES)}>
              <Icon name="back" size={15} />
              Back
            </button>
            {status === "success" && (
              <button type="button" className="dash-primary-btn" onClick={() => setEditOpen(true)}>
                <Icon name="edit" size={15} />
                Edit Branch
              </button>
            )}
          </div>
        </div>

        {status === "loading" && <BranchViewSkeleton />}

        {status === "notFound" && (
          <div className="panel cv-state-panel">
            <Icon name="building" size={28} />
            <h3>Branch not found</h3>
            <p>We couldn't find a branch with this ID. It may have been removed.</p>
            <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.COMPANY_BRANCHES)}>
              Back to Branches
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="panel cv-state-panel">
            <Icon name="warning" size={28} />
            <h3>Couldn't load this branch</h3>
            <p>{errorMessage}</p>
            <button type="button" className="cl-btn" onClick={() => setRetryKey((k) => k + 1)}>
              <Icon name="refresh" size={15} />
              Try Again
            </button>
          </div>
        )}

        {status === "success" && branch && (
          <>
            <div className="panel cv-profile-card">
              <Avatar name={branch.branch_name} size={72} shape="square" />
              <div className="cv-profile-info">
                <div className="cv-profile-title">
                  <h2>{branch.branch_name}</h2>
                  <Badge tone={branch.status === "Active" ? "green" : "gray"}>{branch.status ?? "—"}</Badge>
                </div>
                <p className="cv-profile-code">{branch.branch_code}</p>
                <div className="cv-profile-meta">
                  <span>
                    <Icon name="mapPin" size={14} />
                    {[branch.city, branch.state, branch.country].filter(Boolean).join(", ") || "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="cv-stats-grid">
              <StatCard icon="users" label="Employees" value={branch.employees_count ?? 0} tone="blue" />
              <StatCard icon="gridView" label="Departments" value={branch.departments_count ?? 0} tone="green" />
            </div>

            <div className="cv-columns">
              <div className="cv-main-col">
                <section className="panel cv-section">
                  <h3 className="cv-section-title">Branch Information</h3>
                  <div className="detail-grid">
                    <DetailField label="Address">{branch.address}</DetailField>
                    <DetailField label="City">{branch.city}</DetailField>
                    <DetailField label="State">{branch.state}</DetailField>
                    <DetailField label="Country">{branch.country}</DetailField>
                    <DetailField label="Pincode">{branch.pincode}</DetailField>
                    <DetailField label="Phone">{branch.phone}</DetailField>
                    <DetailField label="Email">{branch.email}</DetailField>
                  </div>
                </section>

                <section className="panel cv-section">
                  <h3 className="cv-section-title">Departments</h3>
                  {branch.departments?.length > 0 ? (
                    <div className="dtable-wrap">
                      <table className="dtable">
                        <thead>
                          <tr>
                            <th>Department</th>
                            <th>Code</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {branch.departments.map((d) => (
                            <tr key={d.id}>
                              <td>{d.department_name}</td>
                              <td>{d.department_code}</td>
                              <td>
                                <Badge tone={d.status === "Active" ? "green" : "gray"}>{d.status ?? "—"}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="cv-empty-inline">
                      <Icon name="gridView" size={22} />
                      <p>No Departments Available</p>
                    </div>
                  )}
                </section>
              </div>

              <div className="cv-side-col">
                <section className="panel cv-section">
                  <h3 className="cv-section-title">Branch Manager</h3>
                  {branch.manager ? (
                    <div className="detail-grid cv-settings-grid">
                      <DetailField label="Name">{branch.manager.full_name}</DetailField>
                      <DetailField label="Employee Code">{branch.manager.employee_code}</DetailField>
                      <DetailField label="Mobile">{branch.manager.mobile}</DetailField>
                      <DetailField label="Email">{branch.manager.email}</DetailField>
                    </div>
                  ) : (
                    <div className="cv-empty-inline">
                      <Icon name="users" size={22} />
                      <p>No Manager Assigned</p>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </>
        )}
      </div>

      {editOpen && branch && (
        <BranchFormModal
          mode="edit"
          companyId={companyId}
          branchId={branchId}
          initialValues={{
            branch_name: branch.branch_name ?? "",
            branch_code: branch.branch_code ?? "",
            address: branch.address ?? "",
            city: branch.city ?? "",
            state: branch.state ?? "",
            country: branch.country ?? "",
            pincode: branch.pincode ?? "",
            phone: branch.phone ?? "",
            email: branch.email ?? "",
            manager_id: branch.manager?.id ?? "",
          }}
          onClose={() => setEditOpen(false)}
          onSuccess={() => {
            setEditOpen(false);
            setRetryKey((k) => k + 1);
            setToast({ tone: "success", message: "Branch updated successfully." });
          }}
        />
      )}

      {toast && <Toast tone={toast.tone} message={toast.message} onDismiss={() => setToast(null)} />}
    </>
  );
}

function BranchViewSkeleton() {
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
        {Array.from({ length: 2 }).map((_, i) => (
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
                {Array.from({ length: 4 }).map((__, j) => (
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
