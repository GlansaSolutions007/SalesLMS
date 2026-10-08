import { useRef, useState } from "react";
import Modal from "../../../components/Modal.jsx";
import Icon from "../../../components/Icon.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { createCompanyEmployee, ApiValidationError } from "../../../services/api/companyApi.js";
import {
  EMPLOYEE_IMPORT_COLUMNS,
  downloadEmployeeImportSample,
  parseEmployeeImportFile,
  validateImportRows,
  buildEmployeeImportFormData,
} from "./employeeBulkImport.js";

// Company Admin (own company) / Super Admin (whichever company's Employees
// page this was opened from — same `companyId` EmployeeList already
// resolves for the plain Add Employee button) -> Bulk Upload -> Download
// Sample -> choose file -> Preview (client-side validation, same rules as
// the single Add Employee form) -> Import.
//
// This reuses the existing single-employee create endpoint
// (createCompanyEmployee -> POST /companies/{company}/employees) once per
// valid row rather than a dedicated bulk-import backend endpoint — there
// isn't one for employees (unlike leads/questions/modules), and adding one
// is backend work outside this change's scope. Reusing the real endpoint
// means every existing security/validation rule (company_id taken from the
// URL + authorizeAccess() company match, per-company employee_code
// uniqueness, email uniqueness) already applies unchanged — nothing new to
// get wrong. The tradeoff: a database-level duplicate (e.g. an email that
// already exists for this company but wasn't caught by the in-file
// duplicate check in the Preview step) only surfaces once Import actually
// calls the API for that row, not earlier — reported the same way, with
// the row number, just one step later than a dedicated bulk-check endpoint
// could manage.
export default function BulkUploadEmployeesModal({ companyId, onClose, onImported }) {
  const { token } = useAuth();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState("choose"); // choose | preview | result
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [parseError, setParseError] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const hasErrors = rows.some((r) => r.errors.length > 0);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setParseError("");
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseEmployeeImportFile(String(reader.result ?? ""));
        if (parsed.length === 0) {
          setParseError("The file has no data rows. Download the sample template and try again.");
          return;
        }
        setRows(validateImportRows(parsed));
        setStep("preview");
      } catch (err) {
        setParseError(err.message ?? "Could not read this file. Make sure it's a CSV exported from Excel.");
      }
    };
    reader.onerror = () => setParseError("Could not read this file.");
    reader.readAsText(file);
  }

  async function handleImport() {
    if (hasErrors) return;
    setImporting(true);

    const outcomes = [];
    // Sequential, not Promise.all — employee_code auto-generation and the
    // per-company unique constraint are both DB-side; importing one at a
    // time avoids two rows in the same batch racing for the same
    // auto-generated code.
    for (const entry of rows) {
      try {
        await createCompanyEmployee(companyId, buildEmployeeImportFormData(entry.data), token);
        outcomes.push({ row: entry.row, status: "imported" });
      } catch (err) {
        const message =
          err instanceof ApiValidationError
            ? Object.values(err.errors ?? {}).flat()[0] ?? err.message
            : err.message ?? "Could not create this employee.";
        outcomes.push({ row: entry.row, status: "error", message });
      }
    }

    setImporting(false);
    setResult(outcomes);
    setStep("result");
    if (outcomes.some((o) => o.status === "imported")) onImported?.();
  }

  function handleClose() {
    onClose?.();
  }

  const importedCount = result?.filter((o) => o.status === "imported").length ?? 0;
  const errorRows = result?.filter((o) => o.status === "error") ?? [];

  return (
    <Modal
      title="Bulk Upload Employees"
      size="lg"
      onClose={handleClose}
      footer={
        step === "preview" ? (
          <>
            <button type="button" className="cl-btn" onClick={() => setStep("choose")} disabled={importing}>
              Back
            </button>
            <button type="button" className="dash-primary-btn" onClick={handleImport} disabled={importing || hasErrors || rows.length === 0}>
              {importing ? "Importing…" : `Import ${rows.length} Employee${rows.length === 1 ? "" : "s"}`}
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
            Upload a CSV file with columns: {EMPLOYEE_IMPORT_COLUMNS.map((c) => c.header).join(", ")}. Every employee is
            created under <strong>your company</strong> automatically — there is no Company column. A portal login is
            created for each row using the Email as username and the given Password.
          </p>
          <button type="button" className="cl-btn" onClick={downloadEmployeeImportSample}>
            <Icon name="download" size={15} />
            Download Sample Template
          </button>
          <button type="button" className="cl-btn" onClick={() => fileInputRef.current?.click()}>
            <Icon name="download" size={15} style={{ transform: "rotate(180deg)" }} />
            {fileName || "Choose CSV file"}
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" hidden onChange={handleFileChange} />
          {parseError && <p className="form-field-error">{parseError}</p>}
        </div>
      )}

      {step === "preview" && (
        <div className="form-fields-stack">
          <p>
            {rows.length} row(s) found.{" "}
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
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Issues</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((entry) => (
                  <tr key={entry.row} style={entry.errors.length ? { background: "rgba(220,38,38,0.06)" } : undefined}>
                    <td>{entry.row}</td>
                    <td>{entry.data.employee_code || "—"}</td>
                    <td>{entry.data.name || "—"}</td>
                    <td>{entry.data.email || "—"}</td>
                    <td>{entry.data.mobile || "—"}</td>
                    <td>
                      {entry.errors.length === 0 ? (
                        <span style={{ color: "var(--color-success, #16a34a)" }}>Valid</span>
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: 16 }}>
                          {entry.errors.map((e, i) => (
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
        </div>
      )}

      {step === "result" && (
        <div className="form-fields-stack">
          <p>
            <strong>{importedCount}</strong> employee(s) imported successfully, <strong>{errorRows.length}</strong>{" "}
            failed out of {result.length} row(s).
          </p>
          {errorRows.length > 0 && (
            <div className="dtable-wrap">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {errorRows.map((o) => (
                    <tr key={o.row}>
                      <td>{o.row}</td>
                      <td>{o.message}</td>
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
