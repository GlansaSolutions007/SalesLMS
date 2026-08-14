// Shared read-only display helpers for anywhere a company's Subscription /
// Settings data is rendered (Company View, and the read-only sections of
// Edit Company) — keeps the two pages' formatting identical by construction.
export const PAYMENT_TONE = { Pending: "orange", Paid: "green", Failed: "red" };

// Payment Transaction status (payment_transactions.status — distinct from
// Subscription.payment_status above, which the Razorpay flow doesn't touch
// directly; see PaymentProcessingService).
export const PAYMENT_TXN_STATUS_TONE = {
  Pending: "orange",
  Paid: "green",
  Failed: "red",
  Refunded: "gray",
  "Partially Refunded": "orange",
};

// PaymentTransaction.payment_type -> display label, for Payment History /
// Invoices tables.
export const PAYMENT_TYPE_LABEL = {
  NEW_SUBSCRIPTION: "New Subscription",
  RENEWAL: "Renewal",
  UPGRADE: "Upgrade",
  DOWNGRADE: "Downgrade",
  SEAT_INCREASE: "Seat Increase",
};

// Subscription's 5-state vocabulary (Subscription::getEffectiveStatusAttribute
// on the backend) — reused everywhere a subscription status badge is shown
// (Company Profile, Company List, All Subscriptions).
export const SUBSCRIPTION_STATUS_TONE = {
  Upcoming: "blue",
  Active: "green",
  Expired: "gray",
  Cancelled: "red",
  Suspended: "orange",
};

export function formatDaysRemaining(subscription) {
  if (!subscription) return "—";
  const status = subscription.effective_status;
  if (status === "Expired" || status === "Cancelled") return "—";
  if (status === "Upcoming") return "Not started";
  const days = subscription.days_remaining ?? 0;
  if (days === 0) return "Expires today";
  return `${days} day${days === 1 ? "" : "s"}`;
}

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatStorage(mb) {
  if (mb === null || mb === undefined || mb === "") return "—";
  return `${(Number(mb) / 1024).toFixed(1)} GB`;
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined || amount === "") return "—";
  return Number(amount).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

export function formatWeeklyOff(value) {
  if (!value) return "—";
  return String(value)
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean)
    .join(", ");
}

export function DetailField({ label, children }) {
  return (
    <div>
      <span>{label}</span>
      <p>{children ?? "—"}</p>
    </div>
  );
}
