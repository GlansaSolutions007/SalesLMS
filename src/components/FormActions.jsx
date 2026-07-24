import Icon from "./Icon.jsx";
import "./FormActions.css";

export default function FormActions({ onSave, onSaveNew, onReset, onCancel, saving = false }) {
  return (
    <div className="form-actions">
      <button type="button" className="cl-btn" onClick={onReset} disabled={saving}>
        <Icon name="refresh" size={15} />
        <span className="form-actions-label">Reset</span>
      </button>

      <button type="button" className="cl-btn" onClick={onCancel} disabled={saving}>
        <Icon name="close" size={15} />
        <span className="form-actions-label">Cancel</span>
      </button>

      <button type="button" className="fa-outline-btn" onClick={onSaveNew} disabled={saving}>
        {saving ? <span className="fa-spinner" /> : <Icon name="plus" size={15} />}
        <span className="form-actions-label">Save &amp; New</span>
      </button>

      <button type="button" className="dash-primary-btn fa-save-btn" onClick={onSave} disabled={saving}>
        {saving ? <span className="fa-spinner light" /> : <Icon name="check" size={15} />}
        Save
      </button>
    </div>
  );
}
