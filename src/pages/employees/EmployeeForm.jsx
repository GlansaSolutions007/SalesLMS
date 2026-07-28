import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Icon from "../../components/Icon.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import Toast from "../../components/Toast.jsx";
import WizardStepper from "../../components/WizardStepper.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import EmployeeAssignmentFields from "./form/EmployeeAssignmentFields.jsx";
import PersonalInfoFields from "./form/PersonalInfoFields.jsx";
import ContactInfoFields from "./form/ContactInfoFields.jsx";
import AddressFields from "./form/AddressFields.jsx";
import EmployeeDocumentsSection from "./form/EmployeeDocumentsSection.jsx";
import SkillsSection from "./form/SkillsSection.jsx";
import EmergencyContactSection from "./form/EmergencyContactSection.jsx";
import { emptyDocumentRow, emptySkillRow, emptyEmergencyContact, emptyAddress, SKILL_LEVELS, RELATIONSHIPS } from "./employeeFormData.js";
import { validateEmployeeDetails, validateAddressStep, validateDocuments, hasErrors } from "./employeeFormValidation.js";
import {
  getCompanies,
  getCompanyEmployee,
  getCompanyEmployeeDocuments,
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
  createCompanyEmployeeDocument,
  deleteCompanyEmployeeDocument,
  ApiValidationError,
} from "../../services/api/companyApi.js";
import { resolveApiAssetUrl } from "../../utils/apiAssetUrl.js";
import { ROUTES } from "../../router/routePaths.js";
import "./EmployeeForm.css";

const STEPS = [
  { key: "details", label: "Employee Details" },
  { key: "address", label: "Address & Documents" },
  { key: "skills", label: "Skills & Emergency Contact" },
];

const DETAIL_FIELD_MAP = {
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
      createLogin: false,
      password: "",
      confirmPassword: "",
      status: "Active",
    },
    address: {
      current: emptyAddress(),
      sameAsCurrent: true,
      permanent: emptyAddress(),
    },
    documents: [],
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

