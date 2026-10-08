import { useEffect, useState } from "react";
import FormField from "../../../components/FormField.jsx";
import ImageUploader from "../../../components/ImageUploader.jsx";
import Icon from "../../../components/Icon.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { EMPLOYMENT_TYPES } from "../employeeFormData.js";
import { getJoiningDateLimits } from "../employeeFormValidation.js";
import { getCompanyById } from "../../../services/api/companyApi.js";
import BranchFormModal from "../../company/BranchFormModal.jsx";
import DesignationFormModal from "../../company/DesignationFormModal.jsx";
import useCompanyBranches from "../../company/useCompanyBranches.js";
import useCompanyDesignations from "../../company/useCompanyDesignations.js";

export default function EmployeeAssignmentFields({
  data,
  errors,
  onChange,
  onBranchSelect,
  onDesignationSelect,
  onCompanyNameChange,
  showCompanyDropdown,
  isSuperAdmin,
  companies,
  companiesLoading,
  companiesError,
  isEdit,
  showProfilePhoto = true,
  showEmploymentFields = true,
  showEmploymentMeta = true,
  showAddBranch = false,
  showAddDesignation = false,
  joiningDateLabel = "Joining Date",
}) {
  const { token } = useAuth();
  const { branches, isLoading: branchesLoading, refetch: refetchBranches } = useCompanyBranches(data.companyId);
  const { designations, isLoading: designationsLoading, refetch: refetchDesignations } = useCompanyDesignations(data.companyId);
  const { min: joiningDateMin, max: joiningDateMax } = getJoiningDateLimits(data.dob);

  const [lockedCompanyName, setLockedCompanyName] = useState("");
  const [addBranchOpen, setAddBranchOpen] = useState(false);
  const [addDesignationOpen, setAddDesignationOpen] = useState(false);
  const branchCompanies = companies.some((company) => String(company.id) === String(data.companyId))
    ? companies.filter((company) => String(company.id) === String(data.companyId))
    : data.companyId
      ? [{ id: data.companyId, company_name: lockedCompanyName || "Selected company" }]
      : [];

  useEffect(() => {
    onCompanyNameChange?.(lockedCompanyName);
  }, [lockedCompanyName, onCompanyNameChange]);

  useEffect(() => {
    const selectedBranch = branches.find((branch) => String(branch.id) === String(data.branchId)) ?? null;
    onBranchSelect(selectedBranch);
  }, [branches, data.branchId, onBranchSelect]);

  useEffect(() => {
    onDesignationSelect?.(designations.find((designation) => String(designation.id) === String(data.designationId)) ?? null);
  }, [data.designationId, designations, onDesignationSelect]);

  // A Company Admin never sees any Company field at all — not even a
  // locked/disabled one — since they only ever have one company. The
  // locked-but-visible display (company name shown, greyed out) is only for
  // a Super Admin whose company happens to be fixed for this screen (editing
  // an existing employee, or opened from a specific company's Employees
  // page) — they still benefit from seeing which company they're acting on.
  const hideCompanyField = !isSuperAdmin;

  // When the company is fixed for a Super Admin (editing, or opened from a
  // specific company's Employees page) there's no dropdown to pick from —
  // but the field still shows the company name in the same locked-select
  // style as Branch/Department/Designation forms, instead of disappearing
  // entirely.
  useEffect(() => {
    let cancelled = false;
    if (showCompanyDropdown || hideCompanyField || !data.companyId) {
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
  }, [showCompanyDropdown, hideCompanyField, data.companyId, token]);

  return (
    <div className="form-fields-stack">
      {showProfilePhoto && (
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
      )}

      {showEmploymentFields && (
        <>
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
                onCompanyNameChange?.(companies.find((company) => String(company.id) === e.target.value)?.company_name ?? "");
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
        ) : hideCompanyField ? null : (
          <FormField label="Company">
            <select value={data.companyId ?? ""} disabled>
              <option value={data.companyId ?? ""}>{lockedCompanyName || "Loading…"}</option>
            </select>
          </FormField>
        )}
      </div>

      <div className="form-row">
        <div className="employee-branch-field">
          <FormField label="Branch *" error={errors.branchId}>
            <div className="employee-branch-select-row">
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
              {showAddBranch && (
                <button
                  type="button"
                  className="employee-add-branch-btn"
                  onClick={() => setAddBranchOpen(true)}
                  disabled={!data.companyId || branchesLoading}
                  aria-label="Add Branch"
                  title="Add Branch"
                >
                  <Icon name="plus" size={16} />
                </button>
              )}
            </div>
          </FormField>
        </div>
        <div className="employee-branch-field">
          <FormField label="Designation *" error={errors.designationId}>
            <div className="employee-branch-select-row">
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
              {showAddDesignation && (
                <button
                  type="button"
                  className="employee-add-branch-btn"
                  onClick={() => setAddDesignationOpen(true)}
                  disabled={!data.companyId || designationsLoading}
                  aria-label="Add Designation"
                  title="Add Designation"
                >
                  <Icon name="plus" size={16} />
                </button>
              )}
            </div>
          </FormField>
        </div>
      </div>
        </>
      )}

      {showEmploymentMeta && (
      <div className="form-row">
        <FormField label={joiningDateLabel} error={errors.joiningDate}>
          <input
            type="date"
            min={joiningDateMin}
            max={joiningDateMax}
            value={data.joiningDate}
            onChange={(e) => onChange("joiningDate", e.target.value)}
          />
        </FormField>
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
      </div>
      )}

      {showAddBranch && addBranchOpen && (
        <BranchFormModal
          mode="add"
          companyId={data.companyId}
          companies={branchCompanies}
          onClose={() => setAddBranchOpen(false)}
          onSuccess={(branch) => {
            setAddBranchOpen(false);
            onChange("branchId", String(branch.id));
            refetchBranches();
          }}
        />
      )}
      {showAddDesignation && addDesignationOpen && (
        <DesignationFormModal
          mode="add"
          companyId={data.companyId}
          companies={branchCompanies}
          onClose={() => setAddDesignationOpen(false)}
          onSuccess={(designation) => {
            setAddDesignationOpen(false);
            onChange("designationId", String(designation.id));
            refetchDesignations();
          }}
        />
      )}
    </div>
  );
}
