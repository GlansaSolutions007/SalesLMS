import { useEffect, useState } from "react";
import { useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Icon from "../../components/Icon.jsx";
import FormField from "../../components/FormField.jsx";
import Toast from "../../components/Toast.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getCompanies,
  getCompanyBatch,
  createCompanyBatch,
  updateCompanyBatch,
  ApiValidationError,
  ApiError,
} from "../../services/api/companyApi.js";
import { getTrainers } from "../../services/api/trainersApi.js";
import { ROUTES } from "../../router/routePaths.js";
import BatchEnrollments from "./BatchEnrollments.jsx";
import "./BatchForm.css";

const UNEDITABLE_STATUSES = new Set(["Completed", "Cancelled"]);

// Server field name -> local form field name, for mapping 422 validation
// errors back onto the right input.
const FIELD_MAP = {
  batch_name: "batchName",
  batch_code: "batchCode",
  trainer_id: "trainerId",
  start_date: "startDate",
  end_date: "endDate",
  max_strength: "maxStrength",
};

function buildEmptyForm(lockedCompanyId) {
  return {
    companyId: lockedCompanyId ?? "",
    batchName: "",
    batchCode: "",
    trainerId: "",
    startDate: "",
    endDate: "",
    maxStrength: "",
  };
}

function mapBatchToForm(batch) {
  return {
    companyId: batch.company_id ?? "",
    batchName: batch.batch_name ?? "",
    batchCode: batch.batch_code ?? "",
    trainerId: batch.trainer_id ?? "",
    startDate: batch.start_date ? String(batch.start_date).slice(0, 10) : "",
    endDate: batch.end_date ? String(batch.end_date).slice(0, 10) : "",
    maxStrength: batch.max_strength != null ? String(batch.max_strength) : "",
  };
}

