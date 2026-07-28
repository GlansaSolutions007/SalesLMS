import { useEffect, useState } from "react";
import Modal from "../../components/Modal.jsx";
import FormField from "../../components/FormField.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { createCompanyDesignation, updateCompanyDesignation, getCompanyById, ApiValidationError } from "../../services/api/companyApi.js";

const EMPTY_FORM = {
  designation_name: "",
  designation_code: "",
  description: "",
  hierarchy_level: "",
};

// Shared Add/Edit form — used from both the Designations list (row action /
// toolbar) and the Designation View page (Edit button). Mirrors
// DepartmentFormModal/BranchFormModal's shape.
export default function DesignationFormModal({ mode, companyId, designationId, initialValues, onClose, onSuccess }) {
  const { token } = useAuth();
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initialValues });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState("");

  const isEdit = mode === "edit";

  useEffect(() => {
    let cancelled = false;
    if (!companyId) return undefined;

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
  }, [companyId, token]);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const errors = {};
    if (!form.designation_name.trim()) errors.designation_name = "Designation name is required.";
    if (form.hierarchy_level.toString().trim() && Number.isNaN(Number(form.hierarchy_level))) {
      errors.hierarchy_level = "Hierarchy level must be a number.";
    }
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      designation_name: form.designation_name.trim(),
      description: form.description.trim(),
    };
    if (form.designation_code.trim()) payload.designation_code = form.designation_code.trim();
    payload.hierarchy_level = form.hierarchy_level.toString().trim() ? Number(form.hierarchy_level) : 0;

    setSaving(true);
    setFormErrors({});
    try {
      const data = isEdit
        ? await updateCompanyDesignation(companyId, designationId, payload, token)
        : await createCompanyDesignation(companyId, payload, token);
      onSuccess(data);
    } catch (err) {
      if (err instanceof ApiValidationError) {
        const fieldErrors = {};
        Object.entries(err.errors ?? {}).forEach(([field, messages]) => {
          fieldErrors[field] = Array.isArray(messages) ? messages[0] : messages;
        });
        setFormErrors(fieldErrors);
      } else {
        setFormErrors({ _api: err.message ?? `Could not ${isEdit ? "update" : "create"} this designation. Please try again.` });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={isEdit ? "Edit Designation" : "Add Designation"}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button type="button" className="cl-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="designation-form" className="dash-primary-btn cl-add-btn" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Designation"}
          </button>
        </>
      }
    >
      <form id="designation-form" onSubmit={handleSubmit}>
        {formErrors._api && <p className="rl-api-error">{formErrors._api}</p>}

        <FormField label="Company">
          <select value={companyId} disabled>
            <option value={companyId}>{companyName || "Loading…"}</option>
          </select>
        </FormField>

        <div className="form-row">
          <FormField label="Designation Name" error={formErrors.designation_name}>
            <input
              type="text"
              value={form.designation_name}
              onChange={(e) => setField("designation_name", e.target.value)}
              placeholder="e.g. Senior Sales Executive"
            />
          </FormField>
          <FormField label="Designation Code" error={formErrors.designation_code}>
            <input
              type="text"
              value={form.designation_code}
              onChange={(e) => setField("designation_code", e.target.value)}
              placeholder="Auto-generated if left blank"
            />
          </FormField>
        </div>

        <FormField label="Description" error={formErrors.description}>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            placeholder="What this role is responsible for"
          />
        </FormField>

        <FormField label="Hierarchy Level" error={formErrors.hierarchy_level}>
          <input
            type="number"
            min="0"
            value={form.hierarchy_level}
            onChange={(e) => setField("hierarchy_level", e.target.value)}
            placeholder="0 = highest, e.g. 0 for Director, 3 for Executive"
          />
        </FormField>
      </form>
    </Modal>
  );
}
