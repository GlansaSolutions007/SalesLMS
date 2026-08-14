import { useEffect, useState } from "react";
import Modal from "../Modal.jsx";
import FormField from "../FormField.jsx";
import Toast from "../Toast.jsx";
import { getSubscriptionPlans } from "../../services/subscriptionService.js";
import { createSubscriptionCheckout, verifyPayment } from "../../services/paymentService.js";
import { openRazorpayCheckout } from "../../utils/razorpayCheckout.js";
import { formatCurrency } from "../../pages/company/companyDisplay.jsx";

// New Subscription Purchase: Select Plan -> Employee Count -> Review -> Pay
// Now -> Razorpay Checkout -> Payment Verification -> Success. Shown from
// Company Profile when the company has no active subscription yet.
export default function BuySubscriptionModal({ company, token, user, onClose, onSuccess }) {
  const [step, setStep] = useState("plan"); // plan | review
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [planId, setPlanId] = useState("");
  const [employeeCount, setEmployeeCount] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getSubscriptionPlans({ status: "Active", per_page: 100 }, token)
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.data?.data ?? res.data?.data ?? [];
        setPlans(list);
      })
      .catch(() => !cancelled && setPlans([]))
      .finally(() => !cancelled && setPlansLoading(false));
    return () => {
      cancelled = true;
    };
  }, [token]);

  const selectedPlan = plans.find((p) => String(p.id) === String(planId));
  const estimatedAmount = selectedPlan ? Number(selectedPlan.price_per_employee) * Number(employeeCount || 0) : 0;

  async function handlePayNow() {
    if (!selectedPlan || !employeeCount || employeeCount < 1) return;
    setSubmitting(true);
    try {
      const res = await createSubscriptionCheckout(
        company.id,
        { plan_id: selectedPlan.id, employee_count: Number(employeeCount) },
        token
      );
      const order = res.data?.data ?? res.data;

      openRazorpayCheckout({
        keyId: order.razorpay_key_id,
        orderId: order.razorpay_order_id,
        amount: order.amount,
        currency: order.currency,
        name: company.company_name,
        description: `${selectedPlan.plan_name} subscription`,
        prefill: { name: user?.name, email: user?.email },
        onSuccess: async (payload) => {
          try {
            await verifyPayment(company.id, order.transaction_id, payload, token);
            onSuccess?.("Payment successful. Your subscription has been updated.");
          } catch (err) {
            setToast({ tone: "error", message: err?.response?.data?.message ?? "Payment could not be verified. Please try again." });
          } finally {
            setSubmitting(false);
          }
        },
        onFailure: (err) => {
          setSubmitting(false);
          setToast({ tone: "error", message: err.message ?? "Payment failed. Please try again." });
        },
        onDismiss: () => setSubmitting(false),
      });
    } catch (err) {
      setSubmitting(false);
      setToast({ tone: "error", message: err?.response?.data?.message ?? "Could not start checkout." });
    }
  }

  return (
    <Modal
      title="Subscribe to a Plan"
      onClose={onClose}
      footer={
        step === "plan" ? (
          <>
            <button type="button" className="cl-btn" onClick={onClose}>Cancel</button>
            <button
              type="button"
              className="dash-primary-btn cl-add-btn"
              disabled={!selectedPlan || !employeeCount || employeeCount < 1}
              onClick={() => setStep("review")}
            >
              Review
            </button>
          </>
        ) : (
          <>
            <button type="button" className="cl-btn" onClick={() => setStep("plan")}>Back</button>
            <button type="button" className="dash-primary-btn cl-add-btn" disabled={submitting} onClick={handlePayNow}>
              {submitting ? "Processing…" : "Pay Now"}
            </button>
          </>
        )
      }
    >
      {step === "plan" && (
        <>
          <FormField label="Subscription Plan">
            {plansLoading ? (
              <p>Loading plans…</p>
            ) : (
              <select value={planId} onChange={(e) => setPlanId(e.target.value)}>
                <option value="">Select a plan…</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.plan_name} — {formatCurrency(p.price_per_employee)}/employee/{p.billing_cycle}
                  </option>
                ))}
              </select>
            )}
          </FormField>
          <FormField label="Employee Count">
            <input
              type="number"
              min={1}
              value={employeeCount}
              onChange={(e) => setEmployeeCount(e.target.value)}
            />
          </FormField>
        </>
      )}

      {step === "review" && selectedPlan && (
        <div className="detail-grid">
          <div><span>Plan</span><p>{selectedPlan.plan_name}</p></div>
          <div><span>Billing Cycle</span><p>{selectedPlan.billing_cycle}</p></div>
          <div><span>Employee Count</span><p>{employeeCount}</p></div>
          <div><span>Price Per Employee</span><p>{formatCurrency(selectedPlan.price_per_employee)}</p></div>
          <div><span>Estimated Amount Payable</span><p><strong>{formatCurrency(estimatedAmount)}</strong></p></div>
          <div style={{ gridColumn: "1 / -1" }}>
            <p style={{ color: "var(--color-muted)", fontSize: 12, marginTop: 4 }}>
              The exact amount charged is confirmed by the server and shown again on the Razorpay payment screen.
            </p>
          </div>
        </div>
      )}

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />
    </Modal>
  );
}
