import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Topbar from "../../../components/Topbar.jsx";
import Icon from "../../../components/Icon.jsx";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";
import Toast from "../../../components/Toast.jsx";
import WizardStepper from "../../../components/WizardStepper.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { companySchema, defaultCompanyFormValues, WIZARD_STEPS } from "./schema.js";
import CompanyDetailsStep from "./steps/CompanyDetailsStep.jsx";
import SubscriptionDetailsStep from "./steps/SubscriptionDetailsStep.jsx";
import AdminDetailsStep from "./steps/AdminDetailsStep.jsx";
import { getSubscriptionPlans, createCompany, ApiValidationError, ApiError } from "../../../services/api/companyApi.js";
import { ROUTES } from "../../../router/routePaths.js";
import "./AddCompanyPage.css";

const STEPS = WIZARD_STEPS.map(({ key, label }) => ({ key, label }));

function buildFormData(values) {
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (key === "logo") {
      if (value instanceof File) formData.append("logo", value);
      return;
    }
    if (value === null || value === undefined || value === "") return;
    formData.append(key, value);
  });
  return formData;
}

export default function AddCompanyPage() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [maxReachedIndex, setMaxReachedIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState("");

  const {
    control,
    watch,
    setValue,
    setError,
    trigger,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: yupResolver(companySchema),
    defaultValues: defaultCompanyFormValues,
    mode: "onTouched",
  });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 550);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPlansLoading(true);
    getSubscriptionPlans(token)
      .then((data) => {
        if (!cancelled) setPlans(data);
      })
      .catch((error) => {
        if (!cancelled) setPlansError(error.message ?? "Could not load subscription plans.");
      })
      .finally(() => {
        if (!cancelled) setPlansLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  function stepHasError(index) {
    return WIZARD_STEPS[index].fields.some((field) => Boolean(errors[field]));
  }

  async function handleNext() {
    const valid = await trigger(WIZARD_STEPS[currentStep].fields);
    if (!valid) {
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

  function handleCancel() {
    if (isDirty) {
      setConfirmCancel(true);
    } else {
      navigate(ROUTES.COMPANY_COMPANIES);
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setSaving(true);
    try {
      await createCompany(buildFormData(values), token);
      setToast({ tone: "success", message: "Company created successfully." });
      setTimeout(() => navigate(ROUTES.COMPANY_COMPANIES), 850);
    } catch (error) {
      if (error instanceof ApiValidationError) {
        let firstBadStep = null;
        Object.entries(error.errors).forEach(([field, messages]) => {
          setError(field, { type: "server", message: messages[0] });
          if (firstBadStep === null) {
            const stepIndex = WIZARD_STEPS.findIndex((step) => step.fields.includes(field));
            if (stepIndex !== -1) firstBadStep = stepIndex;
          }
        });
        if (firstBadStep !== null) {
          setCurrentStep(firstBadStep);
          setMaxReachedIndex((m) => Math.max(m, firstBadStep));
        }
        setToast({ tone: "error", message: error.message || "Please fix the highlighted fields below." });
      } else {
        const message = error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
        setToast({ tone: "error", message });
      }
    } finally {
      setSaving(false);
    }
  });

  const stepErrorFlags = STEPS.map((_, index) => stepHasError(index));
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <>
      <Topbar
        onMenuClick={toggleCollapsed}
        searchPlaceholder="Search..."
        notifications={3}
        messages={5}
        user={{ name: "John Smith", role: "Super Admin", initials: "SA" }}
      />

      <div className="cl-body wizard-page-body">
        <div className="wizard-sticky-header">
          <div className="wizard-header-text">
            <button type="button" className="cl-btn wizard-back-btn" onClick={handleCancel}>
              <Icon name="back" size={15} />
              Back to Companies
            </button>
            <h1>Add Company</h1>
            <p className="cl-breadcrumb">
              <span>Dashboard</span>
              <Icon name="chevronRight" size={13} />
              <span>Company Management</span>
              <Icon name="chevronRight" size={13} />
              <span className="is-current">Add Company</span>
            </p>
          </div>
        </div>

        {loading ? (
          <AddCompanySkeleton />
        ) : (
          <form onSubmit={(e) => e.preventDefault()}>
            <WizardStepper steps={STEPS} currentIndex={currentStep} maxReachedIndex={maxReachedIndex} stepErrors={stepErrorFlags} onStepClick={goToStep} />

            <div className="panel wizard-panel">
              <div key={currentStep} className="wizard-panel-inner">
                {currentStep === 0 && <CompanyDetailsStep control={control} errors={errors} watch={watch} setValue={setValue} />}
                {currentStep === 1 && (
                  <SubscriptionDetailsStep
                    control={control}
                    errors={errors}
                    setValue={setValue}
                    plans={plans}
                    plansLoading={plansLoading}
                    plansError={plansError}
                  />
                )}
                {currentStep === 2 && <AdminDetailsStep control={control} errors={errors} watch={watch} />}

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

                  {isLastStep ? (
                    <button type="button" className="dash-primary-btn" onClick={onSubmit} disabled={saving}>
                      {saving ? <span className="fa-spinner light" /> : <Icon name="check" size={15} />}
                      Save Company
                    </button>
                  ) : (
                    <button type="button" className="dash-primary-btn" onClick={handleNext} disabled={saving}>
                      Next
                      <Icon name="arrow" size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
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
            navigate(ROUTES.COMPANY_COMPANIES);
          }}
        />
      )}
    </>
  );
}

function AddCompanySkeleton() {
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
