import { useEffect, useState } from "react";
import FormField from "../../components/FormField.jsx";
import Toast from "../../components/Toast.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import useCompanyOptions from "../company/useCompanyOptions.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { getCompanySettings, updateCompanySettings } from "../../services/api/companyApi.js";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function toForm(s) {
  return {
    timezone: s?.timezone ?? "",
    language: s?.language ?? "en",
    date_format: s?.date_format ?? "d-m-Y",
    currency: s?.currency ?? "",
    office_start_time: s?.office_start_time ? String(s.office_start_time).slice(0, 5) : "",
    office_end_time: s?.office_end_time ? String(s.office_end_time).slice(0, 5) : "",
    weekly_off_days: s?.weekly_off_days ? s.weekly_off_days.split(",").filter(Boolean) : [],
  };
}

export default function CompanySettingsPanel() {
  const { token, roleName, user } = useAuth();
  const isSuperAdmin = roleName === "Super Admin";

  const { options: companies, isLoading: companiesLoading } = useCompanyOptions(isSuperAdmin);
  const [companyId, setCompanyId] = useState(() => (isSuperAdmin ? "" : String(user?.company?.id ?? "")));

  useEffect(() => {
    if (isSuperAdmin && !companyId && companies.length > 0) setCompanyId(String(companies[0].id));
  }, [isSuperAdmin, companies, companyId]);

  const [form, setForm] = useState(toForm(null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    setLoading(true);
    getCompanySettings(companyId, token)
      .then((data) => {
        if (!cancelled) setForm(toForm(data));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Could not load settings.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId, token]);

  function toggleWeeklyOff(day) {
    setForm((f) => ({
      ...f,
      weekly_off_days: f.weekly_off_days.includes(day) ? f.weekly_off_days.filter((d) => d !== day) : [...f.weekly_off_days, day],
    }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        timezone: form.timezone,
        language: form.language,
        date_format: form.date_format,
        currency: form.currency,
        office_start_time: form.office_start_time || null,
        office_end_time: form.office_end_time || null,
        weekly_off_days: form.weekly_off_days.join(","),
      };
      await updateCompanySettings(companyId, payload, token);
      setToast({ tone: "success", message: "Company settings saved." });
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not save settings." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel cv-section">
      {isSuperAdmin && (
        <FormField label="Company">
          <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} disabled={companiesLoading}>
            {companies.length === 0 && <option value="">No companies found</option>}
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.company_name}</option>
            ))}
          </select>
        </FormField>
      )}

      {loading ? (
        <Skeleton height={220} />
      ) : error ? (
        <p className="rl-api-error">{error}</p>
      ) : (
        <form onSubmit={handleSave} className="form-fields-stack">
          <div className="form-row">
            <FormField label="Timezone">
              <input type="text" value={form.timezone} onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))} placeholder="e.g. Asia/Kolkata" />
            </FormField>
            <FormField label="Language">
              <input type="text" value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))} placeholder="e.g. en" />
            </FormField>
          </div>

          <div className="form-row">
            <FormField label="Currency">
              <input type="text" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} placeholder="e.g. INR" />
            </FormField>
            <FormField label="Date Format">
              <input type="text" value={form.date_format} onChange={(e) => setForm((f) => ({ ...f, date_format: e.target.value }))} placeholder="e.g. d-m-Y" />
            </FormField>
          </div>

          <div className="form-row">
            <FormField label="Office Start Time">
              <input type="time" value={form.office_start_time} onChange={(e) => setForm((f) => ({ ...f, office_start_time: e.target.value }))} />
            </FormField>
            <FormField label="Office End Time">
              <input type="time" value={form.office_end_time} onChange={(e) => setForm((f) => ({ ...f, office_end_time: e.target.value }))} />
            </FormField>
          </div>

          <FormField label="Weekly Off Days">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {WEEKDAYS.map((day) => (
                <label key={day} className="ef-same-address" style={{ marginRight: 0 }}>
                  <input type="checkbox" checked={form.weekly_off_days.includes(day)} onChange={() => toggleWeeklyOff(day)} />
                  <span>{day}</span>
                </label>
              ))}
            </div>
          </FormField>

          <div className="wizard-step-footer">
            <div />
            <div className="wizard-step-footer-right">
              <button type="submit" className="dash-primary-btn" disabled={saving || !companyId}>
                {saving ? "Saving…" : "Save Settings"}
              </button>
            </div>
          </div>
        </form>
      )}

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />
    </div>
  );
}
