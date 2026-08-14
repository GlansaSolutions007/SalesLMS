import { useCallback, useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
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
  listLessons,
  listCourseAssignments,
  createAssignment,
  updateAssignment,
  updateAssignmentStatus,
  deleteAssignment,
} from "../../services/courseService.js";
import { assignmentSubmissionsPath } from "../../router/routePaths.js";

const STATUS_TONE = { Draft: "gray", Published: "green", Closed: "orange" };

const EMPTY_FORM = {
  assignment_title: "",
  description: "",
  module_id: "",
  lesson_id: "",
  blocks_progress: true,
  total_marks: "",
  due_date: "",
};

export default function Assignments() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [coursesLoading, setCoursesLoading] = useState(true);

  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);

  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState(null);

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
      .then((list) => {
        setCourses(list);
        if (list.length) setSelectedCourseId(String(list[0].id));
      })
      .catch(() => {})
      .finally(() => setCoursesLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCourseId) { setModules([]); return; }
    listModules(selectedCourseId).then(setModules).catch(() => setModules([]));
  }, [selectedCourseId]);

  // Lesson picker cascades off the form's own Module selection — a lesson
  // has to belong to some module, so picking one first (and clearing the
  // lesson choice when it changes) keeps the two fields consistent.
  useEffect(() => {
    if (!modalMode || !form.module_id) { setLessons([]); return; }
    setLessonsLoading(true);
    listLessons(selectedCourseId, form.module_id)
      .then(setLessons)
      .catch(() => setLessons([]))
      .finally(() => setLessonsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalMode, selectedCourseId, form.module_id]);

  const loadAssignments = useCallback(async () => {
    if (!selectedCourseId) { setAssignments([]); return; }
    setAssignmentsLoading(true);
    setAssignmentsError(null);
    try {
      const data = await listCourseAssignments(selectedCourseId);
      setAssignments(data);
    } catch (err) {
      setAssignmentsError(err.message ?? "Failed to load assignments.");
    } finally {
      setAssignmentsLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => { loadAssignments(); }, [loadAssignments]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalMode("add");
  }

  function openEdit(row) {
    setEditingRow(row);
    setForm({
      assignment_title: row.assignment_title,
      description: row.description ?? "",
      module_id: row.module_id ? String(row.module_id) : "",
      lesson_id: row.lesson_id ? String(row.lesson_id) : "",
      blocks_progress: row.blocks_progress ?? true,
      total_marks: row.total_marks != null ? String(row.total_marks) : "",
      due_date: row.due_date ? String(row.due_date).slice(0, 10) : "",
    });
    setFormErrors({});
    setModalMode("edit");
  }

  function closeModal() { setModalMode(null); setEditingRow(null); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.assignment_title.trim()) {
      setFormErrors({ assignment_title: "Assignment title is required." });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        assignment_title: form.assignment_title.trim(),
        description: form.description.trim() || null,
        module_id: form.module_id || null,
        lesson_id: form.lesson_id || null,
        blocks_progress: form.lesson_id ? form.blocks_progress : true,
        total_marks: form.total_marks ? Number(form.total_marks) : null,
        due_date: form.due_date || null,
      };
      if (modalMode === "add") {
        await createAssignment(selectedCourseId, payload);
        setToast({ tone: "success", message: "Assignment created." });
      } else {
        await updateAssignment(selectedCourseId, editingRow.id, payload);
        setToast({ tone: "success", message: "Assignment updated." });
      }
      closeModal();
      loadAssignments();
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(row, status) {
    setActionLoading(true);
    try {
      await updateAssignmentStatus(selectedCourseId, row.id, status);
      setToast({ tone: "success", message: `Assignment set to ${status}.` });
      loadAssignments();
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
      await deleteAssignment(selectedCourseId, deletingRow.id);
      setToast({ tone: "success", message: "Assignment deleted." });
      setDeletingRow(null);
      loadAssignments();
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not delete assignment." });
      setDeletingRow(null);
    } finally {
      setActionLoading(false);
    }
  }

  const columns = [
    { key: "assignment_title", header: "Assignment", render: (r) => <strong>{r.assignment_title}</strong> },
    {
      key: "scope",
      header: "Scope",
      render: (r) => (r.lesson ? `Lesson: ${r.lesson.lesson_title}` : r.module?.module_name ?? "Whole course"),
    },
    { key: "total_marks", header: "Total Marks", render: (r) => r.total_marks ?? "—" },
    { key: "due_date", header: "Due Date", render: (r) => (r.due_date ? String(r.due_date).slice(0, 10) : "—") },
    { key: "submissions_count", header: "Submissions", render: (r) => r.submissions_count ?? 0 },
    { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="cl-row-actions">
          <button type="button" className="fa-outline-btn" onClick={() => navigate(assignmentSubmissionsPath(r.id))}>
            <Icon name="clipboard" size={14} />
            Submissions
          </button>
          {r.status === "Draft" && (
            <button type="button" className="dash-icon-btn" title="Publish" disabled={actionLoading} onClick={() => handleStatusChange(r, "Published")}>
              <Icon name="play" size={15} />
            </button>
          )}
          {r.status === "Published" && (
            <button type="button" className="dash-icon-btn" title="Close" disabled={actionLoading} onClick={() => handleStatusChange(r, "Closed")}>
              <Icon name="archive" size={15} />
            </button>
          )}
          <button type="button" className="dash-icon-btn" title="Edit" disabled={r.submissions_count > 0} onClick={() => openEdit(r)}>
            <Icon name="edit" size={15} />
          </button>
          <button type="button" className="dash-icon-btn" title="Delete" disabled={actionLoading || r.submissions_count > 0} onClick={() => setDeletingRow(r)}>
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
            <h1>Assignments</h1>
            <Breadcrumb current="Assignments" />
          </div>
        </div>

        <TrainingTabs />

        <div className="panel cl-panel">
          <div className="tc-course-bar">
            <div className="tc-course-select-wrap">
              <Icon name="book" size={15} />
              <select
                className="tc-course-select"
                value={selectedCourseId}
                disabled={coursesLoading}
                onChange={(e) => setSelectedCourseId(e.target.value)}
              >
                {coursesLoading && <option>Loading courses…</option>}
                {!coursesLoading && courses.length === 0 && <option value="">No courses found</option>}
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.course_name}</option>
                ))}
              </select>
            </div>

            <div className="tc-toolbar-right">
              <button type="button" className="dash-primary-btn cl-add-btn" disabled={!selectedCourseId} onClick={openAdd}>
                <Icon name="plus" size={15} />
                Add Assignment
              </button>
            </div>
          </div>

          {assignmentsError ? (
            <div className="cl-error">
              <Icon name="warning" size={18} /><span>{assignmentsError}</span>
              <button type="button" className="cl-btn" onClick={loadAssignments}>Retry</button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={assignments}
              isLoading={assignmentsLoading || coursesLoading}
              emptyMessage={selectedCourseId ? "No assignments added to this course yet." : "Select a course to view its assignments."}
            />
          )}
        </div>
      </div>

      {modalMode && (
        <Modal
          title={modalMode === "add" ? "Add Assignment" : "Edit Assignment"}
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="cl-btn" onClick={closeModal} disabled={submitting}>Cancel</button>
              <button type="submit" form="assignment-form" className="dash-primary-btn cl-add-btn" disabled={submitting}>
                {submitting ? "Saving…" : modalMode === "add" ? "Add Assignment" : "Save Changes"}
              </button>
            </>
          }
        >
          <form id="assignment-form" onSubmit={handleSubmit}>
            <FormField label="Assignment Title *" error={formErrors.assignment_title}>
              <input type="text" value={form.assignment_title} onChange={(e) => setForm((f) => ({ ...f, assignment_title: e.target.value }))} placeholder="e.g. Sales Pitch Recording" />
            </FormField>
            <FormField label="Description">
              <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Instructions for the learner..." />
            </FormField>
            <FormField label="Module (optional — leave blank for whole-course)">
              <select
                value={form.module_id}
                onChange={(e) => setForm((f) => ({ ...f, module_id: e.target.value, lesson_id: "" }))}
              >
                <option value="">Whole course</option>
                {modules.map((m) => <option key={m.id} value={m.id}>{m.module_name}</option>)}
              </select>
            </FormField>
            <FormField label="Lesson (optional — attach to one lesson instead of the whole course)">
              <select
                value={form.lesson_id}
                disabled={!form.module_id || lessonsLoading}
                onChange={(e) => setForm((f) => ({ ...f, lesson_id: e.target.value }))}
              >
                <option value="">{form.module_id ? "Whole module" : "Select a module first"}</option>
                {lessons.map((l) => <option key={l.id} value={l.id}>{l.lesson_title}</option>)}
              </select>
            </FormField>
            {form.lesson_id && (
              <label className="assignment-blocks-progress-check">
                <input
                  type="checkbox"
                  checked={form.blocks_progress}
                  onChange={(e) => setForm((f) => ({ ...f, blocks_progress: e.target.checked }))}
                />
                Require this assignment before the next lesson unlocks
              </label>
            )}
            <div className="form-row">
              <FormField label="Total Marks">
                <input type="number" min="0" value={form.total_marks} onChange={(e) => setForm((f) => ({ ...f, total_marks: e.target.value }))} />
              </FormField>
              <FormField label="Due Date">
                <input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} />
              </FormField>
            </div>
          </form>
        </Modal>
      )}

      {deletingRow && (
        <ConfirmDialog
          title="Delete Assignment"
          message={`"${deletingRow.assignment_title}" will be permanently deleted.`}
          confirmLabel="Delete"
          onCancel={() => setDeletingRow(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />
    </>
  );
}
