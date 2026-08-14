import FormField from "../../../components/FormField.jsx";
import { COMMISSION_TYPES, WORK_MODES, CUSTOMER_TYPES } from "../employeeFormData.js";

export default function SalesMarketingFields({ data, errors, onChange }) {
  return (
    <div className="form-fields-stack">
      <div className="form-row">
        <FormField label="Monthly Lead Target" error={errors.monthlyLeadTarget}>
          <input
            type="number"
            min="0"
            value={data.monthlyLeadTarget}
            onChange={(e) => onChange("monthlyLeadTarget", e.target.value)}
          />
        </FormField>
        <FormField label="Monthly Sales Target" error={errors.monthlySalesTarget}>
          <input
            type="number"
            min="0"
            value={data.monthlySalesTarget}
            onChange={(e) => onChange("monthlySalesTarget", e.target.value)}
          />
        </FormField>
      </div>

      <div className="form-row">
        <FormField label="Monthly Revenue Target" error={errors.monthlyRevenueTarget}>
          <input
            type="number"
            min="0"
            step="0.01"
            value={data.monthlyRevenueTarget}
            onChange={(e) => onChange("monthlyRevenueTarget", e.target.value)}
          />
        </FormField>
        <FormField label="Commission Percentage" error={errors.commissionPercentage}>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={data.commissionPercentage}
            onChange={(e) => onChange("commissionPercentage", e.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Commission Type">
        <div className="seg-group">
          {COMMISSION_TYPES.map((opt) => (
            <button
              type="button"
              key={opt}
              className={`seg-chip${data.commissionType === opt ? " is-active" : ""}`}
              onClick={() => onChange("commissionType", opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </FormField>

      <FormField label="Work Mode">
        <div className="seg-group">
          {WORK_MODES.map((opt) => (
            <button
              type="button"
              key={opt}
              className={`seg-chip${data.workMode === opt ? " is-active" : ""}`}
              onClick={() => onChange("workMode", opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </FormField>

      <FormField label="Preferred Customer Type">
        <div className="seg-group">
          {CUSTOMER_TYPES.map((opt) => (
            <button
              type="button"
              key={opt}
              className={`seg-chip${data.preferredCustomerType === opt ? " is-active" : ""}`}
              onClick={() => onChange("preferredCustomerType", opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </FormField>
    </div>
  );
}
