// Design-only data shared by EmployeeTargetPerformance.jsx and its own
// EmployeeDetailModal.jsx, so both read from the exact same numbers — see
// EmployeeTargetPerformance.jsx's top note on this module's UI-only scope.
export const DUMMY_COMPANIES = [
  { id: 1, company_name: "Acme Sales Pvt Ltd" },
  { id: 2, company_name: "Northwind Traders" },
];

export const DUMMY_EMPLOYEES = [
  { id: 101, full_name: "Arjun Kumar" },
  { id: 102, full_name: "Priya Singh" },
  { id: 103, full_name: "Ravi Verma" },
  { id: 104, full_name: "Kiran Shah" },
];

export const DUMMY_REPORT = {
  kpis: { total_target: 42000, total_achievement: 35700, achievement_pct: 85, total_leads: 186, converted_leads: 94, conversion_rate: 50.5, total_revenue: 3570000 },
  by_employee: [
    { employee_id: 101, full_name: "Arjun Kumar", team_name: "Team A", target: 12000, achievement: 11400, achievement_pct: 95, leads: 48, converted: 27, conversion_pct: 56.3, revenue: 1140000, status: "on_track", status_label: "On Track" },
    { employee_id: 102, full_name: "Priya Singh", team_name: "Team A", target: 10000, achievement: 11200, achievement_pct: 112, leads: 52, converted: 31, conversion_pct: 59.6, revenue: 1120000, status: "exceeded", status_label: "Exceeded" },
    { employee_id: 103, full_name: "Ravi Verma", team_name: "Team B", target: 11000, achievement: 7150, achievement_pct: 65, leads: 41, converted: 16, conversion_pct: 39, revenue: 715000, status: "at_risk", status_label: "At Risk" },
    { employee_id: 104, full_name: "Kiran Shah", team_name: "Team B", target: 9000, achievement: 5950, achievement_pct: 66, leads: 45, converted: 20, conversion_pct: 44.4, revenue: 595000, status: "at_risk", status_label: "At Risk" },
  ],
  monthly_trend: [
    { month: "Apr 2026", target: 40000, achievement: 32000, revenue: 3200000 },
    { month: "May 2026", target: 40000, achievement: 37000, revenue: 3700000 },
    { month: "Jun 2026", target: 41000, achievement: 30000, revenue: 3000000 },
    { month: "Jul 2026", target: 41000, achievement: 39000, revenue: 3900000 },
    { month: "Aug 2026", target: 42000, achievement: 41000, revenue: 4100000 },
    { month: "Sep 2026", target: 42000, achievement: 35700, revenue: 3570000 },
  ],
  distribution: { exceeded: 1, on_track: 1, at_risk: 2, below_target: 0 },
  period: {},
};
