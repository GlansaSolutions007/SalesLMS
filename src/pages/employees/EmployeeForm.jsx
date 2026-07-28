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
import AddressFields from "./form/AddressFields.jsx";
import SkillsSection from "./form/SkillsSection.jsx";
import EmergencyContactSection from "./form/EmergencyContactSection.jsx";
import { emptySkillRow, emptyEmergencyContact, emptyAddress, SKILL_LEVELS, RELATIONSHIPS } from "./employeeFormData.js";
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
  createCompanyEmployeeEmergencyContact,
  updateCompanyEmployeeEmergencyContact,
  deleteCompanyEmployeeEmergencyContact,
  ApiValidationError,
} from "../../services/api/companyApi.js";
import { resolveApiAssetUrl } from "../../utils/apiAssetUrl.js";
import { ROUTES } from "../../router/routePaths.js";
import "./EmployeeForm.css";

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
  department_id: "departmentId",
  designation_id: "designationId",
  manager_id: "reportingManagerId",
  employment_type: "employmentType",
  profile_photo: "profilePhoto",
  login_password: "password",
};

function buildInitialFormData(lockedCompanyId) {
  return {
    details: {
      profilePhoto: "",
      profilePhotoFile: null,
      employeeCode: "",
      companyId: lockedCompanyId ?? "",
      branchId: "",
      departmentId: "",
      designationId: "",
      reportingManagerId: "",
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
    },
    address: {
      current: emptyAddress(),
      sameAsCurrent: true,
      permanent: emptyAddress(),
    },
    skills: [],
    emergencyContacts: [],
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

function mapEmployeeToFormData(employee) {
  const currentAddr = (employee.addresses ?? []).find((a) => a.address_type === "Current");
  const permanentAddr = (employee.addresses ?? []).find((a) => a.address_type === "Permanent");

  return {
    details: {
      profilePhoto: employee.profile_photo ? resolveApiAssetUrl(employee.profile_photo) : "",
      profilePhotoFile: null,
      employeeCode: employee.employee_code ?? "",
      companyId: employee.company_id ?? "",
      branchId: employee.branch_id ?? "",
      departmentId: employee.department_id ?? "",
      designationId: employee.designation_id ?? "",
      reportingManagerId: employee.manager_id ?? "",
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
    },
    address: {
      current: mapAddressRecord(currentAddr),
      sameAsCurrent: !permanentAddr,
      permanent: mapAddressRecord(permanentAddr),
    },
    skills: (employee.skills ?? []).map((s) => ({
      id: s.id,
      persisted: true,
      name: s.skill_name ?? "",
      level: s.skill_level ?? SKILL_LEVELS[0],
      experienceYears: s.experience_years != null ? String(s.experience_years) : "",
    })),
    emergencyContacts: (employee.emergency_contacts ?? []).map((c) => ({
      id: c.id,
      persisted: true,
      name: c.contact_name ?? "",
      relationship: c.relationship ?? RELATIONSHIPS[0],
      mobile: c.mobile ?? "",
      email: c.email ?? "",
      address: c.address ?? "",
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
  append("department_id", details.departmentId);
  append("designation_id", details.designationId);
  append("manager_id", details.reportingManagerId);
  append("employment_type", details.employmentType);
  if (details.profilePhotoFile instanceof File) fd.append("profile_photo", details.profilePhotoFile);
  if (details.createLogin) {
    fd.append("create_login", "1");
    append("login_password", details.password);
  }
  return fd;
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
  const originalContactIdsRef = useRef([]);

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
        originalContactIdsRef.current = (employee.emergency_contacts ?? []).map((c) => c.id);
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

  function updateDetails(field, value) {
    setDirty(true);
    setFormData((prev) => ({ ...prev, details: { ...prev.details, [field]: value } }));
    setErrors((prev) => {
      if (!prev.details?.[field]) return prev;
      const next = { ...prev.details };
      delete next[field];
      return { ...prev, details: next };
    });
  }

  function updateCurrentAddress(field, value) {
    setDirty(true);
    setFormData((prev) => {
      const nextCurrent = { ...prev.address.current, [field]: value };
      const nextPermanent = prev.address.sameAsCurrent ? nextCurrent : prev.address.permanent;
      return { ...prev, address: { ...prev.address, current: nextCurrent, permanent: nextPermanent } };
    });
    setErrors((prev) => {
      if (!prev.address?.current?.[field]) return prev;
      const nextCurrentErrors = { ...prev.address.current };
      delete nextCurrentErrors[field];
      return { ...prev, address: { ...prev.address, current: nextCurrentErrors } };
    });
  }

  function updatePermanentAddress(field, value) {
    setDirty(true);
    setFormData((prev) => ({ ...prev, address: { ...prev.address, permanent: { ...prev.address.permanent, [field]: value } } }));
  }

  function toggleSameAsCurrent(checked) {
    setDirty(true);
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, sameAsCurrent: checked, permanent: checked ? { ...prev.address.current } : prev.address.permanent },
    }));
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

  function addEmergencyContact() {
    setDirty(true);
    setFormData((prev) => ({ ...prev, emergencyContacts: [...prev.emergencyContacts, emptyEmergencyContact()] }));
  }

  function removeEmergencyContact(id) {
    setDirty(true);
    setFormData((prev) => ({ ...prev, emergencyContacts: prev.emergencyContacts.filter((row) => row.id !== id) }));
  }

  function changeEmergencyContact(id, field, value) {
    setDirty(true);
    setFormData((prev) => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    }));
  }

  function validateForm() {
    const detailsErrs = validateEmployeeDetails(formData.details, { requireCompany: showCompanyDropdown });
    const addressErrs = validateAddressStep(formData.address);
    setErrors((prev) => ({ ...prev, details: detailsErrs, address: addressErrs }));
    return !hasErrors(detailsErrs) && !hasErrors(addressErrs.current);
  }

  function buildAddressTasks(companyId, employeeId) {
    const tasks = [];
    const current = formData.address.current;
    if (current.line1 || current.city || current.state || current.country || current.pincode) {
      tasks.push(
        saveCompanyEmployeeAddress(
          companyId,
          employeeId,
          {
            address_type: "Current",
            address_line1: current.line1,
            address_line2: current.line2,
            city: current.city,
            state: current.state,
            country: current.country,
            pincode: current.pincode,
          },
          token
        )
      );
    }
    if (!formData.address.sameAsCurrent) {
      const permanent = formData.address.permanent;
      if (permanent.line1 || permanent.city || permanent.state || permanent.country || permanent.pincode) {
        tasks.push(
          saveCompanyEmployeeAddress(
            companyId,
            employeeId,
            {
              address_type: "Permanent",
              address_line1: permanent.line1,
              address_line2: permanent.line2,
              city: permanent.city,
              state: permanent.state,
              country: permanent.country,
              pincode: permanent.pincode,
            },
            token
          )
        );
      }
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

  function buildContactTasks(companyId, employeeId) {
    const tasks = [];
    const keptIds = new Set();

    formData.emergencyContacts.forEach((row) => {
      if (!row.name.trim()) return;
      const payload = {
        contact_name: row.name.trim(),
        relationship: row.relationship,
        mobile: row.mobile,
        email: row.email,
        address: row.address,
      };
      if (row.persisted) {
        keptIds.add(row.id);
        tasks.push(updateCompanyEmployeeEmergencyContact(companyId, employeeId, row.id, payload, token));
      } else {
        tasks.push(createCompanyEmployeeEmergencyContact(companyId, employeeId, payload, token));
      }
    });

    originalContactIdsRef.current
      .filter((id) => !keptIds.has(id))
      .forEach((id) => tasks.push(deleteCompanyEmployeeEmergencyContact(companyId, employeeId, id, token)));

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
        ...buildContactTasks(activeCompanyId, employee.id),
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
              <div className="form-fields-stack">
                <EmployeeAssignmentFields
                  data={formData.details}
                  errors={errors.details ?? {}}
                  onChange={updateDetails}
                  showCompanyDropdown={showCompanyDropdown}
                  companies={companies}
                  companiesLoading={companiesLoading}
                  companiesError={companiesError}
                  excludeEmployeeId={routeEmployeeId}
                  isEdit={isEdit}
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
                  <span className="form-section-title">Current Address</span>
                </div>
                <AddressFields data={formData.address.current} errors={errors.address?.current ?? {}} onChange={updateCurrentAddress} required />

                <label className="ef-same-address">
                  <input type="checkbox" checked={formData.address.sameAsCurrent} onChange={(e) => toggleSameAsCurrent(e.target.checked)} />
                  <span>Same as Current Address</span>
                </label>

                <div className="form-section-divider">
                  <span className="form-section-title">Permanent Address</span>
                </div>
                <AddressFields
                  data={formData.address.permanent}
                  errors={{}}
                  onChange={updatePermanentAddress}
                  disabled={formData.address.sameAsCurrent}
                />

                <div className="form-section-divider">
                  <span className="form-section-title">Skills</span>
                </div>
                <SkillsSection rows={formData.skills} onAddRow={addSkillRow} onRemoveRow={removeSkillRow} onChangeRow={changeSkillRow} />

                <div className="form-section-divider">
                  <span className="form-section-title">Emergency Contact</span>
                </div>
                <EmergencyContactSection
                  rows={formData.emergencyContacts}
                  onAddRow={addEmergencyContact}
                  onRemoveRow={removeEmergencyContact}
                  onChangeRow={changeEmergencyContact}
                />
              </div>

              <div className="wizard-step-footer">
                <div className="wizard-step-footer-left">
                  <button type="button" className="cl-btn" onClick={handleCancel} disabled={saving}>
                    Cancel
                  </button>
                </div>

                <div className="wizard-step-footer-right">
                  <button type="button" className="dash-primary-btn" onClick={handleSaveEmployee} disabled={saving}>
                    {saving ? <span className="fa-spinner light" /> : <Icon name="check" size={15} />}
                    {isEdit ? "Save Changes" : "Save Employee"}
                  </button>
                </div>
              </div>
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
