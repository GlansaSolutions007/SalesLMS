import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useLocation } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import FormField from "../../components/FormField.jsx";
import Badge from "../../components/Badge.jsx";
// Needed explicitly, not just via DataTable.jsx — see TargetList.jsx's own
// note on the same class: it only renders correctly if some other page
// that already imports it happened to be visited first this session.
import "../../components/DataTable.css";
import useCompanyEmployeeOptions from "../employees/useCompanyEmployeeOptions.js";
import useCompanyOptions from "../company/useCompanyOptions.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { ROUTES } from "../../router/routePaths.js";
import {
  getEmployeeTargetDefaults,
  previewRecurringTargets,
  createRecurringTargets,
} from "../../services/api/targetsApi.js";

const FREQUENCY_OPTIONS = [
  { value: "this_month", label: "This Month" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  // { value: "half_yearly", label: "Half Yearly" },
  { value: "yearly", label: "Yearly" },
];

function firstOfCurrentMonthISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(`${String(dateStr).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return String(dateStr).slice(0, 10);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

// Target Add — the guided flow described in the Target Frequency spec:
// pick an employee (auto-fills that employee's configured Sales & Marketing
// targets, overridable), pick a frequency, then preview the exact periods
// the backend will create before confirming. Every period-generation and
// overlap check the preview shows comes straight from the backend
// (POST .../monthly-targets/recurring with preview_only) — this page never
// computes dates or overlap status itself, so the preview can never
// disagree with what a real submit produces. Editing an existing target
// still uses the original single-period TargetForm.jsx, unchanged.
export default function TargetCreateForm() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { roleName, user } = useAuth();
  const isSuperAdmin = roleName === "Super Admin";
  const fromCompanyId = location.state?.companyId ?? null;

  // Super Admin picks/changes the company right here; every other role is
  // locked to their own company, same as before.
  const { options: companies, isLoading: companiesLoading, error: companiesError } = useCompanyOptions(isSuperAdmin);
  const [companyId, setCompanyId] = useState(() => (isSuperAdmin ? String(fromCompanyId ?? "") : user?.company?.id));

  function handleCompanyChange(value) {
    setCompanyId(value);
    setEmployeeId("");
    setDefaults(null);
    setPreview(null);
    setError("");
  }

  const { options: employees } = useCompanyEmployeeOptions(companyId);

  const [employeeId, setEmployeeId] = useState("");
  const [defaults, setDefaults] = useState(null);
  const [loadingDefaults, setLoadingDefaults] = useState(false);

  const [leadTarget, setLeadTarget] = useState("");
  const [salesTarget, setSalesTarget] = useState("");
  const [revenueTarget, setRevenueTarget] = useState("");

  const [frequency, setFrequency] = useState("this_month");
  const [startDate, setStartDate] = useState(firstOfCurrentMonthISO());
  const [repeatUntil, setRepeatUntil] = useState("");

  const [preview, setPreview] = useState(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const needsDateRange = frequency !== "this_month";

  async function onEmployeeChange(value) {
    setEmployeeId(value);
    setDefaults(null);
    setPreview(null);
    setError("");
    if (!value) return;

    setLoadingDefaults(true);
    try {
      const data = await getEmployeeTargetDefaults(companyId, value);
      setDefaults(data);
      setLeadTarget(String(data.monthly_lead_target ?? ""));
      setSalesTarget(String(data.monthly_sales_target ?? ""));
      setRevenueTarget(String(data.monthly_revenue_target ?? ""));
    } catch (err) {
      setError(err.message ?? "Could not load this employee's configured targets.");
    } finally {
      setLoadingDefaults(false);
    }
  }

  function buildPayload() {
    return {
      employee_id: employeeId,
      frequency,
      start_date: needsDateRange ? startDate : null,
      repeat_until: needsDateRange ? repeatUntil : null,
      monthly_lead_target: leadTarget,
      monthly_sales_target: salesTarget,
      monthly_revenue_target: revenueTarget,
    };
  }

  const canPreview = Boolean(employeeId) && leadTarget !== "" && salesTarget !== "" && revenueTarget !== "" && (!needsDateRange || (startDate && repeatUntil));

  // Recompute the preview whenever anything that affects the generated
  // periods changes — the admin always sees an up-to-date preview before
  // "Create Target" is ever clickable, without a separate manual step.
  useEffect(() => {
    if (!canPreview) {
      setPreview(null);
      return undefined;
    }

    let cancelled = false;
    setIsPreviewing(true);
    setError("");

    previewRecurringTargets(companyId, buildPayload())
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setPreview(null);
          setError(err.message ?? "Could not preview these target periods.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsPreviewing(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, frequency, startDate, repeatUntil, leadTarget, salesTarget, revenueTarget]);

  const hasOverlap = (preview?.periods ?? []).some((p) => p.status === "overlap");

  async function handleCreate() {
    if (!preview || hasOverlap) return;

    setIsSubmitting(true);
    setError("");
    try {
      await createRecurringTargets(companyId, buildPayload());
      navigate(ROUTES.TARGETS);
    } catch (err) {
      setError(err.message ?? "Could not create these targets.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isSuperAdmin && !companyId) {
    return (
      <>
        <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." />
        <div className="cl-body">
          <div className="cl-header">
            <div>
              <h1>Create Monthly Target</h1>
              <Breadcrumb current="Targets" />
            </div>
          </div>
          <div className="panel wizard-panel">
            <p style={{ margin: "0 0 16px" }}>
              Select a company from the Targets page first, then create a target from there.
            </p>
            <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.TARGETS)}>
              Back to Targets
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." />
      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Create Monthly Target</h1>
            <Breadcrumb current="Targets" />
          </div>
        </div>

        <div className="panel wizard-panel">
          <div className="form-fields-stack">
            {isSuperAdmin && (
              <FormField label="Company *">
                <select value={companyId} onChange={(e) => handleCompanyChange(e.target.value)} disabled={companiesLoading}>
                  <option value="">
                    {companiesLoading ? "Loading companies..." : companiesError ? "Could not load companies" : "Select company"}
                  </option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            <FormField label="Employee *">
              <select value={employeeId} onChange={(e) => onEmployeeChange(e.target.value)} disabled={!companyId}>
                <option value="">{companyId ? "Select employee" : "Select a company first"}</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </option>
                ))}
              </select>
            </FormField>

            {loadingDefaults && <p style={{ color: "var(--color-muted)", fontSize: 13 }}>Loading configured targets…</p>}

            {defaults && (
              <div className="integration-card">
                <strong>Configured Employee Targets</strong>
                <p style={{ fontSize: 12, color: "var(--color-muted)", margin: "4px 0 12px" }}>
                  From {defaults.employee_name}'s Sales & Marketing Information — used as the default for this
                  target. Override any value below if this period needs a different target.
                </p>
                <div className="form-row">
                  <FormField label="Lead Target *">
                    <input type="number" min="0" value={leadTarget} onChange={(e) => setLeadTarget(e.target.value)} />
                  </FormField>
                  <FormField label="Sales Target *">
                    <input type="number" min="0" value={salesTarget} onChange={(e) => setSalesTarget(e.target.value)} />
                  </FormField>
                </div>
                <FormField label="Revenue Target *">
                  <input type="number" min="0" step="0.01" value={revenueTarget} onChange={(e) => setRevenueTarget(e.target.value)} />
                </FormField>
              </div>
            )}

            <FormField label="Target Frequency *">
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                {FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            {needsDateRange && (
              <div className="form-row">
                <FormField label="Start Date *">
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </FormField>
                <FormField label="Repeat Until *">
                  <input type="date" value={repeatUntil} min={startDate} onChange={(e) => setRepeatUntil(e.target.value)} />
                </FormField>
              </div>
            )}

            {error && <p className="form-field-error">{error}</p>}

            {preview && preview.periods?.length > 0 && (
              <div>
                <strong>Preview</strong>
                <p style={{ fontSize: 12, color: "var(--color-muted)", margin: "4px 0 10px" }}>
                  {preview.periods.length === 1
                    ? "This target period will be created:"
                    : `These ${preview.periods.length} target periods will be created:`}
                </p>
                <div className="dtable-wrap">
                  <table className="dtable">
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th>Lead Target</th>
                        <th>Sales Target</th>
                        <th>Revenue Target</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.periods.map((p) => (
                        <tr key={p.start_date} style={p.status === "overlap" ? { background: "rgba(220,38,38,0.06)" } : undefined}>
                          <td>
                            {formatDisplayDate(p.start_date)} – {formatDisplayDate(p.end_date)}
                          </td>
                          <td>{leadTarget}</td>
                          <td>{salesTarget}</td>
                          <td>₹{Number(revenueTarget || 0).toLocaleString()}</td>
                          <td>
                            {p.status === "overlap" ? (
                              <Badge tone="red">Overlaps existing target</Badge>
                            ) : (
                              <Badge tone="green">OK</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {hasOverlap && (
                  <p className="form-field-error" style={{ marginTop: 10 }}>
                    {preview.periods.length === 1
                      ? `Target period overlaps with an existing target for ${preview.employee_name} (${formatDisplayDate(
                          preview.periods[0].overlaps_with?.start_date
                        )} – ${formatDisplayDate(preview.periods[0].overlaps_with?.end_date)}). Please select a different period.`
                      : `Unable to create these recurring targets because one or more periods above overlap with an existing target for ${preview.employee_name}. Adjust the start date or recurrence range.`}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="wizard-step-footer">
            <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.TARGETS)}>
              Cancel
            </button>
            <button
              type="button"
              className="dash-primary-btn"
              disabled={!preview || hasOverlap || isPreviewing || isSubmitting}
              onClick={handleCreate}
            >
              {isSubmitting ? "Creating…" : "Create Target"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
