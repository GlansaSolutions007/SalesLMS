import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Topbar from "../../../components/Topbar.jsx";
import Icon from "../../../components/Icon.jsx";
import Badge from "../../../components/Badge.jsx";
import FormField from "../../../components/FormField.jsx";
import Skeleton from "../../../components/Skeleton.jsx";
import Toast from "../../../components/Toast.jsx";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";
import FormTextField from "../../../components/FormTextField.jsx";
import FormSelectField from "../../../components/FormSelectField.jsx";
import LogoUploader from "../../../components/LogoUploader.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { getCompanyById, updateCompany, ApiError, ApiValidationError } from "../../../services/api/companyApi.js";
import { resolveApiAssetUrl } from "../../../utils/apiAssetUrl.js";
import { ROUTES, companyViewPath } from "../../../router/routePaths.js";
import { INDUSTRIES } from "../companyData.js";
import { COUNTRIES, STATES_BY_COUNTRY, CITIES_BY_STATE } from "../../../data/locations.js";
import { PAYMENT_TONE, formatDate, formatStorage, formatWeeklyOff, DetailField } from "../companyDisplay.jsx";
import { editCompanySchema } from "./schema.js";
import "./EditCompanyPage.css";

const STATUS_OPTIONS = ["Active", "Inactive"];

function companyToFormValues(company) {
  return {
    company_name: company.company_name ?? "",
    company_code: company.company_code ?? "",
    legal_name: company.legal_name ?? "",
    registration_number: company.registration_number ?? "",
    gst_number: company.gst_number ?? "",
    pan_number: company.pan_number ?? "",
    industry_type: company.industry_type ?? "",
    website: company.website ?? "",
    status: company.status ?? "Active",
    email: company.email ?? "",
    mobile: company.mobile ?? "",
    phone: company.phone ?? "",
    address_line1: company.address_line1 ?? "",
    address_line2: company.address_line2 ?? "",
    city: company.city ?? "",
    state: company.state ?? "",
    country: company.country ?? "",
    pincode: company.pincode ?? "",
    logo: null,
  };
}

function buildUpdateFormData(values, logoRemoved) {
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (key === "logo") {
      if (value instanceof File) formData.append("logo", value);
      else if (logoRemoved) formData.append("logo", "");
      return;
    }
    if (value === null || value === undefined) return;
    formData.append(key, value);
  });
  return formData;
}

