import { useRef, useState } from "react";
import Modal from "../../components/Modal.jsx";
import Icon from "../../components/Icon.jsx";
import {
  downloadHistoricalAchievementTemplate,
  previewHistoricalAchievementImport,
  importHistoricalAchievement,
} from "../../services/api/targetsApi.js";

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

function formatPeriod(row) {
  if (!row.start_date || !row.end_date) return "—";
  return `${row.start_date} – ${row.end_date}`;
}

// Admin-only (opened from TargetList.jsx, which is already gated to
// Super Admin / Company Admin by TargetsPage.jsx). File parsing and every
// validation rule (employee exists in this company, valid/non-overlapping
// period, numeric non-negative achievement values, no duplicate historical
// record) happen server-side in HistoricalAchievementImportService, shared
// by both the preview and import calls below so they can never disagree —
// see /companies/{company}/historical-achievements/{preview,import}.
export default function ImportPreviousAchievementModal({ companyId, onClose, onImported }) {
  const fileInputRef = useRef(null);

  const [step, setStep] = useState("choose"); // choose | preview | result
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function handleDownloadTemplate() {
    try {
      const blob = await downloadHistoricalAchievementTemplate(companyId);
      downloadBlob(blob, "previous-achievement-import-template.xlsx");
    } catch (err) {
      setError(err.message ?? "Could not download the template.");
    }
  }

  function handleFileChange(e) {
    setFile(e.target.files?.[0] ?? null);
    setError("");
  }

  async function handlePreview() {
    if (!file) {
      setError("Choose an Excel (.xlsx) or CSV file first.");
      return;
    }
    setIsPreviewing(true);
    setError("");
    try {
      const data = await previewHistoricalAchievementImport(companyId, file);
      setPreview(data);
      setStep("preview");
    } catch (err) {
      setError(err.message ?? "Could not validate this file.");
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleConfirmImport() {
    if (!file || (preview?.error_count ?? 0) > 0) return;
    setIsImporting(true);
    setError("");
    try {
      const importRecord = await importHistoricalAchievement(companyId, file);
      setResult(importRecord);
      setStep("result");
      onImported?.();
    } catch (err) {
      setError(err.message ?? "Could not import previous achievement.");
    } finally {
      setIsImporting(false);
    }
  }

  function handleBack() {
    setStep("choose");
    setPreview(null);
    setError("");
  }

  function handleClose() {
    onClose?.();
  }

  const rows = preview?.rows ?? [];
  const hasErrors = (preview?.error_count ?? 0) > 0;

  return (
    <Modal
      title="Import Previous Achievement"
      size="lg"
      onClose={handleClose}
      footer={
        step === "choose" ? (
          <>
            <button type="button" className="cl-btn" onClick={handleClose}>
              Cancel
            </button>
            <button type="button" className="dash-primary-btn" onClick={handlePreview} disabled={isPreviewing}>
              {isPreviewing ? "Validating…" : "Preview"}
            </button>
          </>
        ) : step === "preview" ? (
          <>
            <button type="button" className="cl-btn" onClick={handleBack} disabled={isImporting}>
              Back
            </button>
            <button type="button" className="dash-primary-btn" onClick={handleConfirmImport} disabled={isImporting || hasErrors || rows.length === 0}>
              {isImporting ? "Importing…" : `Confirm Import (${rows.length} row${rows.length === 1 ? "" : "s"})`}
            </button>
          </>
        ) : (
          <button type="button" className="cl-btn" onClick={handleClose}>
            Close
          </button>
        )
      }
    >
      {step === "choose" && (
        <div className="form-fields-stack">
          <p>
            Upload an Excel (.xlsx) or CSV file with columns: Employee Code*, Employee Name, Target Start Date*, Target
            End Date*, Lead Target*, Previous Lead Achievement, Sales Target*, Previous Sales Achievement, Revenue
            Target*, Previous Revenue Achievement. This imports achievement the employee earned{" "}
            <strong>before</strong> using Sales LMS as a baseline — it is added to (never replaces) achievement
            calculated from live platform activity for the same target period.
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
      )}

      {step === "preview" && (
        <div className="form-fields-stack">
          <p>
            {preview.total_rows} row(s) found, <strong>{preview.valid_count}</strong> valid,{" "}
            <strong>{preview.error_count}</strong> with errors.{" "}
            {hasErrors ? (
              <strong style={{ color: "var(--color-danger, #dc2626)" }}>
                Fix the errors below before importing — no rows will be imported until every row is valid.
              </strong>
            ) : (
              "All rows look valid."
            )}
          </p>
          <div className="dtable-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Employee Code</th>
                  <th>Employee Name</th>
                  <th>Period</th>
                  <th>Lead Target</th>
                  <th>Previous Lead</th>
                  <th>Sales Target</th>
                  <th>Previous Sales</th>
                  <th>Revenue Target</th>
                  <th>Previous Revenue</th>
                  <th>Issues</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.row} style={row.errors.length ? { background: "rgba(220,38,38,0.06)" } : undefined}>
                    <td>{row.row}</td>
                    <td>{row.employee_code || "—"}</td>
                    <td>{row.employee_name || "—"}</td>
                    <td>{formatPeriod(row)}</td>
                    <td>{row.lead_target}</td>
                    <td>{row.previous_lead_achievement}</td>
                    <td>{row.sales_target}</td>
                    <td>{row.previous_sales_achievement}</td>
                    <td>{Number(row.revenue_target).toLocaleString()}</td>
                    <td>{Number(row.previous_revenue_achievement).toLocaleString()}</td>
                    <td>
                      {row.errors.length === 0 ? (
                        <span style={{ color: "var(--color-success, #16a34a)" }}>Valid</span>
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: 16 }}>
                          {row.errors.map((e, i) => (
                            <li key={i}>{e}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {error && <p className="form-field-error">{error}</p>}
        </div>
      )}

      {step === "result" && (
        <div className="form-fields-stack">
          <p>
            <strong>{result.imported_count}</strong> record(s) imported, <strong>{result.skipped_count}</strong>{" "}
            skipped, <strong>{result.error_count}</strong> error(s) out of {result.total_rows} row(s).
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
