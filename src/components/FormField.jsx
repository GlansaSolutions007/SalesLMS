import "./FormField.css";

// Deliberately a <div>, not a <label>: a native <label> forwards clicks on
// any non-labelable descendant (e.g. a contentEditable div, like
// RichTextEditor's editing surface) to the first labelable control inside
// it — here, the toolbar's first button. Clicking into the rich text editor
// to place the cursor fired a synthetic click on that button (Undo) instead
// of focusing the editor, running execCommand("undo") on an editor with no
// local history yet, which fell through to the browser's page-wide editing
// undo stack and reverted whatever the user had just typed elsewhere (e.g.
// the Course Name field). CSS below only targets class names, so this is a
// pure semantics change with no visual/layout effect.
export default function FormField({ label, error, children }) {
  return (
    <div className={`form-field${error ? " has-error" : ""}`}>
      <span className="form-field-label">{label}</span>
      {children}
      {error && <span className="form-field-error">{error}</span>}
    </div>
  );
}
