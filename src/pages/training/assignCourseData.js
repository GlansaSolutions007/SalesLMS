// Design-stage mock data — no backend wiring yet. Field names mirror the
// real course_assignments table (course_id, employee_id, batch_id,
// assigned_date, due_date, status) so swapping this for a live API later
// is a data-shape-compatible change, not a redesign.

export const STATUS_OPTIONS = ["Assigned", "In Progress", "Completed", "Expired"];

export const EMPLOYEES = [
  { id: 1, name: "Alice Monroe", code: "EMP-1001" },
  { id: 2, name: "Marcus Thorne", code: "EMP-1002" },
  { id: 3, name: "Jessica Wang", code: "EMP-1003" },
  { id: 4, name: "David Chen", code: "EMP-1004" },
  { id: 5, name: "Sarah Miller", code: "EMP-1005" },
  { id: 6, name: "Robert Jackson", code: "EMP-1006" },
  { id: 7, name: "Priya Nair", code: "EMP-1007" },
  { id: 8, name: "Tom Reid", code: "EMP-1008" },
];

export const COURSES = [
  { id: 1, title: "Introduction to Selling" },
  { id: 2, title: "Building Rapport" },
  { id: 3, title: "Active Listening" },
  { id: 4, title: "Handling Pushback" },
  { id: 5, title: "Negotiation Foundations" },
  { id: 6, title: "Closing Techniques" },
  { id: 7, title: "Digital Selling Essentials" },
  { id: 8, title: "Customer Service Excellence" },
];

export const BATCHES = [
  { id: 1, name: "Batch A — Jan 2026" },
  { id: 2, name: "Batch B — Feb 2026" },
  { id: 3, name: "Batch C — Mar 2026" },
];

export const SEED = [
  { id: 1, employeeName: "Alice Monroe", employeeCode: "EMP-1001", courseName: "Introduction to Selling", batchName: "Batch A — Jan 2026", assignedDate: "2026-01-12", dueDate: "2026-02-12", status: "In Progress" },
  { id: 2, employeeName: "Marcus Thorne", employeeCode: "EMP-1002", courseName: "Negotiation Foundations", batchName: "Batch A — Jan 2026", assignedDate: "2026-01-10", dueDate: "2026-02-10", status: "Completed" },
  { id: 3, employeeName: "Jessica Wang", employeeCode: "EMP-1003", courseName: "Building Rapport", batchName: "Batch B — Feb 2026", assignedDate: "2026-02-01", dueDate: "2026-03-01", status: "Assigned" },
  { id: 4, employeeName: "David Chen", employeeCode: "EMP-1004", courseName: "Handling Pushback", batchName: "Batch B — Feb 2026", assignedDate: "2026-01-20", dueDate: "2026-02-05", status: "Expired" },
  { id: 5, employeeName: "Sarah Miller", employeeCode: "EMP-1005", courseName: "Digital Selling Essentials", batchName: "Batch C — Mar 2026", assignedDate: "2026-02-15", dueDate: "2026-03-15", status: "In Progress" },
  { id: 6, employeeName: "Robert Jackson", employeeCode: "EMP-1006", courseName: "Closing Techniques", batchName: "Batch A — Jan 2026", assignedDate: "2026-01-08", dueDate: "2026-02-08", status: "Completed" },
  { id: 7, employeeName: "Priya Nair", employeeCode: "EMP-1007", courseName: "Active Listening", batchName: "Batch C — Mar 2026", assignedDate: "2026-02-20", dueDate: "2026-03-20", status: "Assigned" },
  { id: 8, employeeName: "Tom Reid", employeeCode: "EMP-1008", courseName: "Customer Service Excellence", batchName: "Batch B — Feb 2026", assignedDate: "2026-01-25", dueDate: "2026-02-25", status: "In Progress" },
];
