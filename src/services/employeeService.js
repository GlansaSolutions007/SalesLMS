// Mock employees backend. No real API exists yet — swapping these for
// `axios.post("/api/employees", payload)` later is a one-line change.
// Mirrors the pattern used by authService.login() / companyService.createCompany().

export function saveEmployeeDraft(payload) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: "Draft saved.", data: { ...payload, id: payload.id ?? Date.now(), status: "Draft" } });
    }, 500);
  });
}

export function createEmployee(payload) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: "Employee created successfully.", data: { ...payload, id: payload.id ?? Date.now() } });
    }, 900);
  });
}
