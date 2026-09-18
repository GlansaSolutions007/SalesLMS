import { useRef, useState } from "react";
import Modal from "../../../components/Modal.jsx";
import Icon from "../../../components/Icon.jsx";

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default function ImportLeadsModal({ onClose, onImported }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  function handleDownloadTemplate() {
    const header = "Customer Name,Company Name,Email,Mobile,Alternate Mobile,Address,City,State,Product / Service,Priority,Notes";
    downloadBlob(new Blob([header], { type: "text/csv;charset=utf-8;" }), "lead-import-template.csv");
  }

  function handleFileChange(e) {
    setFile(e.target.files?.[0] ?? null);
    setError("");
    setResult(null);
  }

  function handleImport() {
    if (!file) {
      setError("Choose an Excel (.xlsx) or CSV file first.");
      return;
    }
    setError("");
    // Design-only — no file is actually parsed/uploaded; see LeadPool.jsx's
    // note on this module's UI-only scope.
    setResult({ imported_count: 1, skipped_count: 0, error_count: 0, total_rows: 1, error_report: [] });
    onImported?.();
  }

  return (
    <Modal
      title="Import Leads"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="cl-btn" onClick={onClose}>
            {result ? "Close" : "Cancel"}
          </button>
          {!result && (
            <button type="button" className="dash-primary-btn" onClick={handleImport}>
              Import
            </button>
          )}
        </>
      }
    >
      {!result ? (
        <div className="form-fields-stack">
          <p>
            Upload an Excel (.xlsx) or CSV file with columns: Customer Name*, Company Name, Email, Mobile*, Alternate
            Mobile, Address, City, State, Product / Service, Priority, Notes. Imported leads land unassigned — use
            <strong> Assign Employee</strong> afterwards to assign them to employees, individually or in bulk. Rows with
            a missing required field or a duplicate mobile/email are skipped and listed below after import.
          </p>
          <button type="button" className="cl-btn" onClick={handleDownloadTemplate}>
            <Icon name="download" size={15} />
            Download Template
          </button>
          <button type="button" className="cl-btn" onClick={() => fileInputRef.current?.click()}>
            <Icon name="download" size={15} style={{ transform: "rotate(180deg)" }} />
            {file ? file.name : "Choose file"}
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.csv" hidden onChange={handleFileChange} />
          {error && <p className="form-field-error">{error}</p>}
        </div>
      ) : (
        <div className="form-fields-stack">
          <p>
            <strong>{result.imported_count}</strong> lead(s) imported, <strong>{result.skipped_count}</strong> skipped,{" "}
            <strong>{result.error_count}</strong> error(s) out of {result.total_rows} row(s).
          </p>
          {Array.isArray(result.error_report) && result.error_report.length > 0 && (
            <div className="dtable-wrap">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {result.error_report.map((row) => (
                    <tr key={row.row}>
                      <td>{row.row}</td>
                      <td>{Array.isArray(row.errors) ? row.errors.join(", ") : row.errors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
