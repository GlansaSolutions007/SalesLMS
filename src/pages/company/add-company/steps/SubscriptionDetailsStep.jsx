import { useEffect } from "react";
import FormField from "../../../../components/FormField.jsx";
import FormTextField from "../../../../components/FormTextField.jsx";
import FormSelectField from "../../../../components/FormSelectField.jsx";
import Icon from "../../../../components/Icon.jsx";
import { formatCurrency } from "../../companyDisplay.jsx";

const PAYMENT_STATUSES = ["Pending", "Paid", "Failed"];

// Mirrors SubscriptionPlan::BILLING_CYCLE_MONTHS on the backend — duration
// is derived from billing_cycle, never stored/sent as its own field.
const BILLING_CYCLE_MONTHS = { Monthly: 1, Quarterly: 3, "Half Yearly": 6, Yearly: 12 };

// The API always derives end_date itself (start_date + the plan's billing
// cycle) and ignores anything the client sends for it, so this is a
// read-only preview rather than a submitted field.
function computeEndDate(startDate, plan) {
  const months = BILLING_CYCLE_MONTHS[plan?.billing_cycle];
  if (!startDate || !months) return "";
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return "";
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  return end.toISOString().slice(0, 10);
}

export default function SubscriptionDetailsStep({ control, errors, watch, setValue, plans, plansLoading, plansError }) {
  const planId = watch("plan_id");
  const startDate = watch("subscription_start");
  const employeeLimit = watch("employee_limit");
  const selectedPlan = plans.find((p) => String(p.id) === String(planId));
  const endDate = computeEndDate(startDate, selectedPlan);

  function applyPlanDefaults(planId) {
    const plan = plans.find((p) => String(p.id) === String(planId));
    if (!plan) return;
    if (plan.employee_limit != null) setValue("employee_limit", String(plan.employee_limit));
    if (plan.storage_limit != null) setValue("storage_limit", String(plan.storage_limit));
  }

  // Total Amount = Employee Count × Price Per Employee, recalculated live
  // as either the plan or the employee count changes. Still a plain
  // editable field afterward, so an admin can override the computed total.
  useEffect(() => {
    const count = Number(employeeLimit);
    if (!selectedPlan || !employeeLimit || !Number.isFinite(count) || count <= 0) return;
    const total = count * Number(selectedPlan.price_per_employee ?? 0);
    setValue("amount", String(Math.round(total * 100) / 100));
  }, [selectedPlan, employeeLimit, setValue]);

  return (
    <div className="form-fields-stack">
      <div className="form-row">
        <FormSelectField
          control={control}
          name="plan_id"
          label="Subscription Plan"
          required
          options={plans}
          getOptionValue={(plan) => plan.id}
          getOptionLabel={(plan) => plan.plan_name}
          disabled={plansLoading || Boolean(plansError)}
          placeholder={plansLoading ? "Loading plans..." : plansError ? "Could not load plans" : "Select a plan"}
          error={errors.plan_id?.message}
          onValueChange={applyPlanDefaults}
        />
        <FormTextField control={control} name="subscription_start" label="Subscription Start Date" type="date" required error={errors.subscription_start?.message} />
      </div>

      {plansError && (
        <div className="form-alert-box">
          <Icon name="warning" size={15} />
          {plansError}
        </div>
      )}

      <div className="form-row">
        <FormField label="Subscription End Date">
          <input type="date" value={endDate} disabled placeholder="Select a plan and start date" />
        </FormField>
        <FormTextField control={control} name="employee_limit" label="Employee Count" type="number" required error={errors.employee_limit?.message} />
      </div>

      <div className="form-row is-hidden">
        <FormTextField control={control} name="trainer_limit" label="Trainer Limit" type="number" error={errors.trainer_limit?.message} />
        <FormTextField control={control} name="storage_limit" label="Storage Limit (MB)" type="number" error={errors.storage_limit?.message} />
      </div>

      <div className="form-row">
        <FormField label="Price Per Employee (₹)">
          <input type="text" value={selectedPlan ? formatCurrency(selectedPlan.price_per_employee) : ""} disabled placeholder="Select a plan" />
        </FormField>
        <FormTextField control={control} name="amount" label="Total Amount (₹)" type="number" error={errors.amount?.message} />
      </div>

      <div className="form-row">
        <FormSelectField control={control} name="payment_status" label="Payment Status" options={PAYMENT_STATUSES} error={errors.payment_status?.message} />
      </div>
    </div>
  );
}
