import { useEffect, useState } from "react";
import FormField from "../../../components/FormField.jsx";
import ImageUploader from "../../../components/ImageUploader.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { getCompanyById } from "../../../services/api/companyApi.js";
import useCompanyBranches from "../../company/useCompanyBranches.js";
import useCompanyDesignations from "../../company/useCompanyDesignations.js";

export default function EmployeeAssignmentFields({
  data,
  errors,
  onChange,
  showCompanyDropdown,
  companies,
  companiesLoading,
  companiesError,
  isEdit,
}) {
  const { token } = useAuth();
  const { branches, isLoading: branchesLoading } = useCompanyBranches(data.companyId);
  const { designations, isLoading: designationsLoading } = useCompanyDesignations(data.companyId);

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
        <FormField label="Employee Code" error={errors.employeeCode}>
          {isEdit ? (
            <input type="text" value={data.employeeCode || "Auto-generated on save"} readOnly disabled />
          ) : (
            <input
              type="text"
              value={data.employeeCode}
              onChange={(e) => onChange("employeeCode", e.target.value)}
              placeholder="Auto-generated if left blank"
            />
          )}
        </FormField>
        {showCompanyDropdown ? (
          <FormField label="Company *" error={errors.companyId || companiesError}>
            <select
              value={data.companyId}
              disabled={companiesLoading || Boolean(companiesError)}
              onChange={(e) => {
                onChange("companyId", e.target.value ? Number(e.target.value) : "");
                onChange("branchId", "");
                onChange("designationId", "");
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
            <option value="">{!data.companyId ? "Select company first" : branchesLoading ? "Loading branches…" : "Select branch"}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.branch_name} ({b.branch_code})
              </option>
            ))}
          </select>
        </FormField>
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
      </div>
    </div>
  );
}
