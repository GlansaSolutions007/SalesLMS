import { useEffect, useState } from "react";
import FormField from "../../../components/FormField.jsx";
import ImageUploader from "../../../components/ImageUploader.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { getCompanyById } from "../../../services/api/companyApi.js";
import useCompanyBranches from "../../company/useCompanyBranches.js";
import useCompanyDepartments from "../../company/useCompanyDepartments.js";
import useCompanyDesignations from "../../company/useCompanyDesignations.js";
import useCompanyEmployeeOptions from "../useCompanyEmployeeOptions.js";

export default function EmployeeAssignmentFields({
  data,
  errors,
  onChange,
  showCompanyDropdown,
  companies,
  companiesLoading,
  companiesError,
  excludeEmployeeId,
}) {
  const { token } = useAuth();
  const { branches, isLoading: branchesLoading } = useCompanyBranches(data.companyId);
  const { departments, isLoading: departmentsLoading } = useCompanyDepartments(data.companyId);
  const { designations, isLoading: designationsLoading } = useCompanyDesignations(data.companyId);
  const { options: managers, isLoading: managersLoading } = useCompanyEmployeeOptions(data.companyId, excludeEmployeeId);

  const [lockedCompanyName, setLockedCompanyName] = useState("");

  // When the company is fixed (Company Admin, opened from a specific
  // company's Employees page, or editing an existing employee) there's no
  // dropdown to pick from — but the field still shows the company name in
  // the same locked-select style as Branch/Department/Designation forms,
  // instead of disappearing entirely.
  useEffect(() => {
    let cancelled = false;
    if (showCompanyDropdown || !data.companyId) {
      setLockedCompanyName("");
      return undefined;
    }

    getCompanyById(data.companyId, token)
      .then((company) => {
        if (!cancelled) setLockedCompanyName(company?.company_name ?? "");
      })
      .catch(() => {
        if (!cancelled) setLockedCompanyName("");
      });

    return () => {
      cancelled = true;
    };
  }, [showCompanyDropdown, data.companyId, token]);

  return (
    <div className="form-fields-stack">
      <div className="form-logo-row">
        <ImageUploader
          label="Profile Photo"
          hint="PNG or JPG, up to 2MB"
          shape="circle"
          value={data.profilePhoto}
          onChange={(dataUrl, file) => {
            onChange("profilePhoto", dataUrl);
            onChange("profilePhotoFile", file);
          }}
          onRemove={() => {
            onChange("profilePhoto", "");
            onChange("profilePhotoFile", null);
          }}
        />
      </div>

      <div className="form-row">
        <FormField label="Employee Code">
          <input type="text" value={data.employeeCode || "Auto-generated on save"} readOnly disabled />
        </FormField>
        {showCompanyDropdown ? (
          <FormField label="Company *" error={errors.companyId || companiesError}>
            <select
              value={data.companyId}
              disabled={companiesLoading || Boolean(companiesError)}
              onChange={(e) => {
                onChange("companyId", e.target.value ? Number(e.target.value) : "");
                onChange("branchId", "");
                onChange("departmentId", "");
                onChange("designationId", "");
                onChange("reportingManagerId", "");
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
        ) : (
          <FormField label="Company">
            <select value={data.companyId ?? ""} disabled>
              <option value={data.companyId ?? ""}>{lockedCompanyName || "Loading…"}</option>
            </select>
          </FormField>
        )}
      </div>

      <div className="form-row">
        <FormField label="Branch *" error={errors.branchId}>
          <select
            value={data.branchId}
            onChange={(e) => onChange("branchId", e.target.value)}
            disabled={!data.companyId || branchesLoading}
          >
            <option value="">{!data.companyId ? "Select company first" : branchesLoading ? "Loading branches…" : "No branch"}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.branch_name} ({b.branch_code})
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Department *" error={errors.departmentId}>
          <select
            value={data.departmentId}
            onChange={(e) => onChange("departmentId", e.target.value)}
            disabled={!data.companyId || departmentsLoading}
          >
            <option value="">{!data.companyId ? "Select company first" : departmentsLoading ? "Loading departments…" : "Select department"}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.department_name}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="form-row">
        <FormField label="Designation *" error={errors.designationId}>
          <select
            value={data.designationId}
            onChange={(e) => onChange("designationId", e.target.value)}
            disabled={!data.companyId || designationsLoading}
          >
            <option value="">{!data.companyId ? "Select company first" : designationsLoading ? "Loading designations…" : "Select designation"}</option>
            {designations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.designation_name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Reporting Manager">
          <select
            value={data.reportingManagerId}
            onChange={(e) => onChange("reportingManagerId", e.target.value)}
            disabled={!data.companyId || managersLoading}
          >
            <option value="">
              {!data.companyId ? "Select company first" : managersLoading ? "Loading employees…" : managers.length ? "Select reporting manager" : "No employees found for this company"}
            </option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name} — {m.designation?.designation_name ?? "—"}
              </option>
            ))}
          </select>
        </FormField>
      </div>
    </div>
  );
}
