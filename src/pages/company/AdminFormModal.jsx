import { useState } from "react";
import Modal from "../../components/Modal.jsx";
import FormField from "../../components/FormField.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { createCompanyAdmin, updateCompanyAdmin, ApiValidationError } from "../../services/api/companyApi.js";

const EMPTY_FORM = { name: "", username: "", email: "", mobile: "", password: "" };

export default function AdminFormModal({ mode, companyId, adminId, initialValues, onClose, onSuccess }) {
  const { token } = useAuth();
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initialValues });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);

  const isEdit = mode === "edit";

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const errors = {};
    if (!form.name.trim()) errors.name = "Name is required.";
    if (!isEdit && !form.username.trim()) errors.username = "Username is required.";
    if (!form.email.trim()) errors.email = "Email is required.";
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    setFormErrors({});
    try {
      if (isEdit) {
        const payload = { name: form.name.trim(), username: form.username.trim(), email: form.email.trim(), mobile: form.mobile.trim() };
        const data = await updateCompanyAdmin(companyId, adminId, payload, token);
        onSuccess(data);
      } else {
        const payload = { name: form.name.trim(), username: form.username.trim(), email: form.email.trim(), mobile: form.mobile.trim() };
        if (form.password.trim()) payload.password = form.password.trim();
        const data = await createCompanyAdmin(companyId, payload, token);
        if (data?.temp_password) {
          setTempPassword(data.temp_password);
          return;
        }
        onSuccess(data);
      }
    } catch (err) {
      if (err instanceof ApiValidationError) {
        const fieldErrors = {};
        Object.entries(err.errors ?? {}).forEach(([field, messages]) => {
          fieldErrors[field] = Array.isArray(messages) ? messages[0] : messages;
        });
        setFormErrors(fieldErrors);
      } else {
        setFormErrors({ _api: err.message ?? `Could not ${isEdit ? "update" : "create"} this admin. Please try again.` });
      }
    } finally {
      setSaving(false);
    }
  }

  if (tempPassword) {
    return (
      <Modal
        title="Admin Created"
        onClose={() => onSuccess(null)}
        footer={
          <button type="button" className="dash-primary-btn" onClick={() => onSuccess(null)}>
            Done
          </button>
        }
      >
        <p>
          The company admin account was created. Share this temporary password with them securely — it will not be shown again:
        </p>
        <p className="rl-api-error" style={{ background: "var(--color-surface-alt)", color: "var(--color-heading)", fontFamily: "monospace", fontSize: 16 }}>
          {tempPassword}
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      title={isEdit ? "Edit Admin" : "Add Company Admin"}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="cl-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="admin-form" className="dash-primary-btn cl-add-btn" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Admin"}
          </button>
        </>
      }
    >
      <form id="admin-form" onSubmit={handleSubmit}>
        {formErrors._api && <p className="rl-api-error">{formErrors._api}</p>}

        <FormField label="Full Name" error={formErrors.name}>
          <input type="text" value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. Priya Sharma" />
        </FormField>

        <div className="form-row">
          <FormField label="Username" error={formErrors.username}>
            <input type="text" value={form.username} onChange={(e) => setField("username", e.target.value)} placeholder="e.g. priya.sharma" />
          </FormField>
          <FormField label="Email" error={formErrors.email}>
            <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} />
          </FormField>
        </div>

        <FormField label="Mobile" error={formErrors.mobile}>
          <input type="tel" value={form.mobile} onChange={(e) => setField("mobile", e.target.value)} />
        </FormField>

        {!isEdit && (
          <FormField label="Password (optional)" error={formErrors.password}>
            <input
              type="text"
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              placeholder="Leave blank to auto-generate a temporary password"
            />
          </FormField>
        )}
      </form>
    </Modal>
  );
}
