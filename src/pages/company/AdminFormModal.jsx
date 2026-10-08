import { useState } from "react";
import Modal from "../../components/Modal.jsx";
import FormField from "../../components/FormField.jsx";
import Icon from "../../components/Icon.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { passwordStrength } from "../../utils/formValidators.js";
import { createCompanyAdmin, updateCompanyAdmin, ApiValidationError } from "../../services/api/companyApi.js";

const EMPTY_FORM = { name: "", username: "", email: "", mobile: "", password: "", confirmPassword: "" };

export default function AdminFormModal({ mode, companyId, companies = [], adminId, initialValues, onClose, onSuccess }) {
  const { token } = useAuth();
  const [form, setForm] = useState({ ...EMPTY_FORM, company_id: String(companyId ?? ""), ...initialValues });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isEdit = mode === "edit";
  const strength = passwordStrength(form.password);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const errors = {};
    if (!form.name.trim()) errors.name = "Name is required.";
    if (!isEdit && !form.username.trim()) errors.username = "Username is required.";
    if (!form.email.trim()) errors.email = "Email is required.";
    if (!isEdit && !form.company_id) errors.company_id = "Company is required.";
    if (!isEdit && !form.password.trim()) errors.password = "Password is required.";
    else if (!isEdit && passwordStrength(form.password).score < 3) errors.password = "Password is too weak.";
    if (!isEdit && !form.confirmPassword.trim()) errors.confirmPassword = "Please confirm the password.";
    else if (!isEdit && form.password !== form.confirmPassword) errors.confirmPassword = "Passwords do not match.";
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
        onSuccess(data, companyId);
      } else {
        const payload = {
          name: form.name.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          mobile: form.mobile.trim(),
          password: form.password.trim(),
        };
        const data = await createCompanyAdmin(form.company_id, payload, token);
        if (data?.temp_password) {
          setTempPassword(data.temp_password);
          return;
        }
        onSuccess(data, form.company_id);
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
        onClose={() => onSuccess(null, form.company_id)}
        footer={
          <button type="button" className="dash-primary-btn" onClick={() => onSuccess(null, form.company_id)}>
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

        {!isEdit && (
          <FormField label="Company *" error={formErrors.company_id}>
            <select value={form.company_id} onChange={(e) => setField("company_id", e.target.value)}>
              <option value="">Select a company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.company_name}</option>
              ))}
            </select>
          </FormField>
        )}

        <FormField label="Full Name *" error={formErrors.name}>
          <input type="text" value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. Priya Sharma" />
        </FormField>

        <div className="form-row">
          <FormField label={isEdit ? "Username" : "Username *"} error={formErrors.username}>
            <input type="text" value={form.username} onChange={(e) => setField("username", e.target.value)} placeholder="e.g. priya.sharma" />
          </FormField>
          <FormField label="Email *" error={formErrors.email}>
            <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} />
          </FormField>
        </div>

        <FormField label="Mobile" error={formErrors.mobile}>
          <input type="tel" value={form.mobile} onChange={(e) => setField("mobile", e.target.value)} />
        </FormField>

        {!isEdit && (
          <div className="form-row">
            <FormField label="Password *" error={formErrors.password}>
              <div className="form-password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder="Minimum 8 characters"
                />
                <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label="Toggle password visibility">
                  <Icon name="eye" size={16} />
                </button>
              </div>
              {form.password && (
                <div className="form-password-strength">
                  <ProgressBar value={strength.score * 25} tone={strength.tone} showLabel={false} />
                  <span className={`form-strength-label tone-${strength.tone}`}>{strength.label}</span>
                </div>
              )}
            </FormField>
            <FormField label="Confirm Password *" error={formErrors.confirmPassword}>
              <div className="form-password-input">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => setField("confirmPassword", e.target.value)}
                  placeholder="Re-enter password"
                />
                <button type="button" onClick={() => setShowConfirm((s) => !s)} aria-label="Toggle password visibility">
                  <Icon name="eye" size={16} />
                </button>
              </div>
            </FormField>
          </div>
        )}
      </form>
    </Modal>
  );
}
