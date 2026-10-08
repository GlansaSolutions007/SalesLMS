import FormField from "../../../components/FormField.jsx";

export default function AddressFields({
  data,
  errors,
  onChange,
  required,
  useBranchAddress = false,
  onUseBranchAddressChange,
  branchName,
  branchHasAddress,
}) {
  const mark = required ? " *" : "";
  const addressMessage = useBranchAddress
    ? branchName
      ? `Address is automatically populated from the ${branchName} branch.`
      : "Select a branch to populate its address."
    : branchName && !branchHasAddress
      ? "The selected branch does not have an address configured. You can enter the employee address manually."
      : "You can enter a different address for this employee.";

  return (
    <div className="form-fields-stack">
      <div style={{ marginBottom: "1rem" }}>
      <label className="employee-address-toggle mb-1" style={{ fontSize: "0.9rem" }}>
        <input
          type="checkbox"
          checked={useBranchAddress}
          disabled={Boolean(branchName && !branchHasAddress)}
          onChange={(e) => onUseBranchAddressChange(e.target.checked)}
        />
        <span>Use Branch Address</span>
      </label>
      </div>
      <p className="employee-address-hint">{addressMessage}</p>

      <FormField label={`Address${mark}`} error={errors.line1}>
        <input
          type="text"
          value={data.line1}
          onChange={(e) => onChange("line1", e.target.value)}
          placeholder="Street address, building, suite"
          disabled={useBranchAddress}
        />
      </FormField>

      <FormField label="Address Line 2">
        <input
          type="text"
          value={data.line2}
          onChange={(e) => onChange("line2", e.target.value)}
          placeholder="Apartment, floor (optional)"
          disabled={useBranchAddress}
        />
      </FormField>

      <div className="form-row">
        <FormField label={`Country${mark}`} error={errors.country}>
          <input type="text" value={data.country} onChange={(e) => onChange("country", e.target.value)} placeholder="e.g. India" disabled={useBranchAddress} />
        </FormField>
        <FormField label={`State${mark}`} error={errors.state}>
          <input type="text" value={data.state} onChange={(e) => onChange("state", e.target.value)} placeholder="e.g. Karnataka" disabled={useBranchAddress} />
        </FormField>
      </div>

      <div className="form-row">
        <FormField label={`City${mark}`} error={errors.city}>
          <input type="text" value={data.city} onChange={(e) => onChange("city", e.target.value)} placeholder="e.g. Bengaluru" disabled={useBranchAddress} />
        </FormField>
        <FormField label={`Pincode${mark}`} error={errors.pincode}>
          <input
            type="text"
            value={data.pincode}
            onChange={(e) => onChange("pincode", e.target.value)}
            placeholder="e.g. 560001"
            maxLength={10}
            disabled={useBranchAddress}
          />
        </FormField>
      </div>
    </div>
  );
}
