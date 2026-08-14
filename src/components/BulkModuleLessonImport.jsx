import { useRef, useState } from "react";
import Modal from "./Modal.jsx";
import Icon from "./Icon.jsx";
import { downloadModuleLessonTemplate, previewModuleLessonImport } from "../services/courseService.js";
import { modulesFromImportRows } from "../pages/courses/wizard/courseWizardData.js";
import "./BulkQuestionImport.css";

function plainPreview(text) {
  const s = String(text ?? "");
  return s.length > 90 ? `${s.slice(0, 90)}…` : s;
}

// "Bulk Import" trigger + modal for the Course Wizard's "Modules & Lessons"
// step, mirroring BulkQuestionImport.jsx's pattern exactly. Parsing,
// grouping (by Module Name) and validation happen server-side
// (ModuleLessonImportController::preview, Maatwebsite/PhpSpreadsheet) and
// nothing is persisted there — this only shows a preview of the parsed
// Modules/Lessons and, once confirmed, hands the caller plain module
// objects (each with its lessons) to merge into its local list, exactly
// like clicking "Add Module" + "Add Lesson" would.
export default function BulkModuleLessonImport({ moduleCount, onImport }) {
  const fileInputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  function closeModal() {
    setIsOpen(false);
    setResult(null);
    setError("");
    setLoading(false);
  }

  async function handleDownloadTemplate() {
    setDownloading(true);
    try {
      const blob = await downloadModuleLessonTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "module_lesson_bulk_upload_template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message ?? "Could not download the template.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const parsed = await previewModuleLessonImport(file);
      setResult(parsed);
    } catch (err) {
      setError(err.message ?? "Could not parse the uploaded file.");
    } finally {
      setLoading(false);
    }
  }

  const modules = result?.modules ?? [];
  const parsedErrors = result?.errors ?? [];
  const lessonCount = modules.reduce((sum, m) => sum + m.lessons.length, 0);

  function handleConfirmImport() {
    if (!modules.length) return;
    const newModules = modulesFromImportRows(modules, moduleCount);
    onImport(newModules);
    closeModal();
  }

  return (
    <>
      <button type="button" className="fa-outline-btn modules-add-btn" onClick={() => setIsOpen(true)}>
        <Icon name="upload" size={15} />
        Bulk Import
      </button>

      {isOpen && (
        <Modal
          title="Bulk Import Modules & Lessons"
          size="lg"
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="cl-btn" onClick={closeModal}>
                {result ? "Close" : "Cancel"}
              </button>
              {result && (
                <button type="button" className="dash-primary-btn" onClick={handleConfirmImport} disabled={!modules.length}>
                  Import {modules.length} Module{modules.length === 1 ? "" : "s"} / {lessonCount} Lesson{lessonCount === 1 ? "" : "s"}
                </button>
              )}
            </>
          }
        >
          <div className="form-fields-stack bulk-qn-import">
            {!result && (
              <>
                <p>
                  Download the sample Excel template, fill in your modules and lessons, then upload it here to preview and add them.
                  Rows with the same Module Name are grouped into one Module. Supported Lesson Types: Content, Video.
                </p>
                <div className="bulk-qn-import-actions">
                  <button type="button" className="cl-btn" onClick={handleDownloadTemplate} disabled={downloading}>
                    <Icon name="download" size={15} />
                    {downloading ? "Downloading…" : "Download Template"}
                  </button>
                  <button type="button" className="cl-btn" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                    <Icon name="upload" size={15} />
                    {loading ? "Parsing…" : "Choose Excel / CSV File"}
                  </button>
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={handleFileChange} />
                </div>
                {error && <p className="form-field-error">{error}</p>}
              </>
            )}

            {result && (
              <>
                <p>
                  <strong>{modules.length}</strong> module(s) / <strong>{lessonCount}</strong> lesson(s) ready to import,{" "}
                  <strong>{parsedErrors.length}</strong> row(s) with errors out of {result.total_rows} row(s).
                </p>

                {modules.length > 0 && (
                  <div className="dtable-wrap">
                    <table className="dtable">
                      <thead>
                        <tr>
                          <th>Module</th>
                          <th>Description</th>
                          <th>Lessons</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modules.map((m, i) => (
                          <tr key={i}>
                            <td>{m.module_name}</td>
                            <td>{plainPreview(m.module_description)}</td>
                            <td>{m.lessons.length}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {lessonCount > 0 && (
                  <div className="dtable-wrap">
                    <table className="dtable">
                      <thead>
                        <tr>
                          <th>Row</th>
                          <th>Module</th>
                          <th>Lesson</th>
                          <th>Type</th>
                          <th>Order</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modules.flatMap((m) =>
                          m.lessons.map((l) => (
                            <tr key={l.row}>
                              <td>{l.row}</td>
                              <td>{m.module_name}</td>
                              <td>{plainPreview(l.lesson_name)}</td>
                              <td>{l.lesson_type}</td>
                              <td>{l.lesson_order ?? "—"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {parsedErrors.length > 0 && (
                  <div className="dtable-wrap">
                    <table className="dtable">
                      <thead>
                        <tr>
                          <th>Row</th>
                          <th>Issue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedErrors.map((row) => (
                          <tr key={row.row}>
                            <td>{row.row}</td>
                            <td>{Array.isArray(row.errors) ? row.errors.join(", ") : row.errors}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
