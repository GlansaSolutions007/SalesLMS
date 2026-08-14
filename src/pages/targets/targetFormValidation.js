export function validateTargetDetails(data) {
  const errors = {};

  if (!data.employeeId) errors.employeeId = "Select an employee.";
  if (!data.startDate) errors.startDate = "Start date is required.";
  if (!data.endDate) errors.endDate = "End date is required.";
  if (data.startDate && data.endDate && data.endDate < data.startDate) errors.endDate = "End date must be on or after start date.";
  if (data.monthlyLeadTarget === "" || Number(data.monthlyLeadTarget) < 0) errors.monthlyLeadTarget = "Enter a valid lead target.";
  if (data.monthlySalesTarget === "" || Number(data.monthlySalesTarget) < 0) errors.monthlySalesTarget = "Enter a valid sales target.";
  if (data.monthlyRevenueTarget === "" || Number(data.monthlyRevenueTarget) < 0) errors.monthlyRevenueTarget = "Enter a valid revenue target.";

  return errors;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
