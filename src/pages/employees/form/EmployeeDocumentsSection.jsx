import Icon from "../../../components/Icon.jsx";
import DocumentUploader from "../../../components/DocumentUploader.jsx";
import { DOCUMENT_TYPES } from "../employeeFormData.js";
import { ACCEPTED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE_MB } from "../../../utils/fileUploadLimits.js";

export default function EmployeeDocumentsSection({ rows, errors, onAddRow, onRemoveRow, onChangeRow, onFileSelect, onFileRemove }) {
  return (
    <div className="form-fields-stack">
      <div className="form-doc-table-head">
        <p>
          Supported formats: {ACCEPTED_DOCUMENT_TYPES.join(", ").toUpperCase()} &middot; Maximum {MAX_DOCUMENT_SIZE_MB}MB per file
        </p>
        <button type="button" className="fa-outline-btn form-doc-add-btn" onClick={onAddRow}>
          <Icon name="plus" size={15} />
          Add Document
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="dtable-state form-doc-empty">
          <Icon name="file" size={22} />
          <p>No documents added yet. Click "Add Document" to attach one.</p>
        </div>
      ) : (
        <div className="dtable-wrap">
          <table className="dtable form-doc-table">
            <thead>
              <tr>
                <th>Document Type</th>
                <th>Document Number</th>
                <th>Expiry Date</th>
                <th>Verification Status</th>
                <th>Upload File</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const rowErrors = errors[row.id] ?? {};
                if (row.persisted) {
                  // Already uploaded and saved — there's no backend endpoint to edit an
                  // existing document's metadata, only to delete or re-verify it, so this
                  // row renders read-only instead of implying edits here would be saved.
                  return (
                    <tr key={row.id} className="form-doc-row-persisted">
                      <td>{row.type}</td>
                      <td>{row.number || "—"}</td>
                      <td>{row.expiryDate || "—"}</td>
                      <td>
                        <span className={`form-doc-badge form-verify-${row.verificationStatus.toLowerCase()}`}>{row.verificationStatus}</span>
                      </td>
                      <td>
                        <span className="duploader-chip">
                          <Icon name="file" size={14} />
                          <span title={row.fileName}>{row.fileName}</span>
                        </span>
                      </td>
                      <td>
                        <button type="button" className="dash-icon-btn" aria-label="Delete document" onClick={() => onRemoveRow(row.id)}>
                          <Icon name="trash" size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={row.id}>
                    <td>
                      <select value={row.type} onChange={(e) => onChangeRow(row.id, "type", e.target.value)} className="form-doc-select">
                        {DOCUMENT_TYPES.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        className={`form-doc-input${rowErrors.number ? " has-error" : ""}`}
                        value={row.number}
                        onChange={(e) => onChangeRow(row.id, "number", e.target.value)}
                        placeholder="e.g. Passport number"
                      />
                      {rowErrors.number && <span className="form-doc-error">{rowErrors.number}</span>}
                    </td>
                    <td>
                      <input
                        type="date"
                        className="form-doc-input"
                        value={row.expiryDate}
                        onChange={(e) => onChangeRow(row.id, "expiryDate", e.target.value)}
                      />
                    </td>
                    <td>
                      <span className="form-doc-badge form-verify-pending">Pending</span>
                    </td>
                    <td>
                      <DocumentUploader
                        fileName={row.fileName}
                        error={rowErrors.file}
                        onSelect={(file) => onFileSelect(row.id, file)}
                        onRemove={() => onFileRemove(row.id)}
                      />
                    </td>
                    <td>
                      <button type="button" className="dash-icon-btn" aria-label="Remove document" onClick={() => onRemoveRow(row.id)}>
                        <Icon name="trash" size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
