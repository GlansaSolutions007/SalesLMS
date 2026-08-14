import FormField from "../../../components/FormField.jsx";

export default function AddressFields({ data, errors, onChange, required }) {
  const mark = required ? " *" : "";

  return (
    <div className="form-fields-stack">
      <FormField label={`Address Line 1${mark}`} error={errors.line1}>
        <input
          type="text"
          value={data.line1}
          onChange={(e) => onChange("line1", e.target.value)}
          placeholder="Street address, building, suite"
        />
      </FormField>

      <FormField label="Address Line 2">
        <input
          type="text"
          value={data.line2}
          onChange={(e) => onChange("line2", e.target.value)}
          placeholder="Apartment, floor (optional)"
        />
      </FormField>

      <div className="form-row">
        <FormField label={`Country${mark}`} error={errors.country}>
          <input type="text" value={data.country} onChange={(e) => onChange("country", e.target.value)} placeholder="e.g. India" />
        </FormField>
        <FormField label={`State${mark}`} error={errors.state}>
          <input type="text" value={data.state} onChange={(e) => onChange("state", e.target.value)} placeholder="e.g. Karnataka" />
        </FormField>
      </div>

      <div className="form-row">
        <FormField label={`City${mark}`} error={errors.city}>
          <input type="text" value={data.city} onChange={(e) => onChange("city", e.target.value)} placeholder="e.g. Bengaluru" />
        </FormField>
        <FormField label={`Pincode${mark}`} error={errors.pincode}>
          <input
            type="text"
            value={data.pincode}
            onChange={(e) => onChange("pincode", e.target.value)}
            placeholder="e.g. 560001"
            maxLength={10}
          />
        </FormField>
      </div>
    </div>
  );
}
