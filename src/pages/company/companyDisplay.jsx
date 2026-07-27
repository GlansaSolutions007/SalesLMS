// Shared read-only display helpers for anywhere a company's Subscription /
// Settings data is rendered (Company View, and the read-only sections of
// Edit Company) — keeps the two pages' formatting identical by construction.
export const PAYMENT_TONE = { Pending: "orange", Paid: "green", Failed: "red" };

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
