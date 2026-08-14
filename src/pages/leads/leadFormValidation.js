export function validateLeadDetails(data) {
  const errors = {};

  if (!data.fullName?.trim()) errors.fullName = "Customer name is required.";
  if (!data.mobile?.trim()) errors.mobile = "Mobile number is required.";
  else if (data.mobile.trim().length < 6) errors.mobile = "Enter a valid mobile number.";
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Enter a valid email address.";
  if (!data.assignedEmployeeId) errors.assignedEmployeeId = "Assigned employee is required.";

  return errors;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
