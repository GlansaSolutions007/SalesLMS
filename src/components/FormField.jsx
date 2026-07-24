import "./FormField.css";

export default function FormField({ label, error, children }) {
  return (
    <label className={`form-field${error ? " has-error" : ""}`}>
      <span className="form-field-label">{label}</span>
      {children}
      {error && <span className="form-field-error">{error}</span>}
    </label>
  );
}
