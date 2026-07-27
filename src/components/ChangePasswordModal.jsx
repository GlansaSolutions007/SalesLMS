import { useState } from "react";
import Modal from "./Modal.jsx";
import FormField from "./FormField.jsx";
import Icon from "./Icon.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import "./ChangePasswordModal.css";

export default function ChangePasswordModal({ onClose }) {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  function validate() {
    const next = {};
    if (!currentPassword) next.currentPassword = "Current password is required.";
    if (!password) next.password = "New password is required.";
    else if (password.length < 8) next.password = "Password must be at least 8 characters.";
    if (!confirmPassword) next.confirmPassword = "Please confirm the new password.";
    else if (confirmPassword !== password) next.confirmPassword = "Passwords do not match.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;

    setSaving(true);
    try {
      await changePassword({
        current_password: currentPassword,
        password,
        password_confirmation: confirmPassword,
      });
      setSuccess(true);
    } catch (error) {
      if (error?.errors) {
        const fieldErrors = {};
        Object.entries(error.errors).forEach(([field, messages]) => {
          if (field === "current_password") fieldErrors.currentPassword = messages[0];
          if (field === "password") fieldErrors.password = messages[0];
          if (field === "password_confirmation") fieldErrors.confirmPassword = messages[0];
        });
        setErrors(fieldErrors);
      }
      setApiError(error?.message || "Could not change your password. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Change Password"
      onClose={onClose}
      footer={
        success ? (
          <button type="button" className="dash-primary-btn" onClick={onClose}>
            Done
          </button>
        ) : (
          <>
            <button type="button" className="cl-btn" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="change-password-form" className="dash-primary-btn" disabled={saving}>
              {saving ? "Saving…" : "Change Password"}
            </button>
          </>
        )
      }
    >
      {success ? (
        <p className="confirm-message">Your password has been changed successfully.</p>
      ) : (
        <form id="change-password-form" onSubmit={handleSubmit}>
          <FormField label="Current Password *" error={errors.currentPassword}>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoFocus />
          </FormField>
          <FormField label="New Password *" error={errors.password}>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </FormField>
          <FormField label="Confirm New Password *" error={errors.confirmPassword}>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </FormField>
          {apiError && (
            <p className="form-alert-box">
              <Icon name="warning" size={15} />
              {apiError}
            </p>
          )}
        </form>
      )}
    </Modal>
  );
}
