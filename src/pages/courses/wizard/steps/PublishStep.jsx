import FormField from "../../../../components/FormField.jsx";
import Icon from "../../../../components/Icon.jsx";
import PublishSummary from "../PublishSummary.jsx";
import { VISIBILITY_OPTIONS, COURSE_STATUSES, PUBLISH_DATE_MODES } from "../courseWizardData.js";

function YesNoToggle({ value, onChange }) {
  return (
    <div className="seg-group">
      <button type="button" className={`seg-chip${value === false ? " is-active" : ""}`} onClick={() => onChange(false)}>
        No
      </button>
      <button type="button" className={`seg-chip${value === true ? " is-active" : ""}`} onClick={() => onChange(true)}>
        Yes
      </button>
    </div>
  );
}

export default function PublishStep({ details, modules, assessment, publish, errors, onFieldChange, onPrevious, onSaveDraft, onPublish, saving }) {
  return (
    <div className="cw-step-body">
      <PublishSummary details={details} modules={modules} assessment={assessment} />

      <div className="publish-options">
        <h4>Publishing Options</h4>

        <div className="form-row">
          <FormField label="Visibility">
            <div className="seg-group">
              {VISIBILITY_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt}
                  className={`seg-chip${publish.visibility === opt ? " is-active" : ""}`}
                  onClick={() => onFieldChange("visibility", opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="Status">
            <div className="seg-group">
              {COURSE_STATUSES.map((opt) => (
                <button
                  type="button"
                  key={opt}
                  className={`seg-chip${publish.status === opt ? " is-active" : ""}`}
                  onClick={() => onFieldChange("status", opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </FormField>
        </div>

        <FormField label="Publish Date">
          <div className="seg-group">
            {PUBLISH_DATE_MODES.map((opt) => (
              <button
                type="button"
                key={opt}
                className={`seg-chip${publish.publishDateMode === opt ? " is-active" : ""}`}
                onClick={() => onFieldChange("publishDateMode", opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </FormField>

        {publish.publishDateMode === "Schedule" && (
          <FormField label="Scheduled Date">
            <input type="date" value={publish.scheduledDate} onChange={(e) => onFieldChange("scheduledDate", e.target.value)} />
          </FormField>
        )}

        <div className="form-row">
          <FormField label="Course Completion Certificate">
            <YesNoToggle value={publish.certificate} onChange={(v) => onFieldChange("certificate", v)} />
          </FormField>
          <FormField label="Allow Enrollment">
            <YesNoToggle value={publish.allowEnrollment} onChange={(v) => onFieldChange("allowEnrollment", v)} />
          </FormField>
        </div>

        <FormField label="Show in LMS">
          <YesNoToggle value={publish.showInLms} onChange={(v) => onFieldChange("showInLms", v)} />
        </FormField>
      </div>

      <label className={`publish-confirm${errors.confirmed ? " has-error" : ""}`}>
        <input type="checkbox" checked={publish.confirmed} onChange={(e) => onFieldChange("confirmed", e.target.checked)} />
        <span>I confirm all course details are correct.</span>
      </label>
      {errors.confirmed && <span className="publish-confirm-error">{errors.confirmed}</span>}

      <div className="cw-step-footer">
        <button type="button" className="cl-btn" onClick={onPrevious} disabled={saving}>
          <Icon name="back" size={15} />
          Previous
        </button>
        <div className="cw-step-footer-right">
          <button type="button" className="cl-btn" onClick={onSaveDraft} disabled={saving}>
            <Icon name="download" size={15} style={{ transform: "rotate(90deg)" }} />
            Save Draft
          </button>
          <button type="button" className="dash-primary-btn" onClick={onPublish} disabled={saving}>
            {saving ? <span className="fa-spinner light" /> : <Icon name="rocket" size={15} />}
            Publish Course
          </button>
        </div>
      </div>
    </div>
  );
}
