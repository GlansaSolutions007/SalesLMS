function formatDisplayDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(`${String(dateStr).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return String(dateStr).slice(0, 10);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

// Same overlap condition the backend (MonthlyTargetController) enforces:
// new.start <= existing.end AND new.end >= existing.start, scoped to a
// single employee's targets. This only gives the user immediate feedback —
// the backend re-checks on submit and remains the authoritative source
// (e.g. another admin could create a conflicting target in the meantime).
export function findOverlappingTarget(existingTargets, startDate, endDate, excludeTargetId) {
  if (!startDate || !endDate) return null;
  return (
    (existingTargets || []).find((t) => {
      if (excludeTargetId != null && String(t.id) === String(excludeTargetId)) return false;
      return startDate <= t.end_date && endDate >= t.start_date;
    }) || null
  );
}

export function validateTargetDetails(data, options = {}) {
  const { existingTargets = [], excludeTargetId } = options;
  const errors = {};

  if (!data.employeeId) errors.employeeId = "Select an employee.";
  if (!data.startDate) errors.startDate = "Start date is required.";
  if (!data.endDate) errors.endDate = "End date is required.";

  if (data.startDate && data.endDate && data.endDate < data.startDate) {
    errors.endDate = "End date must be on or after start date.";
  } else if (data.startDate && data.endDate) {
    const overlap = findOverlappingTarget(existingTargets, data.startDate, data.endDate, excludeTargetId);
    if (overlap) {
      errors.endDate = `Target period overlaps with an existing target for this employee (${formatDisplayDate(overlap.start_date)} – ${formatDisplayDate(overlap.end_date)}). Please select a different date range.`;
    }
  }

  if (data.monthlyLeadTarget === "" || Number(data.monthlyLeadTarget) < 0) errors.monthlyLeadTarget = "Enter a valid lead target.";
  if (data.monthlySalesTarget === "" || Number(data.monthlySalesTarget) < 0) errors.monthlySalesTarget = "Enter a valid sales target.";
  if (data.monthlyRevenueTarget === "" || Number(data.monthlyRevenueTarget) < 0) errors.monthlyRevenueTarget = "Enter a valid revenue target.";

  return errors;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
