import { useState } from "react";
import FormField from "../../../components/FormField.jsx";
import ProgressBar from "../../../components/ProgressBar.jsx";
import Icon from "../../../components/Icon.jsx";
import { passwordStrength } from "../employeeFormValidation.js";
import { EMPLOYEE_STATUSES } from "../employeeFormData.js";

const STATUS_TONE = { Active: "tone-success", Inactive: "tone-warning", Resigned: "tone-warning", Terminated: "tone-danger" };

export default function ContactInfoFields({ data, errors, onChange }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const strength = passwordStrength(data.password);

  return (
    <div className="form-fields-stack">
      <div className="form-row">
        <FormField label="Email *" error={errors.email}>
          <input type="email" value={data.email} onChange={(e) => onChange("email", e.target.value)} placeholder="employee@company.com" />
        </FormField>
        <FormField label="Mobile *" error={errors.mobile}>
          <input type="text" value={data.mobile} onChange={(e) => onChange("mobile", e.target.value)} placeholder="+1 415 555 0100" />
        </FormField>
      </div>

      <FormField label="Username *" error={errors.username}>
        <input type="text" value={data.username} onChange={(e) => onChange("username", e.target.value)} placeholder="e.g. jane.doe" />
      </FormField>

      <div className="form-row">
        <FormField label="Password *" error={errors.password}>
          <div className="form-password-input">
            <input
              type={showPassword ? "text" : "password"}
              value={data.password}
              onChange={(e) => onChange("password", e.target.value)}
              placeholder="Minimum 8 characters"
            />
            <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label="Toggle password visibility">
              <Icon name="eye" size={16} />
            </button>
          </div>
          {data.password && (
            <div className="form-password-strength">
              <ProgressBar value={strength.score * 25} tone={strength.tone} showLabel={false} />
              <span className={`form-strength-label tone-${strength.tone}`}>{strength.label}</span>
            </div>
          )}
        </FormField>
        <FormField label="Confirm Password *" error={errors.confirmPassword}>
          <div className="form-password-input">
            <input
              type={showConfirm ? "text" : "password"}
              value={data.confirmPassword}
              onChange={(e) => onChange("confirmPassword", e.target.value)}
              placeholder="Re-enter password"
            />
            <button type="button" onClick={() => setShowConfirm((s) => !s)} aria-label="Toggle password visibility">
              <Icon name="eye" size={16} />
            </button>
          </div>
        </FormField>
      </div>

      <FormField label="Status">
        <div className="seg-group">
          {EMPLOYEE_STATUSES.map((opt) => (
            <button
              type="button"
              key={opt}
              className={`seg-chip${data.status === opt ? ` is-active ${STATUS_TONE[opt]}` : ""}`}
              onClick={() => onChange("status", opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </FormField>
    </div>
  );
}
