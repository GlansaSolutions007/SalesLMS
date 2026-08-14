import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Icon from "../../components/Icon.jsx";
import DataTable from "../../components/DataTable.jsx";
import Modal from "../../components/Modal.jsx";
import FormField from "../../components/FormField.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import Toast from "../../components/Toast.jsx";
import TrainingSectionTabs from "./TrainingSectionTabs.jsx";
import useCompanyOptions from "../company/useCompanyOptions.js";
import useCompanyBatches from "../masters/useCompanyBatches.js";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getBatchTrainingSessions,
  createBatchTrainingSession,
  updateBatchTrainingSession,
  updateBatchTrainingSessionStatus,
  deleteBatchTrainingSession,
} from "../../services/api/companyApi.js";
import "../company/CompanyList.css";
import "./training.css";

const SESSION_TYPES = ["Online", "Offline", "Hybrid"];
const STATUS_OPTIONS = ["Scheduled", "Completed", "Cancelled"];

function emptyForm() {
  return { session_title: "", session_type: "Online", session_date: "", start_time: "", end_time: "", meeting_link: "", venue: "" };
}

export default function TrainingSessions() {
  const { toggleCollapsed } = useOutletContext();
  const { token, roleName, user } = useAuth();
  const isSuperAdmin = roleName === "Super Admin";

  const { options: companies, isLoading: companiesLoading, error: companiesError } = useCompanyOptions(isSuperAdmin);
  const [companyId, setCompanyId] = useState(() => (isSuperAdmin ? "" : String(user?.company?.id ?? "")));

  useEffect(() => {
    if (isSuperAdmin && !companyId && companies.length > 0) setCompanyId(String(companies[0].id));
  }, [isSuperAdmin, companies, companyId]);

  const { batches, isLoading: batchesLoading } = useCompanyBatches(companyId, { per_page: 100 });
  const [batchId, setBatchId] = useState("");

  useEffect(() => {
    if (batches.length > 0 && !batches.some((b) => String(b.id) === batchId)) {
      setBatchId(String(batches[0].id));
    } else if (batches.length === 0) {
      setBatchId("");
    }
  }, [batches, batchId]);

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (!companyId || !batchId) { setSessions([]); return; }
    setLoading(true);
    setError("");
    getBatchTrainingSessions(companyId, batchId, token)
      .then(setSessions)
      .catch((err) => setError(err.message ?? "Could not load training sessions."))
      .finally(() => setLoading(false));
  }, [companyId, batchId, token]);

  useEffect(() => { load(); }, [load]);

  const [modalMode, setModalMode] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [deletingRow, setDeletingRow] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  function openAdd() {
    setForm(emptyForm());
    setFormErrors({});
    setModalMode("add");
  }

  function openEdit(row) {
    setEditingRow(row);
    setForm({
      session_title: row.session_title ?? "",
      session_type: row.session_type ?? "Online",
      session_date: row.session_date ? String(row.session_date).slice(0, 10) : "",
      start_time: row.start_time ? String(row.start_time).slice(0, 5) : "",
      end_time: row.end_time ? String(row.end_time).slice(0, 5) : "",
      meeting_link: row.meeting_link ?? "",
      venue: row.venue ?? "",
    });
    setFormErrors({});
    setModalMode("edit");
  }

  function closeModal() { setModalMode(null); setEditingRow(null); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.session_title.trim()) {
      setFormErrors({ session_title: "Session title is required." });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        session_title: form.session_title.trim(),
        session_type: form.session_type || null,
        session_date: form.session_date || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        meeting_link: form.meeting_link.trim() || null,
        venue: form.venue.trim() || null,
      };
      if (modalMode === "add") {
        await createBatchTrainingSession(companyId, batchId, payload, token);
        setToast({ tone: "success", message: "Training session created." });
      } else {
        await updateBatchTrainingSession(companyId, batchId, editingRow.id, payload, token);
        setToast({ tone: "success", message: "Training session updated." });
      }
      closeModal();
      load();
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(row, session_status) {
    setActionLoading(true);
    try {
      await updateBatchTrainingSessionStatus(companyId, batchId, row.id, session_status, token);
      setToast({ tone: "success", message: `Session marked as ${session_status}.` });
      load();
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not update status." });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingRow) return;
    setActionLoading(true);
    try {
      await deleteBatchTrainingSession(companyId, batchId, deletingRow.id, token);
      setToast({ tone: "success", message: "Training session deleted." });
      setDeletingRow(null);
      load();
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not delete session." });
      setDeletingRow(null);
    } finally {
      setActionLoading(false);
    }
  }

  const columns = [
    { key: "session_title", header: "Session", render: (r) => <strong>{r.session_title}</strong> },
    { key: "session_type", header: "Type", render: (r) => r.session_type || "—" },
    { key: "session_date", header: "Date", render: (r) => (r.session_date ? String(r.session_date).slice(0, 10) : "—") },
    { key: "time", header: "Time", render: (r) => (r.start_time && r.end_time ? `${String(r.start_time).slice(0, 5)} – ${String(r.end_time).slice(0, 5)}` : "—") },
    { key: "trainer", header: "Trainer", render: (r) => r.trainer?.full_name || "Unassigned" },
    {
      key: "session_status",
      header: "Status",
      render: (r) => (
        <select
          className="form-doc-select"
          value={r.session_status}
          disabled={actionLoading}
          onChange={(e) => handleStatusChange(r, e.target.value)}
        >
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="cl-row-actions">
          <button type="button" className="dash-icon-btn" title="Edit" onClick={() => openEdit(r)}>
            <Icon name="edit" size={15} />
          </button>
          <button type="button" className="dash-icon-btn" title="Delete" disabled={actionLoading} onClick={() => setDeletingRow(r)}>
            <Icon name="trash" size={15} />
          </button>
        </div>
      ),
    },
  ];

  const ready = companyId && batchId;

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Training Sessions</h1>
            <Breadcrumb current="Training Sessions" />
          </div>
        </div>

        <TrainingSectionTabs />

        <div className="panel cl-panel">
          <div className="tc-course-bar">
            <div className="tc-context-selects">
              {isSuperAdmin && (
                <div className="tc-course-select-wrap">
                  <Icon name="building" size={15} />
                  <select className="tc-course-select" value={companyId} disabled={companiesLoading} onChange={(e) => setCompanyId(e.target.value)}>
                    {companies.length === 0 && <option value="">No companies found</option>}
                    {companies.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                  </select>
                </div>
              )}

              <Icon name="chevronRight" size={14} className="tc-muted" />

              <div className="tc-course-select-wrap">
                <Icon name="cap" size={15} />
                <select className="tc-course-select" value={batchId} disabled={batchesLoading || !companyId} onChange={(e) => setBatchId(e.target.value)}>
                  {batchesLoading && <option>Loading…</option>}
                  {!batchesLoading && batches.length === 0 && <option value="">No batches found</option>}
                  {batches.map((b) => <option key={b.id} value={b.id}>{b.batch_name}</option>)}
                </select>
              </div>
            </div>

            <div className="tc-toolbar-right">
              <button type="button" className="dash-primary-btn cl-add-btn" disabled={!ready} onClick={openAdd}>
                <Icon name="plus" size={15} />
                Add Session
              </button>
            </div>
          </div>

          {(error || companiesError) && <p className="cl-error">{error || companiesError}</p>}

          <DataTable
            columns={columns}
            rows={sessions}
            isLoading={loading || companiesLoading || batchesLoading}
            emptyMessage={ready ? "No training sessions scheduled for this batch yet." : "Select a company and batch to view its sessions."}
          />

          {!loading && sessions.length > 0 && (
            <div className="cl-footer">
              <p>Showing {sessions.length} session{sessions.length === 1 ? "" : "s"}</p>
            </div>
          )}
        </div>
      </div>

      {modalMode && (
        <Modal
          title={modalMode === "add" ? "Add Training Session" : "Edit Training Session"}
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="cl-btn" onClick={closeModal} disabled={submitting}>Cancel</button>
              <button type="submit" form="session-form" className="dash-primary-btn cl-add-btn" disabled={submitting}>
                {submitting ? "Saving…" : modalMode === "add" ? "Add Session" : "Save Changes"}
              </button>
            </>
          }
        >
          <form id="session-form" onSubmit={handleSubmit}>
            <FormField label="Session Title *" error={formErrors.session_title}>
              <input type="text" value={form.session_title} onChange={(e) => setForm((f) => ({ ...f, session_title: e.target.value }))} placeholder="e.g. Module 1 Kickoff" />
            </FormField>

            <div className="form-row">
              <FormField label="Session Type">
                <select value={form.session_type} onChange={(e) => setForm((f) => ({ ...f, session_type: e.target.value }))}>
                  {SESSION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>
              <FormField label="Date">
                <input type="date" value={form.session_date} onChange={(e) => setForm((f) => ({ ...f, session_date: e.target.value }))} />
              </FormField>
            </div>

            <div className="form-row">
              <FormField label="Start Time">
                <input type="time" value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} />
              </FormField>
              <FormField label="End Time">
                <input type="time" value={form.end_time} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} />
              </FormField>
            </div>

            {form.session_type !== "Offline" && (
              <FormField label="Meeting Link">
                <input type="url" value={form.meeting_link} onChange={(e) => setForm((f) => ({ ...f, meeting_link: e.target.value }))} placeholder="https://..." />
              </FormField>
            )}
            {form.session_type !== "Online" && (
              <FormField label="Venue">
                <input type="text" value={form.venue} onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))} placeholder="e.g. Training Hall 2" />
              </FormField>
            )}
          </form>
        </Modal>
      )}

      {deletingRow && (
        <ConfirmDialog
          title="Delete Training Session"
          message={`"${deletingRow.session_title}" will be permanently deleted.`}
          confirmLabel="Delete"
          onCancel={() => setDeletingRow(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />
    </>
  );
}