export default function EditCompanyPage() {
  const { id } = useParams();
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [status, setStatus] = useState("loading"); // loading | notFound | error | success
  const [company, setCompany] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [logoRemoved, setLogoRemoved] = useState(false);

  const {
    control,
    watch,
    setValue,
    setError,
    reset,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: yupResolver(editCompanySchema),
    defaultValues: companyToFormValues({}),
  });

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    getCompanyById(id, token)
      .then((data) => {
        if (cancelled) return;
        setCompany(data);
        reset(companyToFormValues(data));
        setLogoRemoved(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token, retryKey]);

  const country = watch("country");
  const state = watch("state");
  const stateOptions = STATES_BY_COUNTRY[country] ?? [];
  const cityOptions = CITIES_BY_STATE[state] ?? [];

  function handleBack() {
    navigate(companyViewPath(id));
  }

  function handleReset() {
    if (isDirty || logoRemoved) {
      setConfirmReset(true);
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setSaving(true);
    try {
      await updateCompany(id, buildUpdateFormData(values, logoRemoved), token);
      setToast({ tone: "success", message: "Company updated successfully." });
      setTimeout(() => navigate(ROUTES.COMPANY_COMPANIES), 850);
    } catch (error) {
      if (error instanceof ApiValidationError) {
        Object.entries(error.errors).forEach(([field, messages]) => {
          setError(field, { type: "server", message: messages[0] });
        });
        setToast({ tone: "error", message: error.message || "Please fix the highlighted fields below." });
      } else {
        const message = error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
        setToast({ tone: "error", message });
      }
    } finally {
      setSaving(false);
    }
  });

  return (
    <>
      <Topbar
        onMenuClick={toggleCollapsed}
        searchPlaceholder="Search..."
        notifications={3}
        messages={5}
      />

      <div className="cl-body wizard-page-body ec-body">
        <div className="wizard-sticky-header">
          <div className="wizard-header-text">
            <h1>Edit Company</h1>
            <p className="cl-breadcrumb">
              <span>Dashboard</span>
              <Icon name="chevronRight" size={13} />
              <span>Company Management</span>
              <Icon name="chevronRight" size={13} />
              <span>Companies</span>
              <Icon name="chevronRight" size={13} />
              <span className="is-current">Edit Company</span>
            </p>
          </div>

          <div className="ec-header-actions">
            <button type="button" className="cl-btn" onClick={handleBack} disabled={saving}>
              <Icon name="back" size={15} />
              Back
            </button>
            <button type="button" className="cl-btn" onClick={handleReset} disabled={saving || status !== "success"}>
              <Icon name="refresh" size={15} />
              Reset
            </button>
            <button type="button" className="dash-primary-btn" onClick={onSubmit} disabled={saving || status !== "success"}>
              {saving ? <span className="fa-spinner light" /> : <Icon name="check" size={15} />}
              Save Changes
            </button>
          </div>
        </div>

        {status === "loading" && <EditCompanySkeleton />}

        {status === "notFound" && (
          <div className="panel ec-state-panel">
            <Icon name="building" size={28} />
            <h3>Company not found</h3>
            <p>We couldn't find a company with this ID. It may have been removed.</p>
            <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.COMPANY_COMPANIES)}>
              Back to Companies
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="panel ec-state-panel">
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
          <form className="ec-columns" onSubmit={(e) => e.preventDefault()}>
            <div className="ec-main-col">
              <section className="panel ec-section">
                <h3 className="ec-section-title">Company Information</h3>

                <div className="form-logo-row">
                  <LogoUploader
                    control={control}
                    name="logo"
                    label="Company Logo"
                    hint="PNG, JPG or SVG, up to 2MB"
                    initialPreviewUrl={resolveApiAssetUrl(company.logo)}
                    onRemove={() => setLogoRemoved(true)}
                  />
                </div>

                <div className="form-row">
                  <FormTextField control={control} name="company_name" label="Company Name" required error={errors.company_name?.message} />
                  <FormTextField control={control} name="company_code" label="Company Code" error={errors.company_code?.message} />
                </div>

                <div className="form-row">
                  <FormTextField control={control} name="legal_name" label="Legal Name" error={errors.legal_name?.message} />
                  <FormSelectField
                    control={control}
                    name="industry_type"
                    label="Industry Type"
                    required
                    options={INDUSTRIES}
                    error={errors.industry_type?.message}
                  />
                </div>

                <div className="form-row">
                  <FormTextField control={control} name="website" label="Website" placeholder="https://example.com" error={errors.website?.message} />
                  <FormField label="Status">
                    <div className="seg-group">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          type="button"
                          key={opt}
                          className={`seg-chip${watch("status") === opt ? ` is-active ${opt === "Active" ? "tone-success" : "tone-warning"}` : ""}`}
                          onClick={() => setValue("status", opt, { shouldDirty: true })}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </FormField>
                </div>
              </section>

              <section className="panel ec-section">
                <h3 className="ec-section-title">Registration Details</h3>
                <div className="form-row">
                  <FormTextField
                    control={control}
                    name="registration_number"
                    label="Registration Number"
                    error={errors.registration_number?.message}
                  />
                  <FormTextField control={control} name="gst_number" label="GST Number" maxLength={15} error={errors.gst_number?.message} />
                </div>
                <FormTextField control={control} name="pan_number" label="PAN Number" maxLength={10} error={errors.pan_number?.message} />
              </section>

              <section className="panel ec-section">
                <h3 className="ec-section-title">Contact Information</h3>
                <div className="form-row">
                  <FormTextField control={control} name="email" label="Email" type="email" required error={errors.email?.message} />
                  <FormTextField control={control} name="mobile" label="Mobile" required error={errors.mobile?.message} />
                </div>
                <FormTextField control={control} name="phone" label="Phone" error={errors.phone?.message} />
              </section>

              <section className="panel ec-section">
                <h3 className="ec-section-title">Address Information</h3>
                <FormTextField control={control} name="address_line1" label="Address Line 1" required error={errors.address_line1?.message} />
                <FormTextField control={control} name="address_line2" label="Address Line 2" error={errors.address_line2?.message} />

                <div className="form-row">
                  <FormSelectField
                    control={control}
                    name="country"
                    label="Country"
                    required
                    options={COUNTRIES}
                    error={errors.country?.message}
                    onValueChange={() => {
                      setValue("state", "", { shouldDirty: true });
                      setValue("city", "", { shouldDirty: true });
                    }}
                  />
                  <FormSelectField
                    control={control}
                    name="state"
                    label="State"
                    required
                    options={stateOptions}
                    error={errors.state?.message}
                    disabled={!country}
                    placeholder={country ? "Select state" : "Select country first"}
                    onValueChange={() => setValue("city", "", { shouldDirty: true })}
                  />
                </div>

                <div className="form-row">
                  <FormSelectField
                    control={control}
                    name="city"
                    label="City"
                    required
                    options={cityOptions}
                    error={errors.city?.message}
                    disabled={!state}
                    placeholder={state ? "Select city" : "Select state first"}
                  />
                  <FormTextField control={control} name="pincode" label="Pincode" required maxLength={10} error={errors.pincode?.message} />
                </div>
              </section>
            </div>

            <div className="ec-side-col">
              <section className="panel ec-section">
                <h3 className="ec-section-title">
                  Subscription Information <span className="ec-readonly-tag">Read Only</span>
                </h3>
                {company.active_subscription ? (
                  <div className="detail-grid ec-readonly-grid">
                    <DetailField label="Plan Name">{company.active_subscription.plan?.plan_name}</DetailField>
                    <DetailField label="Subscription Number">{company.active_subscription.subscription_no}</DetailField>
                    <DetailField label="Start Date">{formatDate(company.active_subscription.start_date)}</DetailField>
                    <DetailField label="End Date">{formatDate(company.active_subscription.end_date)}</DetailField>
                    <DetailField label="Employee Limit">{company.active_subscription.employee_limit}</DetailField>
                    <DetailField label="Trainer Limit">{company.active_subscription.trainer_limit}</DetailField>
                    <DetailField label="Storage Limit">{formatStorage(company.active_subscription.storage_limit)}</DetailField>
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
                  <div className="ec-empty-inline">
                    <Icon name="coin" size={22} />
                    <p>No Subscription Available</p>
                  </div>
                )}
              </section>

              <section className="panel ec-section">
                <h3 className="ec-section-title">
                  Company Settings <span className="ec-readonly-tag">Read Only</span>
                </h3>
                <div className="detail-grid ec-readonly-grid">
                  <DetailField label="Timezone">{company.settings?.timezone}</DetailField>
                  <DetailField label="Language">{company.settings?.language?.toUpperCase()}</DetailField>
                  <DetailField label="Currency">{company.settings?.currency}</DetailField>
                  <DetailField label="Office Timing">
                    {company.settings?.office_start_time && company.settings?.office_end_time
                      ? `${company.settings.office_start_time} – ${company.settings.office_end_time}`
                      : null}
                  </DetailField>
                  <DetailField label="Weekly Off">{formatWeeklyOff(company.settings?.weekly_off_days)}</DetailField>
                </div>
              </section>
            </div>
          </form>
        )}
      </div>

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />

      {confirmReset && (
        <ConfirmDialog
          title="Reset changes?"
          message="This will discard your edits and reload the saved company details."
          confirmLabel="Reset"
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            reset(companyToFormValues(company));
            setLogoRemoved(false);
            setConfirmReset(false);
          }}
        />
      )}
    </>
  );
}

function EditCompanySkeleton() {
  return (
    <div className="ec-columns">
      <div className="ec-main-col">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="panel ec-section" key={i}>
            <Skeleton width="30%" height={16} className="ec-skeleton-gap" />
            <Skeleton width={140} height={96} radius={14} className="ec-skeleton-gap" />
            <div className="form-row" style={{ marginTop: 14 }}>
              <Skeleton height={44} />
              <Skeleton height={44} />
            </div>
          </div>
        ))}
      </div>
      <div className="ec-side-col">
        {Array.from({ length: 2 }).map((_, i) => (
          <div className="panel ec-section" key={i}>
            <Skeleton width="50%" height={16} className="ec-skeleton-gap" />
            <div className="detail-grid ec-readonly-grid">
              {Array.from({ length: 4 }).map((__, j) => (
                <Skeleton key={j} height={38} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
