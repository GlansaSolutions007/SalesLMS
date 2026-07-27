import FormField from "../../../components/FormField.jsx";
import ImageUploader from "../../../components/ImageUploader.jsx";
import { getBranchesForCompany, getDepartmentsForBranch, getDesignationsForCompany, getReportingManagers } from "../employeeFormData.js";

export default function EmployeeAssignmentFields({
  data,
  errors,
  onChange,
  showCompanyDropdown,
  companies,
  companiesLoading,
  companiesError,
}) {
  const branchOptions = getBranchesForCompany(data.companyId);
  const departmentOptions = getDepartmentsForBranch(data.branchId);
  const designationOptions = getDesignationsForCompany(data.companyId);
  const reportingManagers = getReportingManagers(data.companyId);

  return (
    <div className="form-fields-stack">
      <div className="form-logo-row">
        <ImageUploader
          label="Profile Photo"
          hint="PNG or JPG, up to 2MB"
          shape="circle"
          value={data.profilePhoto}
          onChange={(dataUrl) => onChange("profilePhoto", dataUrl)}
          onRemove={() => onChange("profilePhoto", "")}
        />
      </div>

      <div className="form-row">
        <FormField label="Employee Code (Auto Generated)">
          <input type="text" value={data.employeeCode} readOnly disabled />
        </FormField>
        {showCompanyDropdown && (
          <FormField label="Company *" error={errors.companyId || companiesError}>
            <select
              value={data.companyId}
              disabled={companiesLoading || Boolean(companiesError)}
              onChange={(e) => {
                onChange("companyId", e.target.value ? Number(e.target.value) : "");
                onChange("branchId", "");
                onChange("departmentId", "");
              }}
            >
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
      </div>

      <div className="form-row">
        <FormField label="Branch *" error={errors.branchId}>
          <select
            value={data.branchId}
            onChange={(e) => {
              onChange("branchId", e.target.value);
              onChange("departmentId", "");
            }}
            disabled={!data.companyId}
          >
            <option value="">{data.companyId ? "Select branch" : "Select company first"}</option>
            {branchOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Department *" error={errors.departmentId}>
          <select value={data.departmentId} onChange={(e) => onChange("departmentId", e.target.value)} disabled={!data.branchId}>
            <option value="">{data.branchId ? "Select department" : "Select branch first"}</option>
            {departmentOptions.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="form-row">
        <FormField label="Designation *" error={errors.designation}>
          <select value={data.designation} onChange={(e) => onChange("designation", e.target.value)} disabled={!data.companyId}>
            <option value="">{data.companyId ? "Select designation" : "Select company first"}</option>
            {designationOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Reporting Manager">
          <select value={data.reportingManagerId} onChange={(e) => onChange("reportingManagerId", e.target.value)} disabled={!data.companyId}>
            <option value="">{reportingManagers.length ? "Select reporting manager" : "No employees found for this company"}</option>
            {reportingManagers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.designation}
              </option>
            ))}
          </select>
        </FormField>
      </div>
    </div>
  );
}
