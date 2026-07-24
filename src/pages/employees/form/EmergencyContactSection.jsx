import FormField from "../../../components/FormField.jsx";
import Icon from "../../../components/Icon.jsx";
import { RELATIONSHIPS } from "../employeeFormData.js";

export default function EmergencyContactSection({ rows, onAddRow, onRemoveRow, onChangeRow }) {
  return (
    <div className="form-fields-stack">
      <div className="form-doc-table-head">
        <p>Add one or more people to contact in case of an emergency.</p>
        <button type="button" className="fa-outline-btn form-doc-add-btn" onClick={onAddRow}>
          <Icon name="plus" size={15} />
          Add Emergency Contact
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="dtable-state form-doc-empty">
          <Icon name="users" size={22} />
          <p>No emergency contacts added yet. Click "Add Emergency Contact" to add one.</p>
        </div>
      ) : (
        <div className="form-card-list">
          {rows.map((row, index) => (
            <div className="form-card" key={row.id}>
              <div className="form-card-head">
                <span className="form-card-index">
                  <Icon name="users" size={13} />
                  Contact {index + 1}
                </span>
                <button type="button" className="cl-btn form-card-delete-btn" onClick={() => onRemoveRow(row.id)}>
                  <Icon name="trash" size={14} />
                  Remove
                </button>
              </div>

              <div className="form-row">
                <FormField label="Contact Name">
                  <input type="text" value={row.name} onChange={(e) => onChangeRow(row.id, "name", e.target.value)} />
                </FormField>
                <FormField label="Relationship">
                  <select value={row.relationship} onChange={(e) => onChangeRow(row.id, "relationship", e.target.value)}>
                    {RELATIONSHIPS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div className="form-row">
                <FormField label="Mobile">
                  <input type="text" value={row.mobile} onChange={(e) => onChangeRow(row.id, "mobile", e.target.value)} placeholder="+1 415 555 0100" />
                </FormField>
                <FormField label="Email">
                  <input type="email" value={row.email} onChange={(e) => onChangeRow(row.id, "email", e.target.value)} />
                </FormField>
              </div>

              <FormField label="Address">
                <textarea rows={2} value={row.address} onChange={(e) => onChangeRow(row.id, "address", e.target.value)} />
              </FormField>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
