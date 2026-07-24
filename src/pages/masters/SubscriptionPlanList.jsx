import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import Icon from "../../components/Icon.jsx";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Badge from "../../components/Badge.jsx";
import DataTable from "../../components/DataTable.jsx";
import DataToolbar from "../../components/DataToolbar.jsx";
import Pagination from "../../components/Pagination.jsx";
import Modal from "../../components/Modal.jsx";
import FormField from "../../components/FormField.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import MastersTabs from "./MastersTabs.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
} from "../../services/subscriptionService.js";
import "./SubscriptionPlanList.css";

const FEATURE_KEYS = [
  "employee_management",
  "trainer_management",
  "attendance_management",
  "payroll_management",
  "performance_management",
  "learning_management",
  "assessment_management",
  "discussion_forums",
  "reports_and_analytics",
  "api_access",
  "custom_branding",
  "priority_support",
];

const FEATURE_LABELS = {
  employee_management: "Employee Management",
  trainer_management: "Trainer Management",
  attendance_management: "Attendance Management",
  payroll_management: "Payroll Management",
  performance_management: "Performance Management",
  learning_management: "Learning Management",
  assessment_management: "Assessment Management",
  discussion_forums: "Discussion Forums",
  reports_and_analytics: "Reports & Analytics",
  api_access: "API Access",
  custom_branding: "Custom Branding",
  priority_support: "Priority Support",
};

const EMPTY_FEATURES = Object.fromEntries(FEATURE_KEYS.map((k) => [k, false]));

const EMPTY_FORM = {
  plan_name: "",
  duration_months: "",
  employee_limit: "",
  trainer_limit: "",
  storage_limit: "",
  price: "",
  features: { ...EMPTY_FEATURES },
};

