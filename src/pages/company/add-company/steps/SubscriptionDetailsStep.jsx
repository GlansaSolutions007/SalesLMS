import FormTextField from "../components/FormTextField.jsx";
import FormSelectField from "../components/FormSelectField.jsx";
import Icon from "../../../../components/Icon.jsx";

const PAYMENT_STATUSES = ["Pending", "Paid", "Failed"];

export default function SubscriptionDetailsStep({ control, errors, setValue, plans, plansLoading, plansError }) {
  function applyPlanDefaults(planId) {
    const plan = plans.find((p) => String(p.id) === String(planId));
    if (!plan) return;
    if (plan.employee_limit != null) setValue("employee_limit", String(plan.employee_limit));
    if (plan.trainer_limit != null) setValue("trainer_limit", String(plan.trainer_limit));
    if (plan.storage_limit != null) setValue("storage_limit", String(plan.storage_limit));
    if (plan.amount != null) setValue("amount", String(plan.amount));
  }

  return (
    <div className="form-fields-stack">
      <p className="form-hint-box">This step is optional — you can leave it blank and set up a subscription for this company later.</p>

      <div className="form-row">
        <FormSelectField
          control={control}
          name="plan_id"
          label="Subscription Plan"
          options={plans}
          getOptionValue={(plan) => plan.id}
          getOptionLabel={(plan) => plan.name}
          disabled={plansLoading || Boolean(plansError)}
          placeholder={plansLoading ? "Loading plans..." : plansError ? "Could not load plans" : "Select a plan"}
          error={errors.plan_id?.message}
          onValueChange={applyPlanDefaults}
        />
        <FormTextField control={control} name="subscription_start" label="Subscription Start Date" type="date" error={errors.subscription_start?.message} />
      </div>

      {plansError && (
        <div className="form-alert-box">
          <Icon name="warning" size={15} />
          {plansError}
        </div>
      )}

      <div className="form-row">
        <FormTextField control={control} name="employee_limit" label="Employee Limit" type="number" error={errors.employee_limit?.message} />
        <FormTextField control={control} name="trainer_limit" label="Trainer Limit" type="number" error={errors.trainer_limit?.message} />
      </div>

      <div className="form-row">
        <FormTextField control={control} name="storage_limit" label="Storage Limit (MB)" type="number" error={errors.storage_limit?.message} />
        <FormTextField control={control} name="amount" label="Amount" type="number" error={errors.amount?.message} />
      </div>

      <FormSelectField control={control} name="payment_status" label="Payment Status" options={PAYMENT_STATUSES} error={errors.payment_status?.message} />
    </div>
  );
}
