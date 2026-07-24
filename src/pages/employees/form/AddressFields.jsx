import FormField from "../../../components/FormField.jsx";
import { COUNTRIES, STATES_BY_COUNTRY, CITIES_BY_STATE } from "../../../data/locations.js";

export default function AddressFields({ data, errors, onChange, required, disabled = false }) {
  const stateOptions = STATES_BY_COUNTRY[data.country] ?? [];
  const cityOptions = CITIES_BY_STATE[data.state] ?? [];
  const mark = required ? " *" : "";

  return (
    <div className="form-fields-stack">
      <FormField label={`Address Line 1${mark}`} error={errors.line1}>
        <input
          type="text"
          value={data.line1}
          onChange={(e) => onChange("line1", e.target.value)}
          placeholder="Street address, building, suite"
          disabled={disabled}
        />
      </FormField>

      <FormField label="Address Line 2">
        <input
          type="text"
          value={data.line2}
          onChange={(e) => onChange("line2", e.target.value)}
          placeholder="Apartment, floor (optional)"
          disabled={disabled}
        />
      </FormField>

      <div className="form-row">
        <FormField label={`Country${mark}`} error={errors.country}>
          <select
            value={data.country}
            onChange={(e) => {
              onChange("country", e.target.value);
              onChange("state", "");
              onChange("city", "");
            }}
            disabled={disabled}
          >
            <option value="">Select country</option>
            {COUNTRIES.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label={`State${mark}`} error={errors.state}>
          <select
            value={data.state}
            onChange={(e) => {
              onChange("state", e.target.value);
              onChange("city", "");
            }}
            disabled={disabled || !data.country}
          >
            <option value="">{data.country ? "Select state" : "Select country first"}</option>
            {stateOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="form-row">
        <FormField label={`City${mark}`} error={errors.city}>
          <select value={data.city} onChange={(e) => onChange("city", e.target.value)} disabled={disabled || !data.state}>
            <option value="">{data.state ? "Select city" : "Select state first"}</option>
            {cityOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label={`Pincode${mark}`} error={errors.pincode}>
          <input
            type="text"
            value={data.pincode}
            onChange={(e) => onChange("pincode", e.target.value)}
            placeholder="e.g. 560001"
            maxLength={10}
            disabled={disabled}
          />
        </FormField>
      </div>
    </div>
  );
}