const COLUMNS = [
  {
    key: "plan_name",
    header: "Plan Name",
    render: (r) => <b style={{ color: "var(--color-heading)" }}>{r.plan_name}</b>,
  },
  {
    key: "duration_months",
    header: "Duration",
    render: (r) => `${r.duration_months} month${r.duration_months !== 1 ? "s" : ""}`,
  },
  {
    key: "price",
    header: "Price",
    render: (r) => (
      <span className="cl-numeric">
        {Number(r.price).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
      </span>
    ),
  },
  {
    key: "employee_limit",
    header: "Employees",
    render: (r) => r.employee_limit,
  },
  {
    key: "trainer_limit",
    header: "Trainers",
    render: (r) => r.trainer_limit,
  },
  {
    key: "storage_limit",
    header: "Storage",
    render: (r) => {
      const gb = (r.storage_limit / 1024).toFixed(0);
      return `${gb} GB`;
    },
  },
  {
    key: "features",
    header: "Features",
    render: (r) => {
      const count = Object.values(r.features || {}).filter(Boolean).length;
      return <Badge tone="blue">{count} / {FEATURE_KEYS.length}</Badge>;
    },
  },
];

const PAGE_SIZE = 10;

function validateForm(form) {
  const errors = {};
  if (!form.plan_name.trim()) errors.plan_name = "Plan name is required.";
  if (!form.duration_months || Number(form.duration_months) <= 0)
    errors.duration_months = "Enter a valid duration.";
  if (!form.employee_limit || Number(form.employee_limit) <= 0)
    errors.employee_limit = "Enter a valid employee limit.";
  if (!form.trainer_limit || Number(form.trainer_limit) <= 0)
    errors.trainer_limit = "Enter a valid trainer limit.";
  if (!form.storage_limit || Number(form.storage_limit) <= 0)
    errors.storage_limit = "Enter a valid storage limit.";
  if (!form.price || Number(form.price) <= 0) errors.price = "Enter a valid price.";
  return errors;
}

export default function SubscriptionPlanList() {
  const { toggleCollapsed } = useOutletContext();
  const { token } = useAuth();

  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [modalMode, setModalMode] = useState(null); // "add" | "edit" | null
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await getSubscriptionPlans(token);
      const raw = res.data?.data ?? res.data;
      setPlans(Array.isArray(raw) ? raw : []);
    } catch {
      setApiError("Could not load subscription plans. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const filtered = (Array.isArray(plans) ? plans : []).filter((p) =>
    p.plan_name?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openAdd() {
    setForm({ ...EMPTY_FORM, features: { ...EMPTY_FEATURES } });
    setFormErrors({});
    setEditingId(null);
    setModalMode("add");
  }

  function openEdit(row) {
    setForm({
      plan_name: row.plan_name ?? "",
      duration_months: String(row.duration_months ?? ""),
      employee_limit: String(row.employee_limit ?? ""),
      trainer_limit: String(row.trainer_limit ?? ""),
      storage_limit: String(row.storage_limit ?? ""),
      price: String(row.price ?? ""),
      features: { ...EMPTY_FEATURES, ...(row.features ?? {}) },
    });
    setFormErrors({});
    setEditingId(row.id);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditingId(null);
  }

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleFeature(key) {
    setForm((f) => ({ ...f, features: { ...f.features, [key]: !f.features[key] } }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validateForm(form);
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }
    const payload = {
      plan_name: form.plan_name.trim(),
      duration_months: Number(form.duration_months),
      employee_limit: Number(form.employee_limit),
      trainer_limit: Number(form.trainer_limit),
      storage_limit: Number(form.storage_limit),
      price: Number(form.price),
      features: form.features,
    };
    setSaving(true);
    try {
      if (modalMode === "add") {
        await createSubscriptionPlan(payload, token);
      } else {
        await updateSubscriptionPlan(editingId, payload, token);
      }
      closeModal();
      fetchPlans();
    } catch {
      setFormErrors({ _api: "Failed to save. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteSubscriptionPlan(deletingId, token);
      setPlans((prev) => prev.filter((p) => p.id !== deletingId));
    } catch {
      // silent – the row stays in the table; a toast system can be wired later
    } finally {
      setDeletingId(null);
    }
  }

  const tableColumns = [
    ...COLUMNS,
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="cl-row-actions">
          <button
            type="button"
            className="dash-icon-btn"
            aria-label={`Edit ${row.plan_name}`}
            onClick={() => openEdit(row)}
          >
            <Icon name="edit" size={15} />
          </button>
          <button
            type="button"
            className="dash-icon-btn"
            aria-label={`Delete ${row.plan_name}`}
            onClick={() => setDeletingId(row.id)}
          >
            <Icon name="trash" size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Topbar
        onMenuClick={toggleCollapsed}
        searchPlaceholder="Search..."
        notifications={3}
        messages={5}
        user={{ name: "Admin", role: "Super Admin", initials: "SA" }}
      />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Subscription Plans</h1>
            <Breadcrumb current="All Plans" />
          </div>
        </div>

        <MastersTabs />

        <div className="panel cl-panel">
          <DataToolbar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder="Search plans..."
            sort={{ key: "plan_name", dir: "asc" }}
            onSortChange={() => {}}
            addLabel="Add New Plan"
            onAdd={openAdd}
          />

          {apiError && (
            <p className="sp-api-error">{apiError}</p>
          )}

          <DataTable
            columns={tableColumns}
            rows={pageItems}
            isLoading={isLoading}
            emptyMessage="No subscription plans found."
          />

          {!isLoading && filtered.length > 0 && (
            <div className="cl-footer">
              <p>Showing {pageItems.length} of {filtered.length} plans</p>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {modalMode && (
        <Modal
          title={modalMode === "add" ? "Add New Subscription Plan" : "Edit Subscription Plan"}
          onClose={closeModal}
          size="lg"
          footer={
            <>
              <button type="button" className="cl-btn" onClick={closeModal}>
                Cancel
              </button>
              <button
                type="submit"
                form="sp-form"
                className="dash-primary-btn cl-add-btn"
                disabled={saving}
              >
                {saving ? "Saving…" : modalMode === "add" ? "Add Plan" : "Save Changes"}
              </button>
            </>
          }
        >
          <form id="sp-form" onSubmit={handleSubmit}>
            {formErrors._api && <p className="sp-api-error">{formErrors._api}</p>}

            <div className="sp-section-label">Plan Details</div>
            <div className="sp-grid-2">
              <div style={{ gridColumn: "1 / -1" }}>
                <FormField label="Plan Name" error={formErrors.plan_name}>
                  <input
                    type="text"
                    value={form.plan_name}
                    onChange={(e) => setField("plan_name", e.target.value)}
                    placeholder="e.g. Professional Plan"
                  />
                </FormField>
              </div>
              <FormField label="Duration (months)" error={formErrors.duration_months}>
                <input
                  type="number"
                  min="1"
                  value={form.duration_months}
                  onChange={(e) => setField("duration_months", e.target.value)}
                  placeholder="12"
                />
              </FormField>
              <FormField label="Price (₹)" error={formErrors.price}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setField("price", e.target.value)}
                  placeholder="4999.00"
                />
              </FormField>
            </div>

            <div className="sp-section-label">Limits</div>
            <div className="sp-grid-3">
              <FormField label="Employee Limit" error={formErrors.employee_limit}>
                <input
                  type="number"
                  min="1"
                  value={form.employee_limit}
                  onChange={(e) => setField("employee_limit", e.target.value)}
                  placeholder="100"
                />
              </FormField>
              <FormField label="Trainer Limit" error={formErrors.trainer_limit}>
                <input
                  type="number"
                  min="1"
                  value={form.trainer_limit}
                  onChange={(e) => setField("trainer_limit", e.target.value)}
                  placeholder="10"
                />
              </FormField>
              <FormField label="Storage Limit (MB)" error={formErrors.storage_limit}>
                <input
                  type="number"
                  min="1"
                  value={form.storage_limit}
                  onChange={(e) => setField("storage_limit", e.target.value)}
                  placeholder="2048"
                />
              </FormField>
            </div>

            <div className="sp-section-label">Features</div>
            <div className="sp-features-grid">
              {FEATURE_KEYS.map((key) => (
                <label key={key} className="sp-feature-item">
                  <input
                    type="checkbox"
                    checked={form.features[key]}
                    onChange={() => toggleFeature(key)}
                  />
                  <span>{FEATURE_LABELS[key]}</span>
                </label>
              ))}
            </div>
          </form>
        </Modal>
      )}

      {deletingId !== null && (
        <ConfirmDialog
          title="Delete Subscription Plan"
          message="This will permanently remove this plan. This action cannot be undone."
          onCancel={() => setDeletingId(null)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}
