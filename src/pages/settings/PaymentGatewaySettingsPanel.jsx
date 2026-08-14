import { useEffect, useState } from "react";
import Skeleton from "../../components/Skeleton.jsx";
import Toast from "../../components/Toast.jsx";
import FormField from "../../components/FormField.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getPaymentGatewaySettings,
  updatePaymentGatewaySettings,
  testPaymentGatewaySettings,
} from "../../services/paymentService.js";

const MASK = "**************";

// Settings > Payment Gateway (Super Admin only). key_secret/webhook_secret
// are shown as the mask placeholder whenever one is already set on the
// backend — submitting the form unchanged leaves the stored secret alone;
// only typing a genuinely new value overwrites it (see
// PaymentGatewaySettingController::update()).
export default function PaymentGatewaySettingsPanel() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ key_id: "", key_secret: "", webhook_secret: "", mode: "test", currency: "INR", status: "Disabled" });

  useEffect(() => {
    getPaymentGatewaySettings(token)
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setForm({
          key_id: data.key_id ?? "",
          key_secret: data.key_secret ?? "",
          webhook_secret: data.webhook_secret ?? "",
          mode: data.mode ?? "test",
          currency: data.currency ?? "INR",
          status: data.status ?? "Disabled",
        });
      })
      .catch((err) => setError(err?.response?.data?.message ?? "Could not load payment gateway settings."))
      .finally(() => setLoading(false));
  }, [token]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await updatePaymentGatewaySettings(form, token);
      const data = res.data?.data ?? res.data;
      setForm((prev) => ({ ...prev, key_secret: data.key_secret ?? "", webhook_secret: data.webhook_secret ?? "" }));
      setToast({ tone: "success", message: "Payment gateway settings saved." });
    } catch (err) {
      setToast({ tone: "error", message: err?.response?.data?.message ?? "Could not save settings." });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const res = await testPaymentGatewaySettings({ key_id: form.key_id, key_secret: form.key_secret }, token);
      setToast({ tone: "success", message: res.data?.message ?? "Connected to Razorpay successfully." });
    } catch (err) {
      setToast({ tone: "error", message: err?.response?.data?.message ?? "Could not connect to Razorpay." });
    } finally {
      setTesting(false);
    }
  }

  if (loading) return <Skeleton height={320} />;
  if (error) return <p className="rl-api-error">{error}</p>;

  return (
    <div className="panel cv-section">
      <p style={{ marginTop: 0, color: "var(--color-muted)", fontSize: 13 }}>
        Configure the Razorpay payment gateway used for subscription checkout, seat purchases, and refunds. The Key
        Secret and Webhook Secret are never shown once saved — leave them as <code>{MASK}</code> to keep the stored
        value, or type a new one to replace it.
      </p>

      <div className="detail-grid" style={{ marginBottom: 16 }}>
        <FormField label="Gateway">
          <input type="text" value="Razorpay" disabled />
        </FormField>
        <FormField label="Status">
          <select value={form.status} onChange={(e) => update("status", e.target.value)}>
            <option value="Disabled">Disabled</option>
            <option value="Enabled">Enabled</option>
          </select>
        </FormField>
        <FormField label="Mode">
          <select value={form.mode} onChange={(e) => update("mode", e.target.value)}>
            <option value="test">Test</option>
            <option value="live">Live</option>
          </select>
        </FormField>
        <FormField label="Currency">
          <input type="text" maxLength={10} value={form.currency} onChange={(e) => update("currency", e.target.value.toUpperCase())} />
        </FormField>
        <FormField label="Key ID">
          <input type="text" value={form.key_id} onChange={(e) => update("key_id", e.target.value)} placeholder="rzp_test_xxxxxxxxxxxx" />
        </FormField>
        <FormField label="Key Secret">
          <input
            type="password"
            value={form.key_secret}
            onChange={(e) => update("key_secret", e.target.value)}
            placeholder={MASK}
          />
        </FormField>
        <FormField label="Webhook Secret">
          <input
            type="password"
            value={form.webhook_secret}
            onChange={(e) => update("webhook_secret", e.target.value)}
            placeholder={MASK}
          />
        </FormField>
      </div>

      <div className="wizard-step-footer">
        <button type="button" className="cl-btn" disabled={testing} onClick={handleTest}>
          {testing ? "Testing…" : "Test Configuration"}
        </button>
        <div className="wizard-step-footer-right">
          <button type="button" className="dash-primary-btn" disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />
    </div>
  );
}
