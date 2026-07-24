import Icon from "../../../components/Icon.jsx";

export default function CourseStepper({ steps, currentIndex, maxReachedIndex, stepErrors, onStepClick }) {
  return (
    <div className="cw-stepper" role="tablist" aria-label="Course creation steps">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        const isReachable = index <= maxReachedIndex;
        const hasError = stepErrors?.[index];

        return (
          <div className={`cw-step${isActive ? " is-active" : ""}${isCompleted ? " is-completed" : ""}`} key={step.key}>
            <button
              type="button"
              className="cw-step-node"
              disabled={!isReachable}
              onClick={() => onStepClick(index)}
              aria-current={isActive ? "step" : undefined}
            >
              <span className="cw-step-circle">
                {isCompleted ? <Icon name="check" size={15} /> : index + 1}
                {hasError && <span className="cw-step-dot" />}
              </span>
              <span className="cw-step-label">{step.label}</span>
            </button>

            {index < steps.length - 1 && (
              <span className="cw-step-line">
                <span className="cw-step-line-fill" style={{ width: isCompleted ? "100%" : "0%" }} />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
