import { useRef, useState } from "react";
import Modal from "./Modal.jsx";
import Icon from "./Icon.jsx";
import { downloadQuestionTemplate, previewQuestionImport } from "../services/courseService.js";
import { questionFromImportRow } from "../pages/courses/wizard/courseWizardData.js";
import "./BulkQuestionImport.css";

function plainPreview(text) {
  const s = String(text ?? "");
  return s.length > 90 ? `${s.slice(0, 90)}…` : s;
}

// "Bulk Upload" trigger + modal, shared by the Course Wizard's Final
// Assessment step and the standalone Assessment form. Parsing happens
// server-side (QuestionImportController::preview, Maatwebsite/PhpSpreadsheet)
// and nothing is persisted there — this only shows a preview of the parsed
// rows and, once confirmed, hands the caller plain question objects to merge
// into its local list, exactly like clicking "Add Question" would.
export default function BulkQuestionImport({ allowedTypes, questionCount, onImport }) {
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
      const blob = await downloadQuestionTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "question_bulk_upload_template.xlsx";
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
      const parsed = await previewQuestionImport(file);
      setResult(parsed);
    } catch (err) {
      setError(err.message ?? "Could not parse the uploaded file.");
    } finally {
      setLoading(false);
    }
  }

  const parsedQuestions = result?.questions ?? [];
  const parsedErrors = result?.errors ?? [];
  const supported = parsedQuestions.filter((q) => allowedTypes.includes(q.question_type));
  const unsupported = parsedQuestions.filter((q) => !allowedTypes.includes(q.question_type));

  function handleConfirmImport() {
    if (!supported.length) return;
    const newQuestions = supported.map((row, i) => questionFromImportRow(row, questionCount + i + 1));
    onImport(newQuestions);
    closeModal();
  }

  return (
    <>
      <button type="button" className="fa-outline-btn modules-add-btn" onClick={() => setIsOpen(true)}>
        <Icon name="upload" size={15} />
        Bulk Upload
      </button>

      {isOpen && (
        <Modal
          title="Bulk Upload Questions"
          size="lg"
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="cl-btn" onClick={closeModal}>
                {result ? "Close" : "Cancel"}
              </button>
              {result && (
                <button type="button" className="dash-primary-btn" onClick={handleConfirmImport} disabled={!supported.length}>
                  Import {supported.length} Question{supported.length === 1 ? "" : "s"}
                </button>
              )}
            </>
          }
        >
          <div className="form-fields-stack bulk-qn-import">
            {!result && (
              <>
                <p>
                  Download the sample Excel template, fill in your questions, then upload it here to preview and add them.
                  Supported types: {allowedTypes.join(", ")}.
                </p>
                <div className="bulk-qn-import-actions">
                  <button type="button" className="cl-btn" onClick={handleDownloadTemplate} disabled={downloading}>
                    <Icon name="download" size={15} />
                    {downloading ? "Downloading…" : "Download Sample Template"}
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
                  <strong>{supported.length}</strong> question(s) ready to import
                  {unsupported.length > 0 && (
                    <>
                      , <strong>{unsupported.length}</strong> skipped (unsupported type here)
                    </>
                  )}
                  , <strong>{parsedErrors.length}</strong> row(s) with errors out of {result.total_rows} row(s).
                </p>

                {supported.length > 0 && (
                  <div className="dtable-wrap">
                    <table className="dtable">
                      <thead>
                        <tr>
                          <th>Row</th>
                          <th>Type</th>
                          <th>Question</th>
                          <th>Marks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supported.map((q) => (
                          <tr key={q.row}>
                            <td>{q.row}</td>
                            <td>{q.question_type}</td>
                            <td>{plainPreview(q.question)}</td>
                            <td>{q.marks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {unsupported.length > 0 && (
                  <div className="dtable-wrap">
                    <table className="dtable">
                      <thead>
                        <tr>
                          <th>Row</th>
                          <th>Type</th>
                          <th>Question</th>
                          <th>Issue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unsupported.map((q) => (
                          <tr key={q.row}>
                            <td>{q.row}</td>
                            <td>{q.question_type}</td>
                            <td>{plainPreview(q.question)}</td>
                            <td>Not supported on this form ({allowedTypes.join(", ")} only)</td>
                          </tr>
                        ))}
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
