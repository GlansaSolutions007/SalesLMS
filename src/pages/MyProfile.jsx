import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import Topbar from "../components/Topbar.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import Icon from "../components/Icon.jsx";
import Badge from "../components/Badge.jsx";
import FormField from "../components/FormField.jsx";
import ImageUploader from "../components/ImageUploader.jsx";
import Toast from "../components/Toast.jsx";
import ChangePasswordModal from "../components/ChangePasswordModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { ApiValidationError } from "../services/axios.js";
import { resolveApiAssetUrl } from "../utils/apiAssetUrl.js";
import { EMAIL_REGEX, MOBILE_REGEX, req } from "../utils/formValidators.js";
import "./MyProfile.css";

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function MyProfile() {
  const { toggleCollapsed } = useOutletContext();
  const { user, roleName, updateProfile } = useAuth();

  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    mobile: user?.mobile ?? "",
    profilePhoto: resolveApiAssetUrl(user?.profile_image) || "",
    profilePhotoFile: null,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validate() {
    const next = {};
    next.name = req(form.name, "Name is required.");
    next.email = req(form.email, "Email is required.") || (!EMAIL_REGEX.test(form.email) ? "Enter a valid email address." : null);
    if (form.mobile.trim() && !MOBILE_REGEX.test(form.mobile)) next.mobile = "Enter a valid mobile number.";
    Object.keys(next).forEach((k) => next[k] === null && delete next[k]);
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("email", form.email.trim());
    if (form.mobile.trim()) fd.append("mobile", form.mobile.trim());
    if (form.profilePhotoFile instanceof File) fd.append("profile_image", form.profilePhotoFile);

    setSaving(true);
    try {
      await updateProfile(fd);
      setForm((f) => ({ ...f, profilePhotoFile: null }));
      setToast({ tone: "success", message: "Profile updated successfully." });
    } catch (err) {
      if (err instanceof ApiValidationError) {
        const fieldErrors = {};
        Object.entries(err.errors ?? {}).forEach(([field, messages]) => {
          fieldErrors[field] = Array.isArray(messages) ? messages[0] : messages;
        });
        setErrors(fieldErrors);
      }
      setToast({ tone: "error", message: err.message ?? "Could not update your profile. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>My Profile</h1>
            <Breadcrumb current="My Profile" />
          </div>
        </div>

        <div className="mp-columns">
          <section className="panel mp-card">
            <ImageUploader
              label="Profile Photo"
              hint="PNG or JPG, up to 2MB"
              shape="circle"
              value={form.profilePhoto}
              onChange={(dataUrl, file) => {
                setField("profilePhoto", dataUrl);
                setField("profilePhotoFile", file);
              }}
              onRemove={() => {
                setField("profilePhoto", "");
                setField("profilePhotoFile", null);
              }}
            />

            <div className="mp-identity">
              <h2>{user?.name}</h2>
              <Badge tone="blue">{roleName ?? "—"}</Badge>
              <p className="mp-username">@{user?.username}</p>
            </div>

            <div className="mp-meta-list">
              <div>
                <span>Account Status</span>
                <p>
                  <Badge tone={user?.status === "Active" ? "green" : "gray"}>{user?.status ?? "—"}</Badge>
                </p>
              </div>
              <div>
                <span>Company</span>
                <p>{user?.company?.company_name ?? "—"}</p>
              </div>
              <div>
                <span>Last Login</span>
                <p>{formatDateTime(user?.last_login)}</p>
              </div>
            </div>

            <button type="button" className="cl-btn mp-password-btn" onClick={() => setChangePasswordOpen(true)}>
              <Icon name="lock" size={15} />
              Change Password
            </button>
          </section>

          <section className="panel mp-section">
            <h3 className="mp-section-title">Personal Information</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <FormField label="Full Name *" error={errors.name}>
                  <input type="text" value={form.name} onChange={(e) => setField("name", e.target.value)} />
                </FormField>
                <FormField label="Email *" error={errors.email}>
                  <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} />
                </FormField>
              </div>

              <FormField label="Mobile" error={errors.mobile}>
                <input type="text" value={form.mobile} onChange={(e) => setField("mobile", e.target.value)} placeholder="+1 415 555 0100" />
              </FormField>

              <div className="mp-form-footer">
                <button type="submit" className="dash-primary-btn" disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>

      {changePasswordOpen && <ChangePasswordModal onClose={() => setChangePasswordOpen(false)} />}
      {toast && <Toast tone={toast.tone} message={toast.message} onDismiss={() => setToast(null)} />}
    </>
  );
}
