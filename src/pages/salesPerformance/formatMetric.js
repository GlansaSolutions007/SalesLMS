// "Target"/"Achievement" mean different units depending on the selected
// Target Type filter — a plain count for sales/lead, currency for
// revenue/all. Shared by the page, its charts, and the detail modal so
// they can never disagree on formatting.
export function formatMetric(value, targetType) {
  const num = Number(value) || 0;
  if (targetType === "sales" || targetType === "lead") return num.toLocaleString();
  return `₹${num.toLocaleString()}`;
}
