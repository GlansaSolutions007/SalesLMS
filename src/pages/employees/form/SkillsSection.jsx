import Icon from "../../../components/Icon.jsx";
import { SKILL_LEVELS } from "../employeeFormData.js";

export default function SkillsSection({ rows, onAddRow, onRemoveRow, onChangeRow }) {
  return (
    <div className="form-fields-stack">
      <div className="form-doc-table-head">
        <p>Add the skills relevant to this employee's role.</p>
        <button type="button" className="fa-outline-btn form-doc-add-btn" onClick={onAddRow}>
          <Icon name="plus" size={15} />
          Add Skill
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="dtable-state form-doc-empty">
          <Icon name="star" size={22} />
          <p>No skills added yet. Click "Add Skill" to add one.</p>
        </div>
      ) : (
        <div className="dtable-wrap">
          <table className="dtable form-doc-table">
            <thead>
              <tr>
                <th>Skill Name</th>
                <th>Skill Level</th>
                <th>Experience (Years)</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      type="text"
                      className="form-doc-input"
                      value={row.name}
                      onChange={(e) => onChangeRow(row.id, "name", e.target.value)}
                      placeholder="e.g. Negotiation"
                    />
                  </td>
                  <td>
                    <select value={row.level} onChange={(e) => onChangeRow(row.id, "level", e.target.value)} className="form-doc-select">
                      {SKILL_LEVELS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      className="form-doc-input"
                      value={row.experienceYears}
                      onChange={(e) => onChangeRow(row.id, "experienceYears", e.target.value)}
                    />
                  </td>
                  <td>
                    <button type="button" className="dash-icon-btn" aria-label="Remove skill" onClick={() => onRemoveRow(row.id)}>
                      <Icon name="trash" size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
