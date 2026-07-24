import { useEffect, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
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
import { generateEmployeeCode, emptyDocumentRow, emptySkillRow, emptyEmergencyContact, emptyAddress } from "./employeeFormData.js";
import { validateEmployeeDetails, validateAddressStep, validateDocuments, hasErrors } from "./employeeFormValidation.js";
import { saveEmployeeDraft, createEmployee } from "../../services/employeeService.js";
import { ROUTES } from "../../router/routePaths.js";
import "./EmployeeForm.css";

const STEPS = [
  { key: "details", label: "Employee Details" },
  { key: "address", label: "Address & Documents" },
  { key: "skills", label: "Skills & Emergency Contact" },
];

function buildInitialFormData(lockedCompanyId) {
  return {
    details: {
      profilePhoto: "",
      employeeCode: generateEmployeeCode(),
      companyId: lockedCompanyId ?? "",
      branchId: "",
      departmentId: "",
      designation: "",
      reportingManagerId: "",
      firstName: "",
      lastName: "",
      gender: "",
      dob: "",
      joiningDate: "",
      employmentType: "Permanent",
      email: "",
      mobile: "",
      username: "",
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

export default function EmployeeForm() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { roleName, user } = useAuth();

  // Three ways a Company can end up fixed for this employee: opened from a
  // specific Company's Employees page (router state), or the logged-in user
  // is a Company Admin (locked to their own company). Only a Super Admin
  // landing here directly gets to choose.
  const fromCompanyId = location.state?.companyId ?? null;
  const isSuperAdmin = roleName === "Super Admin";
  const showCompanyDropdown = isSuperAdmin && !fromCompanyId;
  const lockedCompanyId = fromCompanyId ?? (!isSuperAdmin ? user?.company?.id ?? null : null);

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(() => buildInitialFormData(lockedCompanyId));
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [maxReachedIndex, setMaxReachedIndex] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 550);
    return () => clearTimeout(timer);
  }, []);

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

  function removeDocumentRow(id) {
    setDirty(true);
    setFormData((prev) => ({ ...prev, documents: prev.documents.filter((row) => row.id !== id) }));
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

  async function handleSaveDraft() {
    setSaving(true);
    try {
      await saveEmployeeDraft(formData);
      setSaving(false);
      setDirty(false);
      setToast({ tone: "success", message: "Draft saved successfully." });
    } catch {
      setSaving(false);
      setToast({ tone: "error", message: "Could not save the draft. Please try again." });
    }
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

    setSaving(true);
    try {
      await createEmployee(formData);
      setSaving(false);
      setDirty(false);
      setToast({ tone: "success", message: "Employee created successfully." });
      setTimeout(() => navigate(ROUTES.EMPLOYEES), 850);
    } catch {
      setSaving(false);
      setToast({ tone: "error", message: "Something went wrong. Please try again." });
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
        user={{ name: "John Smith", role: roleName ?? "Sales Manager", initials: "JS" }}
      />

      <div className="cl-body wizard-page-body">
        <div className="wizard-sticky-header">
          <div className="wizard-header-text">
            <button type="button" className="cl-btn wizard-back-btn" onClick={handleCancel}>
              <Icon name="back" size={15} />
              Back to Employees
            </button>
            <h1>Add Employee</h1>
            <p className="cl-breadcrumb">
              <span>Dashboard</span>
              <Icon name="chevronRight" size={13} />
              <span>Employees</span>
              <Icon name="chevronRight" size={13} />
              <span className="is-current">Add Employee</span>
            </p>
          </div>
        </div>

        {loading ? (
          <EmployeeFormSkeleton />
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
                    />

                    <div className="form-section-divider">
                      <span className="form-section-title">Personal Information</span>
                    </div>
                    <PersonalInfoFields data={formData.details} errors={errors.details ?? {}} onChange={updateDetails} />

                    <div className="form-section-divider">
                      <span className="form-section-title">Contact Information</span>
                    </div>
                    <ContactInfoFields data={formData.details} errors={errors.details ?? {}} onChange={updateDetails} />
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
                    <button type="button" className="cl-btn" onClick={handleSaveDraft} disabled={saving}>
                      <Icon name="download" size={15} style={{ transform: "rotate(90deg)" }} />
                      Save Draft
                    </button>
                    {currentStep < STEPS.length - 1 ? (
                      <button type="button" className="dash-primary-btn" onClick={handleNext} disabled={saving}>
                        Next
                        <Icon name="arrow" size={15} />
                      </button>
                    ) : (
                      <button type="button" className="dash-primary-btn" onClick={handleSaveEmployee} disabled={saving}>
                        {saving ? <span className="fa-spinner light" /> : <Icon name="check" size={15} />}
                        Save Employee
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
