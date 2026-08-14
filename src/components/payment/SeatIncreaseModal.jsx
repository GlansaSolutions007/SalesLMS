import { useState } from "react";
import Modal from "../Modal.jsx";
import FormField from "../FormField.jsx";
import Toast from "../Toast.jsx";
import { createSeatCheckout, verifyPayment } from "../../services/paymentService.js";
import { openRazorpayCheckout } from "../../utils/razorpayCheckout.js";
import { formatCurrency } from "../../pages/company/companyDisplay.jsx";

// Increase Employee Seats: shows current Plan/Used/Available (from the
// subscription's own `usage` field, already computed server-side — see
// SubscriptionController::formatSubscription()) -> Enter Additional
// Employees -> Review -> Pay Now -> Razorpay -> Verify -> seats updated.
// Never shown for an Unlimited-Employees plan (employee_limit null) — the
// caller (CompanyView) is responsible for that gate, matching requirement 6.
export default function SeatIncreaseModal({ company, subscription, usage, token, user, onClose, onSuccess }) {
  const [additional, setAdditional] = useState(10);
  const [step, setStep] = useState("form"); // form | review
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const pricePerEmployee = Number(subscription.price_per_employee ?? subscription.plan?.price_per_employee ?? 0);
  const currentLimit = subscription.employee_limit;
  const usedSeats = usage?.employees_used ?? 0;
  const availableSeats = usage?.employees_left ?? Math.max(0, currentLimit - usedSeats);
  const additionalAmount = pricePerEmployee * Number(additional || 0);
  const newLimit = currentLimit + Number(additional || 0);

  async function handlePayNow() {
    if (!additional || additional < 1) return;
    setSubmitting(true);
    try {
      const res = await createSeatCheckout(company.id, subscription.id, { additional_employees: Number(additional) }, token);
      const order = res.data?.data ?? res.data;

      openRazorpayCheckout({
        keyId: order.razorpay_key_id,
        orderId: order.razorpay_order_id,
        amount: order.amount,
        currency: order.currency,
        name: company.company_name,
        description: `Additional ${additional} employee seat(s)`,
        prefill: { name: user?.name, email: user?.email },
        onSuccess: async (payload) => {
          try {
            await verifyPayment(company.id, order.transaction_id, payload, token);
            onSuccess?.("Payment successful. Your employee limit has been increased.");
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
      title="Increase Employee Seats"
      onClose={onClose}
      footer={
        step === "form" ? (
          <>
            <button type="button" className="cl-btn" onClick={onClose}>Cancel</button>
            <button
              type="button"
              className="dash-primary-btn cl-add-btn"
              disabled={!additional || additional < 1}
              onClick={() => setStep("review")}
            >
              Review
            </button>
          </>
        ) : (
          <>
            <button type="button" className="cl-btn" onClick={() => setStep("form")}>Back</button>
            <button type="button" className="dash-primary-btn cl-add-btn" disabled={submitting} onClick={handlePayNow}>
              {submitting ? "Processing…" : "Proceed to Razorpay"}
            </button>
          </>
        )
      }
    >
      <div className="detail-grid" style={{ marginBottom: 16 }}>
        <div><span>Plan</span><p>{subscription.plan?.plan_name}</p></div>
        <div><span>Current Seats</span><p>{currentLimit}</p></div>
        <div><span>Used Seats</span><p>{usedSeats}</p></div>
        <div><span>Available Seats</span><p>{availableSeats}</p></div>
      </div>

      {step === "form" && (
        <FormField label="Additional Employees">
          <input type="number" min={1} value={additional} onChange={(e) => setAdditional(e.target.value)} />
        </FormField>
      )}

      {step === "review" && (
        <div className="detail-grid">
          <div><span>Current Limit</span><p>{currentLimit}</p></div>
          <div><span>Additional Seats</span><p>{additional}</p></div>
          <div><span>New Limit</span><p><strong>{newLimit}</strong></p></div>
          <div><span>Price Per Employee</span><p>{formatCurrency(pricePerEmployee)}</p></div>
          <div><span>Additional Amount</span><p><strong>{formatCurrency(additionalAmount)}</strong></p></div>
        </div>
      )}

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />
    </Modal>
  );
}
