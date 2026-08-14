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
import { DetailField } from "../company/companyDisplay.jsx";
import "./SubscriptionPlanList.css";

const BILLING_CYCLES = ["Monthly", "Quarterly", "Half Yearly", "Yearly"];
const STATUS_VALUES = ["Active", "Inactive"];

const EMPTY_FORM = {
  plan_name: "",
  billing_cycle: "Monthly",
  price_per_employee: "",
  description: "",
  status: "Active",
  is_unlimited_employees: false,
  employee_limit: "",
};

function formatPricePerEmployee(value) {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "—";
  return num.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
}

function formatEmployeeLimit(value) {
  return value === null || value === undefined || value === "" ? "Unlimited" : value;
}

const COLUMNS = [
  {
    key: "plan_name",
    header: "Plan Name",
    render: (r) => <b style={{ color: "var(--color-heading)" }}>{r.plan_name}</b>,
  },
  {
    key: "billing_cycle",
    header: "Billing Cycle",
    render: (r) => <Badge tone={r.billing_cycle === "Monthly" ? "blue" : "purple"}>{r.billing_cycle || "—"}</Badge>,
  },
  {
    key: "price_per_employee",
    header: "Price Per Employee",
    render: (r) => <span className="cl-numeric">{formatPricePerEmployee(r.price_per_employee)}</span>,
  },
  {
    key: "employee_limit",
    header: "Employee Limit",
    render: (r) => <span className="cl-numeric">{formatEmployeeLimit(r.employee_limit)}</span>,
  },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge tone={getStatusTone(r.status)}>{r.status || "Unknown"}</Badge>,
  },
];

const PAGE_SIZE = 10;
const STATUS_OPTIONS = ["All", "Active", "Inactive"];
const SEARCH_DEBOUNCE_MS = 400;
const DEFAULT_PAGINATION = { total: 0, per_page: PAGE_SIZE, current_page: 1, last_page: 1 };

function normalizePlanList(response) {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (payload?.data && Array.isArray(payload.data.data)) return payload.data.data;

  return [];
}

function normalizePagination(response) {
  const payload = response?.data ?? response;
  return payload?.data?.pagination ?? null;
}

function getStatusTone(status) {
  const value = String(status || "").toLowerCase();
  if (value === "active") return "green";
  if (value === "inactive" || value === "paused") return "gray";
  return "blue";
}

function validateForm(form) {
  const errors = {};
  if (!form.plan_name.trim()) errors.plan_name = "Plan name is required.";
  if (!form.billing_cycle) errors.billing_cycle = "Select a billing cycle.";
  if (!form.price_per_employee || Number(form.price_per_employee) <= 0)
    errors.price_per_employee = "Enter a price greater than zero.";
  if (!form.is_unlimited_employees && (!form.employee_limit || Number(form.employee_limit) <= 0))
    errors.employee_limit = "Enter a valid employee limit, or select Unlimited Employees.";
  return errors;
}

