import { useEffect, useState } from "react";
import Modal from "../../components/Modal.jsx";
import FormField from "../../components/FormField.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { createCompanyBranch, updateCompanyBranch, getCompanyById, ApiValidationError } from "../../services/api/companyApi.js";
import useCompanyEmployeeOptions from "../employees/useCompanyEmployeeOptions.js";

const EMPTY_FORM = {
  branch_name: "",
  branch_code: "",
  address: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
  phone: "",
  email: "",
  manager_id: "",
};

// Shared Add/Edit form — used from both the Branches list (row action /
// toolbar) and the Branch View page (Edit button), so a save from either
// place behaves identically.
export default function BranchFormModal({ mode, companyId, branchId, initialValues, onClose, onSuccess }) {
  const { token, roleName } = useAuth();
  const isSuperAdmin = roleName === "Super Admin";
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initialValues });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState("");

  const { options: managers, isLoading: managersLoading } = useCompanyEmployeeOptions(companyId);

  const isEdit = mode === "edit";

  useEffect(() => {
    let cancelled = false;
    if (!isSuperAdmin || !companyId) return undefined;

    getCompanyById(companyId, token)
      .then((company) => {
        if (!cancelled) setCompanyName(company?.company_name ?? "");
      })
      .catch(() => {
        if (!cancelled) setCompanyName("");
      });

    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin, companyId, token]);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const errors = {};
    if (!form.branch_name.trim()) errors.branch_name = "Branch name is required.";
    if (!form.branch_code.trim()) errors.branch_code = "Branch code is required.";
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      branch_name: form.branch_name.trim(),
      branch_code: form.branch_code.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      country: form.country.trim(),
      pincode: form.pincode.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
    };
    if (form.manager_id) payload.manager_id = Number(form.manager_id);

    setSaving(true);
    setFormErrors({});
    try {
      const data = isEdit
        ? await updateCompanyBranch(companyId, branchId, payload, token)
        : await createCompanyBranch(companyId, payload, token);
      onSuccess(data);
    } catch (err) {
      if (err instanceof ApiValidationError) {
        const fieldErrors = {};
        Object.entries(err.errors ?? {}).forEach(([field, messages]) => {
          fieldErrors[field] = Array.isArray(messages) ? messages[0] : messages;
        });
        setFormErrors(fieldErrors);
      } else {
        setFormErrors({ _api: err.message ?? `Could not ${isEdit ? "update" : "create"} this branch. Please try again.` });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={isEdit ? "Edit Branch" : "Add Branch"}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button type="button" className="cl-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="branch-form" className="dash-primary-btn cl-add-btn" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Branch"}
          </button>
        </>
      }
    >
      <form id="branch-form" onSubmit={handleSubmit}>
        {formErrors._api && <p className="rl-api-error">{formErrors._api}</p>}

        {isSuperAdmin && (
          <FormField label="Company">
            <select value={companyId} disabled>
              <option value={companyId}>{companyName || "Loading…"}</option>
            </select>
          </FormField>
        )}

        <div className="form-row">
          <FormField label="Branch Name" error={formErrors.branch_name}>
            <input type="text" value={form.branch_name} onChange={(e) => setField("branch_name", e.target.value)} placeholder="e.g. Hyderabad Branch" />
          </FormField>
          <FormField label="Branch Code" error={formErrors.branch_code}>
            <input type="text" value={form.branch_code} onChange={(e) => setField("branch_code", e.target.value)} placeholder="e.g. HYD001" />
          </FormField>
        </div>

        <FormField label="Address" error={formErrors.address}>
          <input type="text" value={form.address} onChange={(e) => setField("address", e.target.value)} placeholder="e.g. HiTech City" />
        </FormField>

        <div className="form-row">
          <FormField label="City" error={formErrors.city}>
            <input type="text" value={form.city} onChange={(e) => setField("city", e.target.value)} />
          </FormField>
          <FormField label="State" error={formErrors.state}>
            <input type="text" value={form.state} onChange={(e) => setField("state", e.target.value)} />
          </FormField>
        </div>

        <div className="form-row">
          <FormField label="Country" error={formErrors.country}>
            <input type="text" value={form.country} onChange={(e) => setField("country", e.target.value)} />
          </FormField>
          <FormField label="Pincode" error={formErrors.pincode}>
            <input type="text" value={form.pincode} onChange={(e) => setField("pincode", e.target.value)} />
          </FormField>
        </div>

        <div className="form-row">
          <FormField label="Phone" error={formErrors.phone}>
            <input type="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
          </FormField>
          <FormField label="Email" error={formErrors.email}>
            <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} />
          </FormField>
        </div>

        <FormField label="Branch Manager" error={formErrors.manager_id}>
          <select value={form.manager_id} onChange={(e) => setField("manager_id", e.target.value)} disabled={managersLoading}>
            <option value="">{managersLoading ? "Loading employees…" : managers.length ? "No manager assigned" : "No employees found for this company"}</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name} — {m.designation?.designation_name ?? "—"}
              </option>
            ))}
          </select>
        </FormField>
      </form>
    </Modal>
  );
}
