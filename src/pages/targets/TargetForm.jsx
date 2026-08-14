import { useEffect, useState } from "react";
import { useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import FormField from "../../components/FormField.jsx";
import useCompanyEmployeeOptions from "../employees/useCompanyEmployeeOptions.js";
import { getCompanyEmployee } from "../../services/api/companyApi.js";
import { createTarget, updateTarget, getTarget } from "../../services/api/targetsApi.js";
import { validateTargetDetails, hasErrors } from "./targetFormValidation.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { ROUTES } from "../../router/routePaths.js";

const EMPTY = { employeeId: "", startDate: "", endDate: "", monthlyLeadTarget: "", monthlySalesTarget: "", monthlyRevenueTarget: "" };

export default function TargetForm() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { token } = useAuth();
  const isEdit = Boolean(params.targetId);
  const companyId = params.companyId || location.state?.companyId;

  const [data, setData] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const { options: employees } = useCompanyEmployeeOptions(companyId);

  useEffect(() => {
    if (isEdit) {
      getTarget(companyId, params.targetId).then((t) => {
        setData({
          employeeId: String(t.employee_id),
          startDate: t.start_date,
          endDate: t.end_date,
          monthlyLeadTarget: t.monthly_lead_target,
          monthlySalesTarget: t.monthly_sales_target,
          monthlyRevenueTarget: t.monthly_revenue_target,
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, params.targetId]);

  function onChange(field, value) {
    setData((d) => ({ ...d, [field]: value }));
  }

  // Auto-load defaults from the employee's profile when picked — the
  // company can still override any value before saving.
  async function onEmployeeChange(employeeId) {
    onChange("employeeId", employeeId);
    if (!employeeId) return;
    try {
      const employee = await getCompanyEmployee(companyId, employeeId, token);
      setData((d) => ({
        ...d,
        employeeId,
        monthlyLeadTarget: employee.monthly_lead_target ?? d.monthlyLeadTarget,
        monthlySalesTarget: employee.monthly_sales_target ?? d.monthlySalesTarget,
        monthlyRevenueTarget: employee.monthly_revenue_target ?? d.monthlyRevenueTarget,
      }));
    } catch {
      // Auto-default is a convenience only — leave fields as-is on failure.
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validation = validateTargetDetails(data);
    setErrors(validation);
    if (hasErrors(validation)) return;

    const payload = {
      employee_id: data.employeeId,
      start_date: data.startDate,
      end_date: data.endDate,
      monthly_lead_target: data.monthlyLeadTarget,
      monthly_sales_target: data.monthlySalesTarget,
      monthly_revenue_target: data.monthlyRevenueTarget,
    };

    setIsSubmitting(true);
    setApiError("");
    try {
      if (isEdit) {
        await updateTarget(companyId, params.targetId, payload);
      } else {
        await createTarget(companyId, payload);
      }
      navigate(ROUTES.TARGETS);
    } catch (err) {
      setApiError(err.message ?? "Could not save this target.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." />
      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>{isEdit ? "Edit Monthly Target" : "Create Monthly Target"}</h1>
            <Breadcrumb current="Targets" />
          </div>
        </div>

        <form className="panel cl-panel" onSubmit={handleSubmit}>
          <div className="form-fields-stack">
            <FormField label="Employee *" error={errors.employeeId}>
              <select value={data.employeeId} onChange={(e) => onEmployeeChange(e.target.value)} disabled={isEdit}>
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="form-row">
              <FormField label="Start Date *" error={errors.startDate}>
                <input type="date" value={data.startDate} onChange={(e) => onChange("startDate", e.target.value)} />
              </FormField>
              <FormField label="End Date *" error={errors.endDate}>
                <input type="date" value={data.endDate} onChange={(e) => onChange("endDate", e.target.value)} />
              </FormField>
            </div>

            <div className="form-row">
              <FormField label="Monthly Lead Target *" error={errors.monthlyLeadTarget}>
                <input type="number" min="0" value={data.monthlyLeadTarget} onChange={(e) => onChange("monthlyLeadTarget", e.target.value)} />
              </FormField>
              <FormField label="Monthly Sales Target *" error={errors.monthlySalesTarget}>
                <input type="number" min="0" value={data.monthlySalesTarget} onChange={(e) => onChange("monthlySalesTarget", e.target.value)} />
              </FormField>
            </div>

            <FormField label="Monthly Revenue Target *" error={errors.monthlyRevenueTarget}>
              <input type="number" min="0" step="0.01" value={data.monthlyRevenueTarget} onChange={(e) => onChange("monthlyRevenueTarget", e.target.value)} />
            </FormField>

            {apiError && <p className="form-field-error">{apiError}</p>}
          </div>

          <div className="cl-footer">
            <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.TARGETS)}>
              Cancel
            </button>
            <button type="submit" className="dash-primary-btn" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save Target"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
