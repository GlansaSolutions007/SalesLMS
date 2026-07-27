import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Icon from "../../components/Icon.jsx";
import Badge from "../../components/Badge.jsx";
import Avatar from "../../components/Avatar.jsx";
import StatCard from "../../components/StatCard.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getCompanyById, ApiError } from "../../services/api/companyApi.js";
import { resolveApiAssetUrl } from "../../utils/apiAssetUrl.js";
import { ROUTES, companyEditPath } from "../../router/routePaths.js";
import { PAYMENT_TONE, formatDate, formatStorage, formatCurrency, formatWeeklyOff, DetailField } from "./companyDisplay.jsx";
import "./CompanyView.css";

export default function CompanyView() {
  const { id } = useParams();
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [status, setStatus] = useState("loading"); // loading | notFound | error | success
  const [company, setCompany] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    getCompanyById(id, token)
      .then((data) => {
        if (cancelled) return;
        setCompany(data);
        setStatus("success");
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) {
          setStatus("notFound");
        } else {
          setErrorMessage(error.message ?? "Could not load this company.");
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, token, retryKey]);

  return (
    <>
      <Topbar
        onMenuClick={toggleCollapsed}
        searchPlaceholder="Search..."
        notifications={3}
        messages={5}
      />

      <div className="cl-body wizard-page-body cv-body">
        <div className="cv-header">
          <div>
            <h1>Company Details</h1>
            <p className="cl-breadcrumb">
              <span>Dashboard</span>
              <Icon name="chevronRight" size={13} />
              <span>Company Management</span>
              <Icon name="chevronRight" size={13} />
              <span>Companies</span>
              <Icon name="chevronRight" size={13} />
              <span className="is-current">View Company</span>
            </p>
          </div>

          <div className="cv-header-actions">
            <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.COMPANY_COMPANIES)}>
              <Icon name="back" size={15} />
              Back
            </button>
            <button type="button" className="dash-primary-btn" onClick={() => navigate(companyEditPath(id))}>
              <Icon name="edit" size={15} />
              Edit Company
            </button>
          </div>
        </div>

        {status === "loading" && <CompanyViewSkeleton />}

        {status === "notFound" && (
          <div className="panel cv-state-panel">
            <Icon name="building" size={28} />
            <h3>Company not found</h3>
            <p>We couldn't find a company with this ID. It may have been removed.</p>
            <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.COMPANY_COMPANIES)}>
              Back to Companies
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="panel cv-state-panel">
            <Icon name="warning" size={28} />
            <h3>Couldn't load this company</h3>
            <p>{errorMessage}</p>
            <button type="button" className="cl-btn" onClick={() => setRetryKey((k) => k + 1)}>
              <Icon name="refresh" size={15} />
              Try Again
            </button>
          </div>
        )}

        {status === "success" && company && (
          <>
            <div className="panel cv-profile-card">
              <Avatar src={resolveApiAssetUrl(company.logo)} name={company.company_name} size={72} shape="square" />
              <div className="cv-profile-info">
                <div className="cv-profile-title">
                  <h2>{company.company_name}</h2>
                  <Badge tone={company.status === "Active" ? "green" : "gray"}>{company.status ?? "—"}</Badge>
                </div>
                <p className="cv-profile-code">{company.company_code}</p>
                <div className="cv-profile-meta">
                  <span>
                    <Icon name="building" size={14} />
                    {company.industry_type || "—"}
                  </span>
                  {company.website && (
                    <a href={company.website} target="_blank" rel="noreferrer">
                      <Icon name="globe" size={14} />
                      {company.website}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="cv-stats-grid">
              <StatCard icon="users" label="Employees" value={company.employees_count ?? 0} tone="blue" />
              <StatCard icon="building" label="Branches" value={company.branches_count ?? 0} tone="purple" />
              <StatCard icon="gridView" label="Departments" value={company.departments_count ?? 0} tone="green" />
              <StatCard icon="clipboard" label="Designations" value={company.designations_count ?? 0} tone="orange" />
            </div>

            <div className="cv-columns">
              <div className="cv-main-col">
                <section className="panel cv-section">
                  <h3 className="cv-section-title">Company Information</h3>
                  <div className="detail-grid">
                    <DetailField label="Legal Name">{company.legal_name}</DetailField>
                    <DetailField label="Registration Number">{company.registration_number}</DetailField>
                    <DetailField label="GST Number">{company.gst_number}</DetailField>
                    <DetailField label="PAN Number">{company.pan_number}</DetailField>
                    <DetailField label="Email">{company.email}</DetailField>
                    <DetailField label="Mobile">{company.mobile}</DetailField>
                    <DetailField label="Phone">{company.phone}</DetailField>
                  </div>
                </section>

                <section className="panel cv-section">
                  <h3 className="cv-section-title">Address</h3>
                  <div className="detail-grid">
                    <DetailField label="Address Line 1">{company.address_line1}</DetailField>
                    <DetailField label="Address Line 2">{company.address_line2}</DetailField>
                    <DetailField label="City">{company.city}</DetailField>
                    <DetailField label="State">{company.state}</DetailField>
                    <DetailField label="Country">{company.country}</DetailField>
                    <DetailField label="Pincode">{company.pincode}</DetailField>
                  </div>
                </section>

                <section className="panel cv-section">
                  <h3 className="cv-section-title">Subscription Details</h3>
                  {company.active_subscription ? (
                    <div className="detail-grid">
                      <DetailField label="Plan Name">{company.active_subscription.plan?.plan_name}</DetailField>
                      <DetailField label="Subscription Number">{company.active_subscription.subscription_no}</DetailField>
                      <DetailField label="Start Date">{formatDate(company.active_subscription.start_date)}</DetailField>
                      <DetailField label="End Date">{formatDate(company.active_subscription.end_date)}</DetailField>
                      <DetailField label="Employee Limit">{company.active_subscription.employee_limit}</DetailField>
                      <DetailField label="Trainer Limit">{company.active_subscription.trainer_limit}</DetailField>
                      <DetailField label="Storage Limit">{formatStorage(company.active_subscription.storage_limit)}</DetailField>
                      <DetailField label="Amount">{formatCurrency(company.active_subscription.amount)}</DetailField>
                      <DetailField label="Payment Status">
                        <Badge tone={PAYMENT_TONE[company.active_subscription.payment_status] ?? "gray"}>
                          {company.active_subscription.payment_status ?? "—"}
                        </Badge>
                      </DetailField>
                      <DetailField label="Subscription Status">
                        <Badge tone={company.active_subscription.status === "Active" ? "green" : "gray"}>
                          {company.active_subscription.status ?? "—"}
                        </Badge>
                      </DetailField>
                    </div>
                  ) : (
                    <div className="cv-empty-inline">
                      <Icon name="coin" size={22} />
                      <p>No Subscription Available</p>
                    </div>
                  )}
                </section>
              </div>

              <div className="cv-side-col">
                <section className="panel cv-section">
                  <h3 className="cv-section-title">Company Settings</h3>
                  <div className="detail-grid cv-settings-grid">
                    <DetailField label="Timezone">{company.settings?.timezone}</DetailField>
                    <DetailField label="Language">{company.settings?.language?.toUpperCase()}</DetailField>
                    <DetailField label="Currency">{company.settings?.currency}</DetailField>
                    <DetailField label="Date Format">{company.settings?.date_format}</DetailField>
                    <DetailField label="Office Start Time">{company.settings?.office_start_time}</DetailField>
                    <DetailField label="Office End Time">{company.settings?.office_end_time}</DetailField>
                    <DetailField label="Weekly Off">{formatWeeklyOff(company.settings?.weekly_off_days)}</DetailField>
                  </div>
                </section>

                <section className="panel cv-section">
                  <h3 className="cv-section-title">Created Information</h3>
                  <div className="detail-grid cv-settings-grid">
                    <DetailField label="Created By">{company.created_by?.name}</DetailField>
                    <DetailField label="Created Email">{company.created_by?.email}</DetailField>
                    <DetailField label="Created Date">{formatDate(company.created_at)}</DetailField>
                    <DetailField label="Last Updated">{formatDate(company.updated_at)}</DetailField>
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function CompanyViewSkeleton() {
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
        {Array.from({ length: 4 }).map((_, i) => (
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
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="panel cv-section" key={i}>
              <Skeleton width="30%" height={16} className="cv-skeleton-gap" />
              <div className="detail-grid">
                {Array.from({ length: 6 }).map((__, j) => (
                  <Skeleton key={j} height={38} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="cv-side-col">
          {Array.from({ length: 2 }).map((_, i) => (
            <div className="panel cv-section" key={i}>
              <Skeleton width="50%" height={16} className="cv-skeleton-gap" />
              <div className="detail-grid cv-settings-grid">
                {Array.from({ length: 4 }).map((__, j) => (
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
