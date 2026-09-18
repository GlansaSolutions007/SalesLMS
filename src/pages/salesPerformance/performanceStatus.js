// The 4-bucket status scheme for Employee Target Performance (Exceeded/On
// Track/At Risk/Below Target) — computed and returned by the backend
// (EmployeeTargetPerformanceService::statusFor()), never recomputed here.
// This is deliberately a different scheme from src/utils/targetStatus.js's
// 5-bucket one used by the Reports page's Target Achievement tab; that one
// stays untouched.
export const PERFORMANCE_STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "exceeded", label: "Exceeded" },
  { value: "on_track", label: "On Track" },
  { value: "at_risk", label: "At Risk" },
  { value: "below_target", label: "Below Target" },
];

const TONE_BY_STATUS = {
  exceeded: "green",
  on_track: "blue",
  at_risk: "orange",
  below_target: "red",
};

const COLOR_BY_STATUS = {
  exceeded: "var(--color-success)",
  on_track: "var(--color-primary-600)",
  at_risk: "var(--color-warning)",
  below_target: "var(--color-danger)",
};

export function statusTone(status) {
  return TONE_BY_STATUS[status] ?? "gray";
}

export function statusColor(status) {
  return COLOR_BY_STATUS[status] ?? "var(--color-muted)";
}
