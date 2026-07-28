import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Icon from "../../components/Icon.jsx";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Badge from "../../components/Badge.jsx";
import DataTable from "../../components/DataTable.jsx";
import Modal from "../../components/Modal.jsx";
import FormField from "../../components/FormField.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import Toast from "../../components/Toast.jsx";
import TrainingTabs from "../../components/TrainingTabs.jsx";
import "./training.css";
import {
  listAllCourses,
  listModules,
  createModule,
  updateModule,
  deleteModule,
  toggleModuleStatus,
} from "../../services/courseService.js";

const STATUS_TONE = { Active: "green", Inactive: "gray" };

const EMPTY_FORM = { module_name: "", description: "", estimated_duration: "", sequence_no: "", status: "Active" };

function durationLabel(minutes) {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m > 0 ? m + "m" : ""}`.trim() : `${m}m`;
}

export default function CourseModules() {
  const { toggleCollapsed } = useOutletContext();

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [coursesLoading, setCoursesLoading] = useState(true);

  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [modulesError, setModulesError] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [modalMode, setModalMode] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [deletingRow, setDeletingRow] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    listAllCourses()
      .then((list) => { setCourses(list); if (list.length) setSelectedCourseId(String(list[0].id)); })
      .catch(() => {})
      .finally(() => setCoursesLoading(false));
  }, []);

  const loadModules = useCallback(async () => {
    if (!selectedCourseId) return;
    setModulesLoading(true);
    setModulesError(null);
    try {
      const data = await listModules(selectedCourseId);
      setModules(data);
    } catch (err) {
      setModulesError(err.message ?? "Failed to load modules.");
    } finally {
      setModulesLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => { loadModules(); }, [loadModules]);

  const filteredModules = modules.filter((m) => {
    const matchSearch = !search || m.module_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function openAdd() {
    setForm({ ...EMPTY_FORM, sequence_no: String(modules.length + 1) });
    setFormErrors({});
    setModalMode("add");
  }

  function openEdit(row) {
    setEditingRow(row);
    setForm({
      module_name: row.module_name,
      description: row.description ?? "",
      estimated_duration: row.estimated_duration != null ? String(row.estimated_duration) : "",
      sequence_no: String(row.sequence_no ?? ""),
      status: row.status,
    });
    setFormErrors({});
    setModalMode("edit");
  }

  function closeModal() { setModalMode(null); setEditingRow(null); }

  function validate() {
    const errors = {};
    if (!form.module_name.trim()) errors.module_name = "Module name is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        module_name: form.module_name.trim(),
        description: form.description.trim() || null,
        estimated_duration: form.estimated_duration ? Number(form.estimated_duration) : null,
        sequence_no: form.sequence_no ? Number(form.sequence_no) : null,
        status: form.status,
      };
      if (modalMode === "add") {
        await createModule(selectedCourseId, payload);
        setToast({ tone: "success", message: "Module created." });
      } else {
        await updateModule(selectedCourseId, editingRow.id, payload);
        setToast({ tone: "success", message: "Module updated." });
      }
      closeModal();
      loadModules();
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(row) {
    const next = row.status === "Active" ? "Inactive" : "Active";
    setActionLoading(true);
    try {
      await toggleModuleStatus(selectedCourseId, row.id, next);
      setToast({ tone: "success", message: `Module set to ${next}.` });
      loadModules();
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
      await deleteModule(selectedCourseId, deletingRow.id);
      setToast({ tone: "success", message: "Module deleted." });
      setDeletingRow(null);
      loadModules();
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not delete module." });
      setDeletingRow(null);
    } finally {
      setActionLoading(false);
    }
  }

  const columns = [
    { key: "sequence_no", header: "#", render: (r) => <span className="tc-muted">{r.sequence_no}</span> },
    { key: "module_name", header: "Module Name", render: (r) => <strong>{r.module_name}</strong> },
    { key: "description", header: "Description", render: (r) => <span className="tc-muted">{r.description || "—"}</span> },
    { key: "estimated_duration", header: "Duration", render: (r) => durationLabel(r.estimated_duration) },
    { key: "lessons_count", header: "Lessons", render: (r) => r.lessons_count ?? 0 },
    {
      key: "status", header: "Status",
      render: (r) => (
        <button type="button" className="tc-status-btn" disabled={actionLoading} onClick={() => handleToggleStatus(r)}>
          <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
        </button>
      ),
    },
    {
      key: "actions", header: "",
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

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Course Modules</h1>
            <Breadcrumb current="Modules" />
          </div>
        </div>

        <TrainingTabs />

        <div className="panel cl-panel">
          {/* Course selector + toolbar */}
          <div className="tc-course-bar">
            <div className="tc-course-select-wrap">
              <Icon name="book" size={15} />
              <select
                className="tc-course-select"
                value={selectedCourseId}
                disabled={coursesLoading}
                onChange={(e) => { setSelectedCourseId(e.target.value); setSearch(""); setStatusFilter("All"); }}
              >
                {coursesLoading && <option>Loading courses…</option>}
                {!coursesLoading && courses.length === 0 && <option value="">No courses found</option>}
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.course_name}</option>
                ))}
              </select>
            </div>

            <div className="tc-toolbar-right">
              <div className="cl-search tc-search">
                <Icon name="search" size={15} />
                <input type="text" placeholder="Search modules..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <select className="dt-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {["All", "Active", "Inactive"].map((o) => <option key={o} value={o}>{o === "All" ? "All Status" : o}</option>)}
              </select>
              <button type="button" className="dash-primary-btn cl-add-btn" disabled={!selectedCourseId} onClick={openAdd}>
                <Icon name="plus" size={15} />
                Add Module
              </button>
            </div>
          </div>

          {modulesError ? (
            <div className="cl-error">
              <Icon name="warning" size={18} /><span>{modulesError}</span>
              <button type="button" className="cl-btn" onClick={loadModules}>Retry</button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={filteredModules}
              isLoading={modulesLoading || coursesLoading}
              emptyMessage={selectedCourseId ? "No modules found for this course." : "Select a course to view its modules."}
            />
          )}

          {!modulesLoading && !modulesError && filteredModules.length > 0 && (
            <div className="cl-footer">
              <p>Showing {filteredModules.length} of {modules.length} modules</p>
            </div>
          )}
        </div>
      </div>

      {modalMode && (
        <Modal
          title={modalMode === "add" ? "Add Module" : "Edit Module"}
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="cl-btn" onClick={closeModal} disabled={submitting}>Cancel</button>
              <button type="submit" form="mod-form" className="dash-primary-btn cl-add-btn" disabled={submitting}>
                {submitting ? "Saving…" : modalMode === "add" ? "Add Module" : "Save Changes"}
              </button>
            </>
          }
        >
          <form id="mod-form" onSubmit={handleSubmit}>
            <FormField label="Module Name *" error={formErrors.module_name}>
              <input type="text" value={form.module_name} onChange={(e) => setForm((f) => ({ ...f, module_name: e.target.value }))} placeholder="e.g. Introduction to Selling" />
            </FormField>
            <FormField label="Description">
              <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional description..." />
            </FormField>
            <div className="form-row">
              <FormField label="Duration (minutes)">
                <input type="number" min="1" value={form.estimated_duration} onChange={(e) => setForm((f) => ({ ...f, estimated_duration: e.target.value }))} placeholder="e.g. 80" />
              </FormField>
              <FormField label="Sequence No.">
                <input type="number" min="1" value={form.sequence_no} onChange={(e) => setForm((f) => ({ ...f, sequence_no: e.target.value }))} />
              </FormField>
            </div>
            <FormField label="Status">
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </FormField>
          </form>
        </Modal>
      )}

      {deletingRow && (
        <ConfirmDialog
          title="Delete Module"
          message={`"${deletingRow.module_name}" and all its lessons will be permanently deleted.`}
          confirmLabel="Delete"
          onCancel={() => setDeletingRow(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />
    </>
  );
}
