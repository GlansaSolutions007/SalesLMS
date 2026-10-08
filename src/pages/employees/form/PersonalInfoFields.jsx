import FormField from "../../../components/FormField.jsx";
import { GENDERS, EMPLOYMENT_TYPES } from "../employeeFormData.js";
import { getDateOfBirthLimits, getJoiningDateLimits } from "../employeeFormValidation.js";

export default function PersonalInfoFields({ data, errors, onChange, showJoiningDate = true, showEmploymentType = true }) {
  const { latestAllowed: dobMax } = getDateOfBirthLimits();
  const { min: joiningDateMin, max: joiningDateMax } = getJoiningDateLimits(data.dob);

  return (
    <div className="form-fields-stack">
      <div className="form-row">
        <FormField label="First Name *" error={errors.firstName}>
          <input type="text" value={data.firstName} onChange={(e) => onChange("firstName", e.target.value)} />
        </FormField>
        <FormField label="Last Name *" error={errors.lastName}>
          <input type="text" value={data.lastName} onChange={(e) => onChange("lastName", e.target.value)} />
        </FormField>
      </div>

      <div className="form-row">
        <FormField label="Gender">
          <select value={data.gender} onChange={(e) => onChange("gender", e.target.value)}>
            <option value="">Select gender</option>
            {GENDERS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Date of Birth" error={errors.dob}>
          <input type="date" max={dobMax} value={data.dob} onChange={(e) => onChange("dob", e.target.value)} />
        </FormField>
      </div>

      {(showJoiningDate || showEmploymentType) && (
        <div className="form-row">
          {showJoiningDate && (
            <FormField label="Joining Date" error={errors.joiningDate}>
              <input
                type="date"
                min={joiningDateMin}
                max={joiningDateMax}
                value={data.joiningDate}
                onChange={(e) => onChange("joiningDate", e.target.value)}
              />
            </FormField>
          )}

          {showEmploymentType && (
            <FormField label="Employment Type">
              <div className="seg-group">
                {EMPLOYMENT_TYPES.map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    className={`seg-chip${data.employmentType === opt ? " is-active" : ""}`}
                    onClick={() => onChange("employmentType", opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </FormField>
          )}
        </div>
      )}
    </div>
  );
}