export default function SubscriptionPlanList() {
  const { toggleCollapsed } = useOutletContext();
  const { token } = useAuth();

  const [plans, setPlans] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  const [modalMode, setModalMode] = useState(null); // "add" | "edit" | null
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [viewingRow, setViewingRow] = useState(null);

  // Debounce the raw keystrokes before they drive a request.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // Any filter/search change invalidates the current page.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const params = {
        page,
        per_page: PAGE_SIZE,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(statusFilter !== "All" ? { status: statusFilter } : {}),
      };
      const res = await getSubscriptionPlans(params, token);
      setPlans(normalizePlanList(res));
      setPagination(normalizePagination(res) ?? DEFAULT_PAGINATION);
    } catch {
      setApiError("Could not load subscription plans. Please try again.");
      setPlans([]);
      setPagination(DEFAULT_PAGINATION);
    } finally {
      setIsLoading(false);
    }
  }, [token, page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const pageItems = Array.isArray(plans) ? plans : [];
  const totalPages = Math.max(1, pagination.last_page || 1);

  function openAdd() {
    setForm({ ...EMPTY_FORM });
    setFormErrors({});
    setEditingId(null);
    setModalMode("add");
  }

  function openEdit(row) {
    setForm({
      plan_name: row.plan_name ?? "",
      billing_cycle: row.billing_cycle ?? "Monthly",
      price_per_employee: String(row.price_per_employee ?? ""),
      description: row.description ?? "",
      status: row.status ?? "Active",
      is_unlimited_employees: row.employee_limit === null || row.employee_limit === undefined,
      employee_limit: row.employee_limit != null ? String(row.employee_limit) : "",
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

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validateForm(form);
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }
    const payload = {
      plan_name: form.plan_name.trim(),
      billing_cycle: form.billing_cycle,
      price_per_employee: Number(form.price_per_employee),
      description: form.description.trim() || null,
      status: form.status,
      // NULL employee_limit = Unlimited Employees — never a magic number.
      is_unlimited_employees: form.is_unlimited_employees,
      employee_limit: form.is_unlimited_employees ? null : Number(form.employee_limit),
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
      setDeletingId(null);
      fetchPlans();
    } catch {
      // silent – the row stays in the table; a toast system can be wired later
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
            aria-label={`View ${row.plan_name}`}
            onClick={() => setViewingRow(row)}
          >
            <Icon name="eye" size={15} />
          </button>
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
            onSearchChange={setSearch}
            searchPlaceholder="Search plans..."
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            statusOptions={STATUS_OPTIONS}
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

          {!isLoading && pagination.total > 0 && (
            <div className="cl-footer">
              <p>Showing {pageItems.length} of {pagination.total} plans</p>
              <Pagination page={pagination.current_page} totalPages={totalPages} onPageChange={setPage} />
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
            <div className="sp-grid-3">
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
              <FormField label="Billing Cycle" error={formErrors.billing_cycle}>
                <select
                  value={form.billing_cycle}
                  onChange={(e) => setField("billing_cycle", e.target.value)}
                >
                  {BILLING_CYCLES.map((cycle) => (
                    <option key={cycle} value={cycle}>{cycle}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Price Per Employee (₹)" error={formErrors.price_per_employee}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price_per_employee}
                  onChange={(e) => setField("price_per_employee", e.target.value)}
                  placeholder="299.00"
                />
              </FormField>
              <FormField label="Status">
                <select
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value)}
                >
                  {STATUS_VALUES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </FormField>
              <div style={{ gridColumn: "1 / -1" }}>
                <FormField label="Description (Optional)">
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    placeholder="Describe what's included in this plan..."
                  />
                </FormField>
              </div>
            </div>

            <div className="sp-section-label">Limits</div>
            <div className="sp-grid-2">
              <FormField label="Maximum Employees" error={formErrors.employee_limit}>
                <input
                  type="number"
                  min="1"
                  value={form.employee_limit}
                  onChange={(e) => setField("employee_limit", e.target.value)}
                  placeholder="100"
                  disabled={form.is_unlimited_employees}
                />
              </FormField>
              <label className="sp-feature-item sp-unlimited-toggle">
                <input
                  type="checkbox"
                  checked={form.is_unlimited_employees}
                  onChange={(e) => setField("is_unlimited_employees", e.target.checked)}
                />
                Unlimited Employees
              </label>
            </div>
          </form>
        </Modal>
      )}

      {viewingRow && (
        <Modal
          title={viewingRow.plan_name}
          onClose={() => setViewingRow(null)}
          footer={
            <button type="button" className="cl-btn" onClick={() => setViewingRow(null)}>
              Close
            </button>
          }
        >
          <div className="detail-grid">
            <DetailField label="Plan Name">{viewingRow.plan_name}</DetailField>
            <DetailField label="Billing Cycle">{viewingRow.billing_cycle}</DetailField>
            <DetailField label="Price Per Employee">{formatPricePerEmployee(viewingRow.price_per_employee)}</DetailField>
            <DetailField label="Employee Limit">{formatEmployeeLimit(viewingRow.employee_limit)}</DetailField>
            <DetailField label="Description">{viewingRow.description}</DetailField>
            <DetailField label="Status">
              <Badge tone={getStatusTone(viewingRow.status)}>{viewingRow.status ?? "—"}</Badge>
            </DetailField>
          </div>
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
