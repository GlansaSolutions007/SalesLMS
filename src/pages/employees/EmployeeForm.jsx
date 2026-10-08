import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Icon from "../../components/Icon.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import Toast from "../../components/Toast.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import EmployeeAssignmentFields from "./form/EmployeeAssignmentFields.jsx";
import PersonalInfoFields from "./form/PersonalInfoFields.jsx";
import ContactInfoFields from "./form/ContactInfoFields.jsx";
import SalesMarketingFields from "./form/SalesMarketingFields.jsx";
import AddressFields from "./form/AddressFields.jsx";
import SkillsSection from "./form/SkillsSection.jsx";
import { emptySkillRow, emptyAddress, SKILL_LEVELS } from "./employeeFormData.js";
import { validateEmployeeDetails, validateAddressStep, hasErrors } from "./employeeFormValidation.js";
import {
  getCompanies,
  getCompanyEmployee,
  createCompanyEmployee,
  updateCompanyEmployee,
  updateCompanyEmployeeStatus,
  saveCompanyEmployeeAddress,
  createCompanyEmployeeSkill,
  updateCompanyEmployeeSkill,
  deleteCompanyEmployeeSkill,
  ApiValidationError,
} from "../../services/api/companyApi.js";
import { resolveApiAssetUrl } from "../../utils/apiAssetUrl.js";
import { ROUTES } from "../../router/routePaths.js";
import "./EmployeeForm.css";

const EMPLOYEE_WIZARD_STEPS = [
  "Personal Information",
  "Contact Information",
  "Employment",
  "Employee Address",
  "Sales & Marketing Information",
  "Review & Create",
];

const WIZARD_DETAIL_FIELDS = {
  1: ["firstName", "lastName", "dob"],
  2: ["email", "mobile", "password", "confirmPassword"],
  3: ["companyId", "branchId", "designationId", "joiningDate"],
  5: [
    "monthlyLeadTarget",
    "monthlySalesTarget",
    "monthlyRevenueTarget",
    "commissionPercentage",
  ],
};

const DETAIL_FIELD_MAP = {
  employee_code: "employeeCode",
  first_name: "firstName",
  last_name: "lastName",
  email: "email",
  mobile: "mobile",
  gender: "gender",
  date_of_birth: "dob",
  joining_date: "joiningDate",
  branch_id: "branchId",
  designation_id: "designationId",
  employment_type: "employmentType",
  profile_photo: "profilePhoto",
  login_password: "password",
  monthly_lead_target: "monthlyLeadTarget",
  monthly_sales_target: "monthlySalesTarget",
  monthly_revenue_target: "monthlyRevenueTarget",
  commission_type: "commissionType",
  commission_percentage: "commissionPercentage",
  work_mode: "workMode",
  preferred_customer_type: "preferredCustomerType",
};

function buildInitialFormData(lockedCompanyId) {
  return {
    details: {
      profilePhoto: "",
      profilePhotoFile: null,
      employeeCode: "",
      companyId: lockedCompanyId ?? "",
      branchId: "",
      designationId: "",
      firstName: "",
      lastName: "",
      gender: "",
      dob: "",
      joiningDate: "",
      employmentType: "Permanent",
      email: "",
      mobile: "",
      createLogin: true,
      password: "",
      confirmPassword: "",
      status: "Active",
      monthlyLeadTarget: "",
      monthlySalesTarget: "",
      monthlyRevenueTarget: "",
      commissionType: "",
      commissionPercentage: "",
      workMode: "",
      preferredCustomerType: "",
    },
    address: emptyAddress(),
    skills: [],
  };
}

function mapAddressRecord(record) {
  if (!record) return emptyAddress();
  return {
    line1: record.address_line1 ?? "",
    line2: record.address_line2 ?? "",
    country: record.country ?? "",
    state: record.state ?? "",
    city: record.city ?? "",
    pincode: record.pincode ?? "",
  };
}

function mapBranchAddress(branch) {
  return {
    line1: branch?.address ?? "",
    line2: "",
    city: branch?.city ?? "",
    state: branch?.state ?? "",
    country: branch?.country ?? "",
    pincode: branch?.pincode ?? "",
  };
}

function branchHasAddress(branch) {
  return Boolean(
    branch &&
      [branch.address, branch.city, branch.state, branch.country, branch.pincode].some(
        (value) => String(value ?? "").trim() !== ""
      )
  );
}