function mapEmployeeToFormData(employee, documents) {
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
    documents: (documents ?? []).map((doc) => ({
      id: doc.id,
      persisted: true,
      type: doc.document_type,
      number: doc.document_number ?? "",
      expiryDate: doc.expiry_date ? String(doc.expiry_date).slice(0, 10) : "",
      verificationStatus: doc.verification_status ?? "Pending",
      file: null,
      fileName: doc.file_name,
      filePath: doc.file_path,
    })),
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
  const [currentStep, setCurrentStep] = useState(0);
  const [maxReachedIndex, setMaxReachedIndex] = useState(0);
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

    Promise.all([
      getCompanyEmployee(routeCompanyId, routeEmployeeId, token),
      getCompanyEmployeeDocuments(routeCompanyId, routeEmployeeId, token),
    ])
      .then(([employee, documents]) => {
        if (cancelled) return;
        originalStatusRef.current = employee.status ?? "Active";
        originalSkillIdsRef.current = (employee.skills ?? []).map((s) => s.id);
        originalContactIdsRef.current = (employee.emergency_contacts ?? []).map((c) => c.id);
        setFormData(mapEmployeeToFormData(employee, documents));
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

  function addDocumentRow() {
    setDirty(true);
    setFormData((prev) => ({ ...prev, documents: [...prev.documents, emptyDocumentRow()] }));
  }

  async function removeDocumentRow(id) {
    const row = formData.documents.find((r) => r.id === id);
    if (row?.persisted) {
      try {
        await deleteCompanyEmployeeDocument(routeCompanyId, routeEmployeeId, id, token);
      } catch (error) {
        setToast({ tone: "error", message: error.message ?? "Could not delete this document." });
        return;
      }
    }
    setDirty(true);
    setFormData((prev) => ({ ...prev, documents: prev.documents.filter((r) => r.id !== id) }));
    setErrors((prev) => {
      if (!prev.documents?.[id]) return prev;
      const next = { ...prev.documents };
      delete next[id];
      return { ...prev, documents: next };
    });
  }

  function changeDocumentRow(id, field, value) {
    setDirty(true);
    setFormData((prev) => ({ ...prev, documents: prev.documents.map((row) => (row.id === id ? { ...row, [field]: value } : row)) }));
  }

  function selectDocumentFile(id, file) {
    setDirty(true);
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.map((row) => (row.id === id ? { ...row, file, fileName: file.name } : row)),
    }));
    setErrors((prev) => {
      if (!prev.documents?.[id]) return prev;
      const next = { ...prev.documents, [id]: { ...prev.documents[id] } };
      delete next[id].file;
      return { ...prev, documents: next };
    });
  }

  function removeDocumentFile(id) {
    setDirty(true);
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.map((row) => (row.id === id ? { ...row, file: null, fileName: "" } : row)),
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

  function validateStepDetails() {
    const detailsErrs = validateEmployeeDetails(formData.details, { requireCompany: showCompanyDropdown });
    setErrors((prev) => ({ ...prev, details: detailsErrs }));
    return !hasErrors(detailsErrs);
  }

  function validateStepAddress() {
    const addressErrs = validateAddressStep(formData.address);
    const docErrs = validateDocuments(formData.documents);
    setErrors((prev) => ({ ...prev, address: addressErrs, documents: docErrs }));
    return !hasErrors(addressErrs.current) && Object.keys(docErrs).length === 0;
  }

  function validateStep(index) {
    if (index === 0) return validateStepDetails();
    if (index === 1) return validateStepAddress();
    return true;
  }

  function stepHasError(index) {
    if (index === 0) return hasErrors(errors.details ?? {});
    if (index === 1) return hasErrors(errors.address?.current ?? {}) || Object.keys(errors.documents ?? {}).length > 0;
    return false;
  }

  function handleNext() {
    if (!validateStep(currentStep)) {
      setToast({ tone: "error", message: "Please fix the highlighted fields before continuing." });
      return;
    }
    const next = Math.min(currentStep + 1, STEPS.length - 1);
    setCurrentStep(next);
    setMaxReachedIndex((m) => Math.max(m, next));
  }

  function handlePrevious() {
    setCurrentStep((s) => Math.max(0, s - 1));
  }

  function goToStep(index) {
    if (index > maxReachedIndex) return;
    setCurrentStep(index);
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

  function buildDocumentTasks(companyId, employeeId) {
    return formData.documents
      .filter((row) => !row.persisted && row.file)
      .map((row) => {
        const fd = new FormData();
        fd.append("document_type", row.type);
        if (row.number) fd.append("document_number", row.number);
        if (row.expiryDate) fd.append("expiry_date", row.expiryDate);
        fd.append("file", row.file);
        return createCompanyEmployeeDocument(companyId, employeeId, fd, token);
      });
  }

  async function handleSaveEmployee() {
    const detailsOk = validateStepDetails();
    const addressOk = validateStepAddress();

    if (!detailsOk || !addressOk) {
      const badStepIndex = !detailsOk ? 0 : 1;
      setCurrentStep(badStepIndex);
      setMaxReachedIndex((m) => Math.max(m, badStepIndex));
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
        ...buildDocumentTasks(activeCompanyId, employee.id),
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
        setCurrentStep(0);
        setMaxReachedIndex((m) => Math.max(m, 0));
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

  const stepErrorFlags = [stepHasError(0), stepHasError(1), stepHasError(2)];

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
          <>
            <WizardStepper steps={STEPS} currentIndex={currentStep} maxReachedIndex={maxReachedIndex} stepErrors={stepErrorFlags} onStepClick={goToStep} />

            <div className="panel wizard-panel">
              <div key={currentStep} className="wizard-panel-inner">
                {currentStep === 0 && (
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
                    />

                    <div className="form-section-divider">
                      <span className="form-section-title">Personal Information</span>
                    </div>
                    <PersonalInfoFields data={formData.details} errors={errors.details ?? {}} onChange={updateDetails} />

                    <div className="form-section-divider">
                      <span className="form-section-title">Contact Information</span>
                    </div>
                    <ContactInfoFields data={formData.details} errors={errors.details ?? {}} onChange={updateDetails} isEdit={isEdit} />
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="form-fields-stack">
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
                      <span className="form-section-title">Documents</span>
                    </div>
                    <EmployeeDocumentsSection
                      rows={formData.documents}
                      errors={errors.documents ?? {}}
                      onAddRow={addDocumentRow}
                      onRemoveRow={removeDocumentRow}
                      onChangeRow={changeDocumentRow}
                      onFileSelect={selectDocumentFile}
                      onFileRemove={removeDocumentFile}
                    />
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="form-fields-stack">
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
                )}

                <div className="wizard-step-footer">
                  <div className="wizard-step-footer-left">
                    <button type="button" className="cl-btn" onClick={handleCancel} disabled={saving}>
                      Cancel
                    </button>
                    {currentStep > 0 && (
                      <button type="button" className="cl-btn" onClick={handlePrevious} disabled={saving}>
                        <Icon name="back" size={15} />
                        Previous
                      </button>
                    )}
                  </div>

                  <div className="wizard-step-footer-right">
                    {currentStep < STEPS.length - 1 ? (
                      <button type="button" className="dash-primary-btn" onClick={handleNext} disabled={saving}>
                        Next
                        <Icon name="arrow" size={15} />
                      </button>
                    ) : (
                      <button type="button" className="dash-primary-btn" onClick={handleSaveEmployee} disabled={saving}>
                        {saving ? <span className="fa-spinner light" /> : <Icon name="check" size={15} />}
                        {isEdit ? "Save Changes" : "Save Employee"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
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
      <div className="wizard-skeleton-steps">
        {Array.from({ length: 3 }).map((_, i) => (
          <span key={i} className="wizard-skeleton-circle" />
        ))}
      </div>
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
