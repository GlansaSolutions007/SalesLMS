import { useEffect, useState } from "react";
import Skeleton from "../../components/Skeleton.jsx";
import Toast from "../../components/Toast.jsx";
import { getSystemSettings, updateSystemSettings } from "../../services/settingsService.js";

function inputForType(setting, value, onChange) {
  if (setting.data_type === "Boolean") {
    return (
      <select className="form-doc-select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
    );
  }
  if (setting.data_type === "Number") {
    return <input type="number" className="form-doc-input" value={value} onChange={(e) => onChange(e.target.value)} />;
  }
  return <input type="text" className="form-doc-input" value={value} onChange={(e) => onChange(e.target.value)} />;
}

export default function SystemSettingsPanel() {
  const [settings, setSettings] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    getSystemSettings()
      .then((data) => {
        setSettings(data);
        setValues(Object.fromEntries(data.map((s) => [s.setting_key, s.setting_value ?? ""])));
      })
      .catch((err) => setError(err.message ?? "Could not load settings."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    const changed = settings
      .filter((s) => values[s.setting_key] !== (s.setting_value ?? ""))
      .map((s) => ({ setting_key: s.setting_key, setting_value: values[s.setting_key] }));

    if (changed.length === 0) {
      setToast({ tone: "success", message: "No changes to save." });
      return;
    }

    setSaving(true);
    try {
      const updated = await updateSystemSettings(changed);
      setSettings(updated);
      setValues(Object.fromEntries(updated.map((s) => [s.setting_key, s.setting_value ?? ""])));
      setToast({ tone: "success", message: `${changed.length} setting(s) saved.` });
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not save settings." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Skeleton height={320} />;
  if (error) return <p className="rl-api-error">{error}</p>;

  return (
    <div className="panel cv-section">
      <div className="dtable-wrap">
        <table className="dtable form-doc-table">
          <thead>
            <tr>
              <th>Setting</th>
              <th>Description</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {settings.map((s) => (
              <tr key={s.setting_key}>
                <td><code>{s.setting_key}</code></td>
                <td style={{ color: "var(--color-muted)", fontSize: 13 }}>{s.description}</td>
                <td>{inputForType(s, values[s.setting_key] ?? "", (v) => setValues((prev) => ({ ...prev, [s.setting_key]: v })))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="wizard-step-footer">
        <div />
        <div className="wizard-step-footer-right">
          <button type="button" className="dash-primary-btn" disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : "Save All Changes"}
          </button>
        </div>
      </div>

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />
    </div>
  );
}