function mapEmployeeToFormData(employee) {
  const currentAddr = (employee.addresses ?? []).find((a) => a.address_type === "Current");

  return {
    details: {
      profilePhoto: employee.profile_photo ? resolveApiAssetUrl(employee.profile_photo) : "",
      profilePhotoFile: null,
      employeeCode: employee.employee_code ?? "",
      companyId: employee.company_id ?? "",
      branchId: employee.branch_id ?? "",
      designationId: employee.designation_id ?? "",
      firstName: employee.first_name ?? "",
      lastName: employee.last_name ?? "",
      gender: employee.gender ?? "",
      dob: employee.date_of_birth ? String(employee.date_of_birth).slice(0, 10) : "",
      joiningDate: employee.joining_date ? String(employee.joining_date).slice(0, 10) : "",
      employmentType: employee.employment_type ?? "Permanent",
      email: employee.email ?? "",
      mobile: employee.mobile ?? "",
      createLogin: false,
      password: "",
      confirmPassword: "",
      status: employee.status ?? "Active",
      monthlyLeadTarget: employee.monthly_lead_target != null ? String(employee.monthly_lead_target) : "",
      monthlySalesTarget: employee.monthly_sales_target != null ? String(employee.monthly_sales_target) : "",
      monthlyRevenueTarget: employee.monthly_revenue_target != null ? String(employee.monthly_revenue_target) : "",
      commissionType: employee.commission_type ?? "",
      commissionPercentage: employee.commission_percentage != null ? String(employee.commission_percentage) : "",
      workMode: employee.work_mode ?? "",
      preferredCustomerType: employee.preferred_customer_type ?? "",
    },
    address: mapAddressRecord(currentAddr),
    skills: (employee.skills ?? []).map((s) => ({
      id: s.id,
      persisted: true,
      name: s.skill_name ?? "",
      level: s.skill_level ?? SKILL_LEVELS[0],
      experienceYears: s.experience_years != null ? String(s.experience_years) : "",
    })),
  };
}

function buildEmployeeFormData(details) {
  const fd = new FormData();
  const append = (key, value) => {
    if (value === null || value === undefined || value === "") return;
    fd.append(key, value);
  };

  append("employee_code", details.employeeCode.trim());
  append("first_name", details.firstName.trim());
  append("last_name", details.lastName.trim());
  append("email", details.email.trim());
  append("mobile", details.mobile.trim());
  append("gender", details.gender);
  append("date_of_birth", details.dob);
  append("joining_date", details.joiningDate);
  append("branch_id", details.branchId);
  append("designation_id", details.designationId);
  append("employment_type", details.employmentType);
  append("monthly_lead_target", details.monthlyLeadTarget);
  append("monthly_sales_target", details.monthlySalesTarget);
  append("monthly_revenue_target", details.monthlyRevenueTarget);
  append("commission_type", details.commissionType);
  append("commission_percentage", details.commissionPercentage);
  append("work_mode", details.workMode);
  append("preferred_customer_type", details.preferredCustomerType);
  if (details.profilePhotoFile instanceof File) fd.append("profile_photo", details.profilePhotoFile);
  if (details.createLogin) {
    fd.append("create_login", "1");
    append("login_password", details.password);
  }
  return fd;
}

function displayDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function EmployeeReviewSection({ title, rows }) {
  return (
    <section className="employee-review-section">
      <h3>{title}</h3>
      <dl>
        {rows.map(([label, value]) => (
          <div className="employee-review-row" key={label}>
            <dt>{label}</dt>
            <dd>{value || "—"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function EmployeeReview({ formData, companies, user, companyName: lockedCompanyName, selectedBranch, selectedDesignation }) {
  const { details, address, skills } = formData;
  const companyName =
    companies.find((company) => String(company.id) === String(details.companyId))?.company_name ??
    lockedCompanyName ??
    user?.company?.company_name ??
    details.companyId;

  return (
    <div className="employee-review">
      <EmployeeReviewSection
        title="Personal Information"
        rows={[
          ["Profile Photo", details.profilePhoto ? "Uploaded" : "Not provided"],
          ["First Name", details.firstName],
          ["Last Name", details.lastName],
          ["Gender", details.gender],
          ["Date of Birth", displayDate(details.dob)],
        ]}
      />
      <EmployeeReviewSection
        title="Contact Information"
        rows={[
          ["Email", details.email],
          ["Mobile", details.mobile],
          ["Password", details.password ? "••••••••" : "—"],
          ["Confirm Password", details.confirmPassword ? "••••••••" : "—"],
        ]}
      />
      <EmployeeReviewSection
        title="Employment"
        rows={[
          ["Employee Code", details.employeeCode],
          ["Company", companyName],
          ["Branch", selectedBranch?.branch_name ?? details.branchId],
          ["Designation", selectedDesignation?.designation_name ?? details.designationId],
          ["DOJ", displayDate(details.joiningDate)],
          ["Employment Type", details.employmentType],
        ]}
      />
      <EmployeeReviewSection
        title="Employee Address"
        rows={[
          ["Address", address.line1],
          ["Address Line 2", address.line2],
          ["City", address.city],
          ["State", address.state],
          ["Country", address.country],
          ["Pincode", address.pincode],
        ]}
      />
      <EmployeeReviewSection
        title="Sales & Marketing Information"
        rows={[
          ["Monthly Lead Target", details.monthlyLeadTarget],
          ["Monthly Sales Target", details.monthlySalesTarget],
          ["Monthly Revenue Target", details.monthlyRevenueTarget],
          ["Commission Type", details.commissionType],
          ["Commission Percentage", details.commissionPercentage],
          ["Work Mode", details.workMode],
          ["Preferred Customer Type", details.preferredCustomerType],
        ]}
      />
      <EmployeeReviewSection
        title="Skills"
        rows={skills.length
          ? skills.map((skill, index) => [
            `Skill ${index + 1}`,
            [skill.name, skill.level, skill.experienceYears ? `${skill.experienceYears} years` : ""].filter(Boolean).join(" · "),
          ])
          : [["Skills", "No skills added"]]}
      />
    </div>
  );
}

function getStepForErrors(detailErrors, addressErrors = {}) {
  if (Object.keys(addressErrors).length) return 4;
  if (["firstName", "lastName", "dob"].some((field) => detailErrors[field])) return 1;
  if (["email", "mobile", "password", "confirmPassword"].some((field) => detailErrors[field])) return 2;
  if (["employeeCode", "companyId", "branchId", "designationId", "joiningDate"].some((field) => detailErrors[field])) return 3;
  if (["monthlyLeadTarget", "monthlySalesTarget", "monthlyRevenueTarget", "commissionType", "commissionPercentage", "workMode", "preferredCustomerType"].some((field) => detailErrors[field])) return 5;
  return 1;
}

export default function EmployeeForm() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { roleName, user, token } = useAuth();

  const isEdit = Boolean(params.employeeId);
  const routeCompanyId = params.companyId ? Number(params.companyId) : null;
  const routeEmployeeId = params.employeeId ? Number(params.employeeId) : null;

  // Three ways a Company can end up fixed for this employee: opened from a
  // specific Company's Employees page (router state), editing an existing
  // employee (company comes from the route), or the logged-in user is a
  // Company Admin (locked to their own company). Only a Super Admin adding a
  // new employee directly gets to choose.
  const fromCompanyId = location.state?.companyId ?? null;
  const isSuperAdmin = roleName === "Super Admin";
  const showCompanyDropdown = !isEdit && isSuperAdmin && !fromCompanyId;
  const lockedCompanyId = isEdit ? routeCompanyId : (fromCompanyId ?? (!isSuperAdmin ? user?.company?.id ?? null : null));

  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState("");
  const [formData, setFormData] = useState(() => buildInitialFormData(lockedCompanyId));
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedDesignation, setSelectedDesignation] = useState(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState("");
  const [useBranchAddress, setUseBranchAddress] = useState(() => !isEdit);
  const [wizardStep, setWizardStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(showCompanyDropdown);
  const [companiesError, setCompaniesError] = useState("");

  const originalStatusRef = useRef("Active");
  const originalSkillIdsRef = useRef([]);

  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;
    setLoading(true);
    setLoadError("");

    getCompanyEmployee(routeCompanyId, routeEmployeeId, token)
      .then((employee) => {
        if (cancelled) return;
        originalStatusRef.current = employee.status ?? "Active";
        originalSkillIdsRef.current = (employee.skills ?? []).map((s) => s.id);
        setFormData(mapEmployeeToFormData(employee));
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message ?? "Could not load this employee.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, routeCompanyId, routeEmployeeId, token]);

  useEffect(() => {
    if (!showCompanyDropdown) return undefined;

    let cancelled = false;
    setCompaniesLoading(true);
    setCompaniesError("");

    getCompanies({ per_page: 100, sort: "company_name", dir: "asc" }, token)
      .then((result) => {
        if (!cancelled) setCompanies(result.items);
      })
      .catch((error) => {
        if (!cancelled) setCompaniesError(error.message ?? "Could not load companies.");
      })
      .finally(() => {
        if (!cancelled) setCompaniesLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCompanyDropdown, token]);

  useEffect(() => {
    if (!useBranchAddress) return;

    if (selectedBranch && !branchHasAddress(selectedBranch)) {
      setFormData((prev) => ({ ...prev, address: emptyAddress() }));
      setUseBranchAddress(false);
      return;
    }

    setFormData((prev) => ({ ...prev, address: mapBranchAddress(selectedBranch) }));
    setErrors((prev) => (prev.address ? { ...prev, address: {} } : prev));
  }, [selectedBranch, useBranchAddress]);

  function handleUseBranchAddressChange(checked) {
    setDirty(true);
    setErrors((prev) => (prev.address ? { ...prev, address: {} } : prev));
    setUseBranchAddress(checked);
  }

  function updateDetails(field, value) {
    setDirty(true);
    setFormData((prev) => ({ ...prev, details: { ...prev.details, [field]: value } }));
    setErrors((prev) => {
      if (!prev.details?.[field] && !(field === "dob" && prev.details?.joiningDate)) return prev;
      const next = { ...prev.details };
      delete next[field];
      if (field === "dob") delete next.joiningDate;
      return { ...prev, details: next };
    });
  }

  function updateAddress(field, value) {
    setDirty(true);
    setFormData((prev) => ({ ...prev, address: { ...prev.address, [field]: value } }));
    setErrors((prev) => {
      if (!prev.address?.[field]) return prev;
      const next = { ...prev.address };
      delete next[field];
      return { ...prev, address: next };
    });
  }

  function addSkillRow() {
    setDirty(true);
    setFormData((prev) => ({ ...prev, skills: [...prev.skills, emptySkillRow()] }));
  }

  function removeSkillRow(id) {
    setDirty(true);
    setFormData((prev) => ({ ...prev, skills: prev.skills.filter((row) => row.id !== id) }));
  }

  function changeSkillRow(id, field, value) {
    setDirty(true);
    setFormData((prev) => ({ ...prev, skills: prev.skills.map((row) => (row.id === id ? { ...row, [field]: value } : row)) }));
  }

  function validateForm() {
    const detailsErrs = validateEmployeeDetails(formData.details, { requireCompany: showCompanyDropdown });
    const addressErrs = validateAddressStep(formData.address, { required: !useBranchAddress });
    setErrors((prev) => ({ ...prev, details: detailsErrs, address: addressErrs }));
    if (!isEdit && (hasErrors(detailsErrs) || hasErrors(addressErrs))) {
      setWizardStep(getStepForErrors(detailsErrs, addressErrs));
    }
    return !hasErrors(detailsErrs) && !hasErrors(addressErrs);
  }

  function handleNextStep() {
    const detailFields = WIZARD_DETAIL_FIELDS[wizardStep] ?? [];
    const validatedDetails = validateEmployeeDetails(formData.details, { requireCompany: showCompanyDropdown });
    const detailErrors = Object.fromEntries(
      detailFields.filter((field) => validatedDetails[field]).map((field) => [field, validatedDetails[field]])
    );
    const addressErrors = wizardStep === 4
      ? validateAddressStep(formData.address, { required: !useBranchAddress })
      : {};

    setErrors((prev) => {
      const nextDetails = { ...prev.details };
      detailFields.forEach((field) => delete nextDetails[field]);
      Object.assign(nextDetails, detailErrors);

      return {
        ...prev,
        details: nextDetails,
        ...(wizardStep === 4 ? { address: addressErrors } : {}),
      };
    });

    if (hasErrors(detailErrors) || hasErrors(addressErrors)) return;
    setWizardStep((step) => step + 1);
  }

  function buildAddressTasks(companyId, employeeId) {
    const tasks = [];
    const address = formData.address;
    if (address.line1 || address.city || address.state || address.country || address.pincode) {
      tasks.push(
        saveCompanyEmployeeAddress(
          companyId,
          employeeId,
          {
            address_type: "Current",
            address_line1: address.line1,
            address_line2: address.line2,
            city: address.city,
            state: address.state,
            country: address.country,
            pincode: address.pincode,
          },
          token
        )
      );
    }
    return tasks;
  }

  function buildSkillTasks(companyId, employeeId) {
    const tasks = [];
    const keptIds = new Set();

    formData.skills.forEach((row) => {
      if (!row.name.trim()) return;
      const payload = {
        skill_name: row.name.trim(),
        skill_level: row.level,
        experience_years: row.experienceYears === "" ? null : Number(row.experienceYears),
      };
      if (row.persisted) {
        keptIds.add(row.id);
        tasks.push(updateCompanyEmployeeSkill(companyId, employeeId, row.id, payload, token));
      } else {
        tasks.push(createCompanyEmployeeSkill(companyId, employeeId, payload, token));
      }
    });

    originalSkillIdsRef.current
      .filter((id) => !keptIds.has(id))
      .forEach((id) => tasks.push(deleteCompanyEmployeeSkill(companyId, employeeId, id, token)));

    return tasks;
  }

  async function handleSaveEmployee() {
    if (!validateForm()) {
      setToast({ tone: "error", message: "Please fix the highlighted fields before saving." });
      return;
    }

    const activeCompanyId = isEdit ? routeCompanyId : formData.details.companyId;

    setSaving(true);
    try {
      const employeeFormData = buildEmployeeFormData(formData.details);
      const employee = isEdit
        ? await updateCompanyEmployee(activeCompanyId, routeEmployeeId, employeeFormData, token)
        : (await createCompanyEmployee(activeCompanyId, employeeFormData, token)).employee;

      const tasks = [
        ...buildAddressTasks(activeCompanyId, employee.id),
        ...buildSkillTasks(activeCompanyId, employee.id),
      ];
      if (isEdit && formData.details.status !== originalStatusRef.current) {
        tasks.push(updateCompanyEmployeeStatus(activeCompanyId, employee.id, { status: formData.details.status }, token));
      }

      const results = await Promise.allSettled(tasks);
      const failureCount = results.filter((r) => r.status === "rejected").length;

      setSaving(false);
      setDirty(false);

      if (failureCount === 0) {
        setToast({ tone: "success", message: isEdit ? "Employee updated successfully." : "Employee created successfully." });
      } else {
        setToast({
          tone: "error",
          message: `Employee ${isEdit ? "updated" : "created"}, but ${failureCount} related item${failureCount === 1 ? "" : "s"} couldn't be saved. Reopen this employee to retry.`,
        });
      }
      setTimeout(() => navigate(ROUTES.EMPLOYEES), 1000);
    } catch (err) {
      setSaving(false);
      if (err instanceof ApiValidationError) {
        const detailErrors = {};
        Object.entries(err.errors ?? {}).forEach(([field, messages]) => {
          const key = DETAIL_FIELD_MAP[field] ?? field;
          detailErrors[key] = Array.isArray(messages) ? messages[0] : messages;
        });
        setErrors((prev) => ({ ...prev, details: { ...prev.details, ...detailErrors } }));
        if (!isEdit) setWizardStep(getStepForErrors(detailErrors));
      }
      setToast({ tone: "error", message: err.message ?? "Something went wrong. Please try again." });
    }
  }

  function handleCancel() {
    if (dirty) {
      setConfirmCancel(true);
    } else {
      navigate(ROUTES.EMPLOYEES);
    }
  }

  return (
    <>
      <Topbar
        onMenuClick={toggleCollapsed}
        searchPlaceholder="Search..."
        notifications={3}
        messages={5}
      />

      <div className="cl-body wizard-page-body">
        <div className="wizard-sticky-header">
          <div className="wizard-header-text">
            <button type="button" className="cl-btn wizard-back-btn" onClick={handleCancel}>
              <Icon name="back" size={15} />
              Back to Employees
            </button>
            <h1>{isEdit ? "Edit Employee" : "Add Employee"}</h1>
            <p className="cl-breadcrumb">
              <span>Dashboard</span>
              <Icon name="chevronRight" size={13} />
              <span>Employees</span>
              <Icon name="chevronRight" size={13} />
              <span className="is-current">{isEdit ? "Edit Employee" : "Add Employee"}</span>
            </p>
          </div>
        </div>

        {loading ? (
          <EmployeeFormSkeleton />
        ) : loadError ? (
          <div className="panel wizard-panel">
            <p className="rl-api-error">{loadError}</p>
            <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.EMPLOYEES)}>
              Back to Employees
            </button>
          </div>
        ) : (
          <div className="panel wizard-panel">
            <div className="wizard-panel-inner">
              {!isEdit && (
                <nav className="employee-wizard-stepper" aria-label="Employee creation progress">
                  {EMPLOYEE_WIZARD_STEPS.map((label, index) => {
                    const stepNumber = index + 1;
                    return (
                      <div
                        className={`employee-wizard-step${wizardStep === stepNumber ? " is-current" : ""}${wizardStep > stepNumber ? " is-complete" : ""}`}
                        key={label}
                        aria-current={wizardStep === stepNumber ? "step" : undefined}
                      >
                        <span className="employee-wizard-step-number">
                          {wizardStep > stepNumber ? <Icon name="check" size={13} /> : stepNumber}
                        </span>
                        <span className="employee-wizard-step-label">{label}</span>
                      </div>
                    );
                  })}
                </nav>
              )}

              {isEdit ? (
                <>
                  <div className="form-fields-stack">
                    <EmployeeAssignmentFields
                      data={formData.details}
                      errors={errors.details ?? {}}
                      onChange={updateDetails}
                      onBranchSelect={setSelectedBranch}
                      onDesignationSelect={setSelectedDesignation}
                      onCompanyNameChange={setSelectedCompanyName}
                      showCompanyDropdown={showCompanyDropdown}
                      isSuperAdmin={isSuperAdmin}
                      companies={companies}
                      companiesLoading={companiesLoading}
                      companiesError={companiesError}
                      isEdit={isEdit}
                      showEmploymentMeta={false}
                    />

                    <div className="form-section-divider">
                      <span className="form-section-title">Personal Information</span>
                    </div>
                    <PersonalInfoFields data={formData.details} errors={errors.details ?? {}} onChange={updateDetails} />

                    <div className="form-section-divider">
                      <span className="form-section-title">Contact Information</span>
                    </div>
                    <ContactInfoFields data={formData.details} errors={errors.details ?? {}} onChange={updateDetails} isEdit={isEdit} />

                    <div className="form-section-divider">
                      <span className="form-section-title">Sales &amp; Marketing Information</span>
                    </div>
                    <SalesMarketingFields data={formData.details} errors={errors.details ?? {}} onChange={updateDetails} />

                    <div className="form-section-divider">
                      <span className="form-section-title">Employee Address</span>
                    </div>
                    <AddressFields
                      data={formData.address}
                      errors={errors.address ?? {}}
                      onChange={updateAddress}
                      required={!useBranchAddress}
                      useBranchAddress={useBranchAddress}
                      onUseBranchAddressChange={handleUseBranchAddressChange}
                      branchName={selectedBranch ? selectedBranch.branch_name || "selected" : ""}
                      branchHasAddress={branchHasAddress(selectedBranch)}
                    />

                    <div className="form-section-divider">
                      <span className="form-section-title">Skills</span>
                    </div>
                    <SkillsSection rows={formData.skills} onAddRow={addSkillRow} onRemoveRow={removeSkillRow} onChangeRow={changeSkillRow} />
                  </div>

                  <div className="wizard-step-footer wizard-step-footer-edit">
                    <button type="button" className="cl-btn" onClick={handleCancel} disabled={saving}>Cancel</button>
                    <button type="button" className="dash-primary-btn" onClick={handleSaveEmployee} disabled={saving}>
                      {saving ? <span className="fa-spinner light" /> : <Icon name="check" size={15} />}
                      Save Changes
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <header className="employee-wizard-heading">
                    <span>Step {wizardStep} of {EMPLOYEE_WIZARD_STEPS.length}</span>
                    <h2>{EMPLOYEE_WIZARD_STEPS[wizardStep - 1]}</h2>
                  </header>

                  <div hidden={wizardStep !== 1 && wizardStep !== 3}>
                    <EmployeeAssignmentFields
                      data={formData.details}
                      errors={errors.details ?? {}}
                      onChange={updateDetails}
                      onBranchSelect={setSelectedBranch}
                      onDesignationSelect={setSelectedDesignation}
                      onCompanyNameChange={setSelectedCompanyName}
                      showCompanyDropdown={showCompanyDropdown}
                      isSuperAdmin={isSuperAdmin}
                      companies={companies}
                      companiesLoading={companiesLoading}
                      companiesError={companiesError}
                      isEdit={false}
                      showProfilePhoto={wizardStep === 1}
                      showEmploymentFields={wizardStep === 3}
                      showEmploymentMeta={wizardStep === 3}
                      showAddBranch={wizardStep === 3}
                      showAddDesignation={wizardStep === 3}
                      joiningDateLabel="DOJ"
                    />
                  </div>

                  {wizardStep === 1 && (
                    <div className="form-fields-stack">
                      <PersonalInfoFields
                        data={formData.details}
                        errors={errors.details ?? {}}
                        onChange={updateDetails}
                        showJoiningDate={false}
                        showEmploymentType={false}
                      />
                    </div>
                  )}

                  {wizardStep === 2 && (
                    <ContactInfoFields data={formData.details} errors={errors.details ?? {}} onChange={updateDetails} isEdit={false} />
                  )}

                  {wizardStep === 4 && (
                    <AddressFields
                      data={formData.address}
                      errors={errors.address ?? {}}
                      onChange={updateAddress}
                      required={!useBranchAddress}
                      useBranchAddress={useBranchAddress}
                      onUseBranchAddressChange={handleUseBranchAddressChange}
                      branchName={selectedBranch ? selectedBranch.branch_name || "selected" : ""}
                      branchHasAddress={branchHasAddress(selectedBranch)}
                    />
                  )}

                  {wizardStep === 5 && (
                    <div className="form-fields-stack">
                      <SalesMarketingFields data={formData.details} errors={errors.details ?? {}} onChange={updateDetails} />
                      <div className="form-section-divider">
                        <span className="form-section-title">Skills</span>
                      </div>
                      <SkillsSection rows={formData.skills} onAddRow={addSkillRow} onRemoveRow={removeSkillRow} onChangeRow={changeSkillRow} />
                    </div>
                  )}

                  {wizardStep === 6 && (
                    <EmployeeReview
                      formData={formData}
                      companies={companies}
                      user={user}
                      companyName={selectedCompanyName}
                      selectedBranch={selectedBranch}
                      selectedDesignation={selectedDesignation}
                    />
                  )}

                  <div className="wizard-step-footer">
                    {wizardStep > 1 ? (
                      <button type="button" className="cl-btn" onClick={() => setWizardStep((step) => step - 1)} disabled={saving}>
                        Back
                      </button>
                    ) : <span />}
                    {wizardStep < EMPLOYEE_WIZARD_STEPS.length ? (
                      <button type="button" className="dash-primary-btn" onClick={handleNextStep}>
                        Next
                        <Icon name="chevronRight" size={15} />
                      </button>
                    ) : (
                      <button type="button" className="dash-primary-btn" onClick={handleSaveEmployee} disabled={saving}>
                        {saving ? <span className="fa-spinner light" /> : <Icon name="check" size={15} />}
                        Save
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />

      {confirmCancel && (
        <ConfirmDialog
          title="Discard changes?"
          message="You have unsaved changes. Leaving now will discard them."
          confirmLabel="Discard"
          onCancel={() => setConfirmCancel(false)}
          onConfirm={() => {
            setConfirmCancel(false);
            navigate(ROUTES.EMPLOYEES);
          }}
        />
      )}
    </>
  );
}

function EmployeeFormSkeleton() {
  return (
    <div className="wizard-skeleton">
      <div className="panel wizard-skeleton-panel">
        <span className="wizard-skeleton-block w-30" />
        <span className="wizard-skeleton-block w-60" />
        <span className="wizard-skeleton-block w-100" />
        <span className="wizard-skeleton-block w-100" />
        <span className="wizard-skeleton-block w-60" />
      </div>
    </div>
  );
}
