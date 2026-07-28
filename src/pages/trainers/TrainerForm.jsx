import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon.jsx";
import FormField from "../../components/FormField.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import Toast from "../../components/Toast.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { createTrainer, addTrainerSkill, ApiValidationError } from "../../services/api/trainersApi.js";
import { ROUTES } from "../../router/routePaths.js";
import { EMAIL_REGEX, MOBILE_REGEX, passwordStrength } from "../../utils/formValidators.js";
import { SKILL_LEVELS } from "../employees/employeeFormData.js";
import "../employees/EmployeeForm.css";

const GENDERS = ["Male", "Female", "Other"];

function uid() {
  return `skill-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildInitialForm() {
  return {
    trainer_code: "",
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    gender: "",
    date_of_birth: "",
    joining_date: "",
    qualification: "",
    specialization: "",
    experience_years: "",
    bio: "",
    profile_photo: null,
  };
}

function validate(data, createLogin, loginPassword, confirmPassword) {
  const errors = {};
  if (!data.first_name.trim()) errors.first_name = "First name is required.";
  if (!data.email.trim()) errors.email = "Email is required.";
  else if (!EMAIL_REGEX.test(data.email)) errors.email = "Enter a valid email address.";
  if (data.mobile && !MOBILE_REGEX.test(data.mobile)) errors.mobile = "Enter a valid mobile number.";
  if (data.experience_years !== "" && (isNaN(Number(data.experience_years)) || Number(data.experience_years) < 0))
    errors.experience_years = "Enter a valid number of years.";
  if (createLogin) {
    if (!loginPassword) errors.login_password = "Password is required.";
    else if (passwordStrength(loginPassword).score < 3) errors.login_password = "Password is too weak.";
    if (loginPassword !== confirmPassword) errors.confirm_password = "Passwords do not match.";
  }
  return errors;
}

export default function TrainerForm() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [formData, setFormData] = useState(buildInitialForm);
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const [createLogin, setCreateLogin] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [addSkills, setAddSkills] = useState(false);
  const [skills, setSkills] = useState([]);

  function update(field, value) {
    setDirty(true);
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  function addSkillRow() {
    setSkills((prev) => [...prev, { id: uid(), skill_name: "", skill_level: "Beginner", experience_years: "", certification: "" }]);
  }

  function removeSkillRow(id) {
    setSkills((prev) => prev.filter((s) => s.id !== id));
  }

  function changeSkillRow(id, field, value) {
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  async function handleSave() {
    const errs = validate(formData, createLogin, loginPassword, confirmPassword);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setToast({ tone: "error", message: "Please fix the highlighted fields." });
      return;
    }

    setSaving(true);

    const fd = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      if (val !== null && val !== "") {
        if (key === "profile_photo" && val instanceof File) fd.append(key, val);
        else if (key !== "profile_photo") fd.append(key, val);
      }
    });

    if (createLogin) {
      fd.append("create_login", "1");
      fd.append("login_password", loginPassword);
    }

    try {
      const result = await createTrainer(fd, token);
      const trainerId = result?.trainer?.id ?? result?.id;

      if (addSkills && trainerId) {
        const validSkills = skills.filter((s) => s.skill_name.trim());
        await Promise.all(
          validSkills.map((s) =>
            addTrainerSkill(trainerId, {
              skill_name: s.skill_name,
              skill_level: s.skill_level,
              ...(s.experience_years !== "" && { experience_years: s.experience_years }),
              ...(s.certification.trim() && { certification: s.certification }),
            }, token)
          )
        );
      }

      setSaving(false);
      setDirty(false);
      setToast({ tone: "success", message: "Trainer created successfully." });
      setTimeout(() => navigate(ROUTES.TRAINERS), 900);
    } catch (err) {
      setSaving(false);
      if (err instanceof ApiValidationError) {
        const mapped = {};
        Object.entries(err.errors ?? {}).forEach(([key, msgs]) => {
          mapped[key] = Array.isArray(msgs) ? msgs[0] : msgs;
        });
        setErrors(mapped);
        setToast({ tone: "error", message: err.message });
      } else {
        setToast({ tone: "error", message: err.message ?? "Something went wrong. Please try again." });
      }
    }
  }

  function handleCancel() {
    if (dirty) setConfirmCancel(true);
    else navigate(ROUTES.TRAINERS);
  }

  const pwdStrength = passwordStrength(loginPassword);
  const fullName = `${formData.first_name} ${formData.last_name}`.trim();

  return (
    <>
      <div className="cl-body">
        <div className="cl-header">
          <div>
            <button type="button" className="cl-btn ep-back-btn" onClick={handleCancel}>
              <Icon name="back" size={15} />
              Back to Trainers
            </button>
            <h1>Add Trainer</h1>
            <Breadcrumb current="Add Trainer" />
          </div>
        </div>

        <div className="panel wizard-panel">
          <div className="form-fields-stack">

            {/* ── Personal Information ─────────────────────────── */}
            <div className="form-section-divider">
              <span className="form-section-title">Personal Information</span>
            </div>

            <div className="form-row">
              <FormField label="First Name *" error={errors.first_name}>
                <input type="text" value={formData.first_name} onChange={(e) => update("first_name", e.target.value)} placeholder="First name" />
              </FormField>
              <FormField label="Last Name" error={errors.last_name}>
                <input type="text" value={formData.last_name} onChange={(e) => update("last_name", e.target.value)} placeholder="Last name" />
              </FormField>
            </div>

            <FormField label="Full Name (Auto Generated)">
              <input type="text" value={fullName} readOnly disabled />
            </FormField>

            <div className="form-row">
              <FormField label="Email *" error={errors.email}>
                <input type="email" value={formData.email} onChange={(e) => update("email", e.target.value)} placeholder="trainer@example.com" />
              </FormField>
              <FormField label="Mobile" error={errors.mobile}>
                <input type="text" value={formData.mobile} onChange={(e) => update("mobile", e.target.value)} placeholder="+91 9000000000" />
              </FormField>
            </div>

            <div className="form-row">
              <FormField label="Gender">
                <select value={formData.gender} onChange={(e) => update("gender", e.target.value)}>
                  <option value="">Select gender</option>
                  {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </FormField>
              <FormField label="Date of Birth">
                <input type="date" value={formData.date_of_birth} onChange={(e) => update("date_of_birth", e.target.value)} />
              </FormField>
            </div>

            <div className="form-row">
              <FormField label="Joining Date">
                <input type="date" value={formData.joining_date} onChange={(e) => update("joining_date", e.target.value)} />
              </FormField>
              <FormField label="Trainer Code">
                <input
                  type="text"
                  value={formData.trainer_code}
                  onChange={(e) => update("trainer_code", e.target.value)}
                  placeholder="Auto-generated if blank"
                />
              </FormField>
            </div>

            <FormField label="Profile Photo">
              <input type="file" accept="image/*" onChange={(e) => update("profile_photo", e.target.files[0] ?? null)} />
            </FormField>

            {/* ── Professional Details ─────────────────────────── */}
            <div className="form-section-divider">
              <span className="form-section-title">Professional Details</span>
            </div>

            <div className="form-row">
              <FormField label="Qualification">
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) => update("qualification", e.target.value)}
                  placeholder="e.g. MBA, B.Tech"
                />
              </FormField>
              <FormField label="Specialization">
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => update("specialization", e.target.value)}
                  placeholder="e.g. Sales Coaching"
                />
              </FormField>
            </div>

            <FormField label="Experience (Years)" error={errors.experience_years}>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={formData.experience_years}
                onChange={(e) => update("experience_years", e.target.value)}
                placeholder="Years of experience"
              />
            </FormField>

            <FormField label="Bio">
              <textarea
                rows={4}
                value={formData.bio}
                onChange={(e) => update("bio", e.target.value)}
                placeholder="Brief description about the trainer..."
              />
            </FormField>

            {/* ── Login Account ────────────────────────────────── */}
            <div className="form-section-divider">
              <span className="form-section-title">Login Account</span>
            </div>

            <label className="ef-same-address">
              <input type="checkbox" checked={createLogin} onChange={(e) => setCreateLogin(e.target.checked)} />
              <span>Create a login account for this trainer</span>
            </label>

            {createLogin && (
              <>
                <div className="form-row">
                  <FormField label="Password *" error={errors.login_password}>
                    <div className="form-password-input">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value);
                          setErrors((prev) => { const n = { ...prev }; delete n.login_password; return n; });
                        }}
                        placeholder="Minimum 8 characters"
                      />
                      <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label="Toggle password visibility">
                        <Icon name="eye" size={16} />
                      </button>
                    </div>
                    {loginPassword && (
                      <div className="form-password-strength">
                        <span className={`form-strength-label tone-${pwdStrength.tone}`}>{pwdStrength.label}</span>
                      </div>
                    )}
                  </FormField>

                  <FormField label="Confirm Password *" error={errors.confirm_password}>
                    <div className="form-password-input">
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setErrors((prev) => { const n = { ...prev }; delete n.confirm_password; return n; });
                        }}
                        placeholder="Re-enter password"
                      />
                      <button type="button" onClick={() => setShowConfirm((s) => !s)} aria-label="Toggle password visibility">
                        <Icon name="eye" size={16} />
                      </button>
                    </div>
                  </FormField>
                </div>
              </>
            )}

            {/* ── Skills ───────────────────────────────────────── */}
            <div className="form-section-divider">
              <span className="form-section-title">Skills</span>
            </div>

            <label className="ef-same-address">
              <input type="checkbox" checked={addSkills} onChange={(e) => { setAddSkills(e.target.checked); if (!e.target.checked) setSkills([]); }} />
              <span>Add skills for this trainer</span>
            </label>

            {addSkills && (
              <>
                <div className="form-doc-table-head">
                  <p>Add skills and expertise levels.</p>
                  <button type="button" className="fa-outline-btn form-doc-add-btn" onClick={addSkillRow}>
                    <Icon name="plus" size={15} />
                    Add Skill
                  </button>
                </div>

                {skills.length === 0 ? (
                  <div className="dtable-state form-doc-empty">
                    <Icon name="star" size={22} />
                    <p>Click "Add Skill" to add the first skill.</p>
                  </div>
                ) : (
                  <div className="dtable-wrap">
                    <table className="dtable form-doc-table">
                      <thead>
                        <tr>
                          <th>Skill Name</th>
                          <th>Level</th>
                          <th>Exp (Yrs)</th>
                          <th>Certification</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {skills.map((s) => (
                          <tr key={s.id}>
                            <td>
                              <input
                                type="text"
                                className="form-doc-input"
                                value={s.skill_name}
                                onChange={(e) => changeSkillRow(s.id, "skill_name", e.target.value)}
                                placeholder="e.g. Negotiation"
                              />
                            </td>
                            <td>
                              <select
                                className="form-doc-select"
                                value={s.skill_level}
                                onChange={(e) => changeSkillRow(s.id, "skill_level", e.target.value)}
                              >
                                {SKILL_LEVELS.map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                className="form-doc-input"
                                value={s.experience_years}
                                onChange={(e) => changeSkillRow(s.id, "experience_years", e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-doc-input"
                                value={s.certification}
                                onChange={(e) => changeSkillRow(s.id, "certification", e.target.value)}
                                placeholder="Optional"
                              />
                            </td>
                            <td>
                              <button type="button" className="dash-icon-btn" aria-label="Remove skill" onClick={() => removeSkillRow(s.id)}>
                                <Icon name="trash" size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ── Form Actions ─────────────────────────────────── */}
            <div className="wizard-step-footer">
              <div className="wizard-step-footer-left">
                <button type="button" className="cl-btn" onClick={handleCancel} disabled={saving}>
                  Cancel
                </button>
              </div>
              <div className="wizard-step-footer-right">
                <button type="button" className="dash-primary-btn" onClick={handleSave} disabled={saving}>
                  {saving ? <span className="fa-spinner light" /> : <Icon name="check" size={15} />}
                  Save Trainer
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />

      {confirmCancel && (
        <ConfirmDialog
          title="Discard changes?"
          message="You have unsaved changes. Leaving now will discard them."
          confirmLabel="Discard"
          onCancel={() => setConfirmCancel(false)}
          onConfirm={() => { setConfirmCancel(false); navigate(ROUTES.TRAINERS); }}
        />
      )}
    </>
  );
}