export default function BatchForm() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { roleName, user, token } = useAuth();

  const isEdit = Boolean(params.batchId);
  const routeCompanyId = params.companyId ? Number(params.companyId) : null;
  const routeBatchId = params.batchId ? Number(params.batchId) : null;

  const fromCompanyId = location.state?.companyId ?? null;
  const isSuperAdmin = roleName === "Super Admin";
  const showCompanyDropdown = !isEdit && isSuperAdmin && !fromCompanyId;
  const lockedCompanyId = isEdit ? routeCompanyId : (fromCompanyId ?? (!isSuperAdmin ? user?.company?.id ?? null : null));

  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState("");
  const [lockedStatus, setLockedStatus] = useState(null);
  const [form, setForm] = useState(() => buildEmptyForm(lockedCompanyId));
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(showCompanyDropdown);
  const [companiesError, setCompaniesError] = useState("");

  const [trainers, setTrainers] = useState([]);
  const [trainersLoading, setTrainersLoading] = useState(true);
  const [trainersError, setTrainersError] = useState("");

  // Load the existing batch when editing.
  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;
    setLoading(true);
    setLoadError("");

    getCompanyBatch(routeCompanyId, routeBatchId, token)
      .then((batch) => {
        if (cancelled) return;
        if (UNEDITABLE_STATUSES.has(batch.status)) {
          setLockedStatus(batch.status);
        }
        setForm(mapBatchToForm(batch));
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message ?? "Could not load this batch.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isEdit, routeCompanyId, routeBatchId, token]);

  // Companies — Super Admin picks one when adding directly; every other path
  // (editing, opened from a company's batch list, or a non-Super-Admin) is locked.
  useEffect(() => {
    if (!showCompanyDropdown) return undefined;
    let cancelled = false;
    setCompaniesLoading(true);
    setCompaniesError("");
    getCompanies({ per_page: 100, sort: "company_name", dir: "asc" }, token)
      .then((result) => {
        if (!cancelled) setCompanies(result.items);
      })
      .catch((error) => {
        if (!cancelled) setCompaniesError(error.message ?? "Could not load companies.");
      })
      .finally(() => {
        if (!cancelled) setCompaniesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showCompanyDropdown, token]);

  // Trainers — global roster, not company-scoped.
  useEffect(() => {
    let cancelled = false;
    setTrainersLoading(true);
    setTrainersError("");
    getTrainers({ per_page: 100, sort: "full_name", dir: "asc" }, token)
      .then((result) => {
        if (!cancelled) setTrainers(result.items);
      })
      .catch((error) => {
        if (!cancelled) setTrainersError(error.message ?? "Could not load trainers.");
      })
      .finally(() => {
        if (!cancelled) setTrainersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  function setField(key, value) {
    setDirty(true);
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validate() {
    const next = {};
    if (showCompanyDropdown && !form.companyId) next.companyId = "Select a company.";
    if (!form.batchName.trim()) next.batchName = "Batch name is required.";
    if (form.endDate && form.startDate && form.endDate < form.startDate) {
      next.endDate = "End date can't be before the start date.";
    }
    if (form.maxStrength !== "" && (Number(form.maxStrength) < 1 || Number(form.maxStrength) > 500)) {
      next.maxStrength = "Max strength must be between 1 and 500.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      setToast({ tone: "error", message: "Please fix the highlighted fields before saving." });
      return;
    }

    const activeCompanyId = isEdit ? routeCompanyId : form.companyId;
    const payload = {
      batch_name: form.batchName.trim(),
      batch_code: form.batchCode.trim() || null,
      trainer_id: form.trainerId || null,
      start_date: form.startDate || null,
      end_date: form.endDate || null,
      max_strength: form.maxStrength === "" ? null : Number(form.maxStrength),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateCompanyBatch(activeCompanyId, routeBatchId, payload, token);
      } else {
        await createCompanyBatch(activeCompanyId, payload, token);
      }
      setToast({ tone: "success", message: isEdit ? "Batch updated successfully." : "Batch created successfully." });
      setTimeout(() => navigate(ROUTES.BATCHES), 850);
    } catch (error) {
      if (error instanceof ApiValidationError) {
        const nextErrors = {};
        Object.entries(error.errors ?? {}).forEach(([field, messages]) => {
          const key = FIELD_MAP[field] ?? field;
          nextErrors[key] = Array.isArray(messages) ? messages[0] : messages;
        });
        setErrors((prev) => ({ ...prev, ...nextErrors }));
        setToast({ tone: "error", message: error.message || "Please fix the highlighted fields below." });
      } else {
        const message = error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
        setToast({ tone: "error", message });
      }
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (dirty) {
      setConfirmCancel(true);
    } else {
      navigate(ROUTES.BATCHES);
    }
  }

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body wizard-page-body">
        <div className="wizard-sticky-header">
          <div className="wizard-header-text">
            <button type="button" className="cl-btn wizard-back-btn" onClick={handleCancel}>
              <Icon name="back" size={15} />
              Back to Batches
            </button>
            <h1>{isEdit ? "Edit Batch" : "Add Batch"}</h1>
            <p className="cl-breadcrumb">
              <span>Dashboard</span>
              <Icon name="chevronRight" size={13} />
              <span>Training</span>
              <Icon name="chevronRight" size={13} />
              <span>Batches</span>
              <Icon name="chevronRight" size={13} />
              <span className="is-current">{isEdit ? "Edit Batch" : "Add Batch"}</span>
            </p>
          </div>
        </div>

        {loading ? (
          <div className="panel wizard-panel">
            <p>Loading…</p>
          </div>
        ) : loadError ? (
          <div className="panel wizard-panel">
            <p className="rl-api-error">{loadError}</p>
            <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.BATCHES)}>
              Back to Batches
            </button>
          </div>
        ) : lockedStatus ? (
          <div className="panel wizard-panel">
            <p className="rl-api-error">A {lockedStatus} batch cannot be edited.</p>
            <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.BATCHES)}>
              Back to Batches
            </button>
          </div>
        ) : (
          <div className="panel wizard-panel">
            <div className="wizard-panel-inner">
              <form id="batch-form" className="form-fields-stack" onSubmit={handleSubmit}>
                {showCompanyDropdown && (
                  <FormField label="Company *" error={errors.companyId}>
                    <select
                      value={form.companyId}
                      onChange={(e) => setField("companyId", e.target.value)}
                      disabled={companiesLoading || Boolean(companiesError)}
                    >
                      <option value="">
                        {companiesLoading ? "Loading companies..." : companiesError ? "Could not load companies" : "Select company"}
                      </option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.company_name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                )}

                <div className="form-row">
                  <FormField label="Batch Name *" error={errors.batchName}>
                    <input
                      type="text"
                      value={form.batchName}
                      onChange={(e) => setField("batchName", e.target.value)}
                      placeholder="e.g. Batch A — Jan 2026"
                    />
                  </FormField>
                  <FormField label="Batch Code" error={errors.batchCode}>
                    <input
                      type="text"
                      value={form.batchCode}
                      onChange={(e) => setField("batchCode", e.target.value)}
                      placeholder="Auto-generated if left blank"
                    />
                  </FormField>
                </div>

                <FormField label="Trainer" error={errors.trainerId}>
                  <select
                    value={form.trainerId}
                    onChange={(e) => setField("trainerId", e.target.value)}
                    disabled={trainersLoading || Boolean(trainersError)}
                  >
                    <option value="">
                      {trainersLoading ? "Loading trainers..." : trainersError ? "Could not load trainers" : "Unassigned"}
                    </option>
                    {trainers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <div className="form-row">
                  <FormField label="Start Date" error={errors.startDate}>
                    <input type="date" value={form.startDate} onChange={(e) => setField("startDate", e.target.value)} />
                  </FormField>
                  <FormField label="End Date" error={errors.endDate}>
                    <input type="date" value={form.endDate} onChange={(e) => setField("endDate", e.target.value)} />
                  </FormField>
                </div>

                <FormField label="Max Strength" error={errors.maxStrength}>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={form.maxStrength}
                    onChange={(e) => setField("maxStrength", e.target.value)}
                    placeholder="Optional seat cap"
                  />
                </FormField>
              </form>

              <div className="wizard-step-footer">
                <div className="wizard-step-footer-left">
                  <button type="button" className="cl-btn" onClick={handleCancel} disabled={saving}>
                    Cancel
                  </button>
                </div>
                <div className="wizard-step-footer-right">
                  <button type="submit" form="batch-form" className="dash-primary-btn" disabled={saving}>
                    {saving ? <span className="fa-spinner light" /> : <Icon name="check" size={15} />}
                    {isEdit ? "Save Changes" : "Save Batch"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isEdit && !loading && !loadError && (
          <BatchEnrollments companyId={routeCompanyId} batchId={routeBatchId} />
        )}
      </div>

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />

      {confirmCancel && (
        <ConfirmDialog
          title="Discard changes?"
          message="You have unsaved changes. Leaving now will discard them."
          confirmLabel="Discard"
          onCancel={() => setConfirmCancel(false)}
          onConfirm={() => {
            setConfirmCancel(false);
            navigate(ROUTES.BATCHES);
          }}
        />
      )}
    </>
  );
}
