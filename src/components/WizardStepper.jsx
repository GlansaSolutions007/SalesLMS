import Icon from "./Icon.jsx";
import "./WizardStepper.css";

export default function WizardStepper({ steps, currentIndex, maxReachedIndex, stepErrors, onStepClick }) {
  return (
    <div className="wizard-stepper" role="tablist" aria-label="Wizard steps">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        const isReachable = index <= maxReachedIndex;
        const hasError = stepErrors?.[index];

        return (
          <div className={`wizard-step${isActive ? " is-active" : ""}${isCompleted ? " is-completed" : ""}`} key={step.key}>
            <button
              type="button"
              className="wizard-step-node"
              disabled={!isReachable}
              onClick={() => onStepClick(index)}
              aria-current={isActive ? "step" : undefined}
            >
              <span className="wizard-step-circle">
                {isCompleted ? <Icon name="check" size={15} /> : index + 1}
                {hasError && <span className="wizard-step-dot" />}
              </span>
              <span className="wizard-step-label">{step.label}</span>
            </button>

            {index < steps.length - 1 && (
              <span className="wizard-step-line">
                <span className="wizard-step-line-fill" style={{ width: isCompleted ? "100%" : "0%" }} />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
