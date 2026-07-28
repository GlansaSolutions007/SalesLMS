import { useEffect, useState } from "react";
import Modal from "../../components/Modal.jsx";
import FormField from "../../components/FormField.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import useCompanyBranches from "./useCompanyBranches.js";
import useCompanyEmployeeOptions from "../employees/useCompanyEmployeeOptions.js";
import { createCompanyDepartment, updateCompanyDepartment, getCompanyById, ApiValidationError } from "../../services/api/companyApi.js";

const EMPTY_FORM = {
  department_name: "",
  department_code: "",
  description: "",
  branch_id: "",
  department_head: "",
};

// Shared Add/Edit form — used from both the Departments list (row action /
// toolbar) and the Department View page (Edit button), so a save from either
// place behaves identically. Mirrors BranchFormModal's shape.
export default function DepartmentFormModal({ mode, companyId, departmentId, initialValues, onClose, onSuccess }) {
  const { token, roleName } = useAuth();
  const isSuperAdmin = roleName === "Super Admin";
  const { branches, isLoading: branchesLoading } = useCompanyBranches(companyId);
  const { options: employees, isLoading: employeesLoading } = useCompanyEmployeeOptions(companyId);
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initialValues });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState("");

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
    if (!form.department_name.trim()) errors.department_name = "Department name is required.";
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      department_name: form.department_name.trim(),
      description: form.description.trim(),
    };
    if (form.department_code.trim()) payload.department_code = form.department_code.trim();
    payload.branch_id = form.branch_id ? Number(form.branch_id) : null;
    payload.department_head = form.department_head.toString().trim() ? Number(form.department_head) : null;

    setSaving(true);
    setFormErrors({});
    try {
      const data = isEdit
        ? await updateCompanyDepartment(companyId, departmentId, payload, token)
        : await createCompanyDepartment(companyId, payload, token);
      onSuccess(data);
    } catch (err) {
      if (err instanceof ApiValidationError) {
        const fieldErrors = {};
        Object.entries(err.errors ?? {}).forEach(([field, messages]) => {
          fieldErrors[field] = Array.isArray(messages) ? messages[0] : messages;
        });
        setFormErrors(fieldErrors);
      } else {
        setFormErrors({ _api: err.message ?? `Could not ${isEdit ? "update" : "create"} this department. Please try again.` });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={isEdit ? "Edit Department" : "Add Department"}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button type="button" className="cl-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="department-form" className="dash-primary-btn cl-add-btn" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Department"}
          </button>
        </>
      }
    >
      <form id="department-form" onSubmit={handleSubmit}>
        {formErrors._api && <p className="rl-api-error">{formErrors._api}</p>}

        {isSuperAdmin && (
          <FormField label="Company">
            <select value={companyId} disabled>
              <option value={companyId}>{companyName || "Loading…"}</option>
            </select>
          </FormField>
        )}

        <div className="form-row">
          <FormField label="Department Name" error={formErrors.department_name}>
            <input
              type="text"
              value={form.department_name}
              onChange={(e) => setField("department_name", e.target.value)}
              placeholder="e.g. Sales"
            />
          </FormField>
          <FormField label="Department Code" error={formErrors.department_code}>
            <input
              type="text"
              value={form.department_code}
              onChange={(e) => setField("department_code", e.target.value)}
              placeholder="Auto-generated if left blank"
            />
          </FormField>
        </div>

        <FormField label="Description" error={formErrors.description}>
          <textarea rows={3} value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="What this department is responsible for" />
        </FormField>

        <div className="form-row">
          <FormField label="Branch" error={formErrors.branch_id}>
            <select value={form.branch_id} onChange={(e) => setField("branch_id", e.target.value)} disabled={branchesLoading}>
              <option value="">{branchesLoading ? "Loading branches…" : "No branch (company-wide)"}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.branch_name} ({b.branch_code})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Department Head" error={formErrors.department_head}>
            <select value={form.department_head} onChange={(e) => setField("department_head", e.target.value)} disabled={employeesLoading}>
              <option value="">{employeesLoading ? "Loading employees…" : employees.length ? "No head assigned" : "No employees found for this company"}</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} — {emp.designation?.designation_name ?? "—"}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </form>
    </Modal>
  );
}
