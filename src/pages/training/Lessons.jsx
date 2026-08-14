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
import LessonTypeFields from "../../components/LessonTypeFields.jsx";
import { validateLessonTypeFields } from "../../utils/lessonTypeFields.js";
import { lessonViewPath } from "../../router/routePaths.js";
import "./training.css";
import {
  listAllCourses,
  listModules,
  listLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  toggleLessonStatus,
} from "../../services/courseService.js";

// The type filter (and existing rows) can still be any legacy value, so it
// keeps the full historical set rather than being limited to the three
// LessonTypeFields now offers in the create/edit form.
const LESSON_TYPES = ["Content", "Video", "PDF", "PPT", "Audio", "Document", "Quiz"];
const TYPE_TONE = { Content: "green", Video: "blue", PDF: "purple", PPT: "orange", Audio: "green", Document: "gray", Quiz: "pink" };
const STATUS_TONE = { Active: "green", Inactive: "gray" };

function fileNameFromPath(path) {
  return path ? path.split("/").pop() : "";
}

const EMPTY_FORM = {
  lesson_title: "",
  lesson_type: "Content",
  lesson_description: "",
  video_source: "upload",
  video_url: "",
  video_file_path: "",
  video_file_name: "",
  video_file_url: "",
  pdf_file_path: "",
  pdf_file_name: "",
  pdf_file_url: "",
  duration_minutes: "",
  sequence_no: "",
  status: "Active",
};

export default function Lessons() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [coursesLoading, setCoursesLoading] = useState(true);

  const [courseModules, setCourseModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [modulesLoading, setModulesLoading] = useState(false);

  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonsError, setLessonsError] = useState(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [modalMode, setModalMode] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  // Shown instead of the form right after a successful "Add Lesson" save —
  // lets a trainer keep adding lessons to the same course/module without
  // the modal closing and losing the course/section context each time.
  const [justSaved, setJustSaved] = useState(false);

  const [deletingRow, setDeletingRow] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Load courses on mount
  useEffect(() => {
    listAllCourses()
      .then((list) => {
        setCourses(list);
        if (list.length) setSelectedCourseId(String(list[0].id));
      })
      .catch(() => {})
      .finally(() => setCoursesLoading(false));
  }, []);

  // Load modules when course changes
  useEffect(() => {
    if (!selectedCourseId) { setCourseModules([]); setSelectedModuleId(""); return; }
    setModulesLoading(true);
    setSelectedModuleId("");
    listModules(selectedCourseId)
      .then((data) => {
        setCourseModules(data);
        if (data.length) setSelectedModuleId(String(data[0].id));
      })
      .catch(() => {})
      .finally(() => setModulesLoading(false));
  }, [selectedCourseId]);

  // Load lessons when module changes
  const loadLessons = useCallback(async () => {
    if (!selectedCourseId || !selectedModuleId) { setLessons([]); return; }
    setLessonsLoading(true);
    setLessonsError(null);
    try {
      const data = await listLessons(selectedCourseId, selectedModuleId);
      setLessons(data);
    } catch (err) {
      setLessonsError(err.message ?? "Failed to load lessons.");
    } finally {
      setLessonsLoading(false);
    }
  }, [selectedCourseId, selectedModuleId]);

  useEffect(() => { loadLessons(); }, [loadLessons]);

  const filteredLessons = lessons.filter((l) => {
    const matchSearch = !search || l.lesson_title.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || l.lesson_type === typeFilter;
    const matchStatus = statusFilter === "All" || l.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  function openAdd() {
    setForm({ ...EMPTY_FORM, sequence_no: String(lessons.length + 1) });
    setFormErrors({});
    setJustSaved(false);
    setModalMode("add");
  }

  function openEdit(row) {
    setEditingRow(row);
    setForm({
      lesson_title: row.lesson_title,
      lesson_type: row.lesson_type ?? "Content",
      lesson_description: row.lesson_description ?? "",
      video_source: row.video_source ?? "upload",
      video_url: row.video_url ?? "",
      video_file_path: row.video_file_path ?? "",
      video_file_name: fileNameFromPath(row.video_file_path),
      video_file_url: row.video_file_url ?? "",
      pdf_file_path: row.pdf_file_path ?? "",
      pdf_file_name: fileNameFromPath(row.pdf_file_path),
      pdf_file_url: row.pdf_file_url ?? "",
      duration_minutes: row.duration_minutes != null ? String(row.duration_minutes) : "",
      sequence_no: String(row.sequence_no ?? ""),
      status: row.status,
    });
    setFormErrors({});
    setJustSaved(false);
    setModalMode("edit");
  }

  function closeModal() { setModalMode(null); setEditingRow(null); setJustSaved(false); }

  function handleAddAnother() {
    // Course/module selection lives outside the modal (selectedCourseId /
    // selectedModuleId), so it's untouched by this — only the form resets.
    setForm({ ...EMPTY_FORM, sequence_no: String(lessons.length + 1) });
    setFormErrors({});
    setJustSaved(false);
  }

  function validate() {
    const errors = {};
    if (!form.lesson_title.trim()) errors.lesson_title = "Lesson title is required.";

    const typeErrors = validateLessonTypeFields({
      lessonType: form.lesson_type,
      description: form.lesson_description,
      videoSource: form.video_source,
      videoUrl: form.video_url,
      videoFilePath: form.video_file_path,
      pdfFilePath: form.pdf_file_path,
    });
    if (typeErrors.description) errors.lesson_description = typeErrors.description;
    if (typeErrors.videoUrl) errors.video_url = typeErrors.videoUrl;
    if (typeErrors.videoFilePath) errors.video_file_path = typeErrors.videoFilePath;
    if (typeErrors.pdfFilePath) errors.pdf_file_path = typeErrors.pdfFilePath;

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        lesson_title: form.lesson_title.trim(),
        lesson_type: form.lesson_type,
        lesson_description: form.lesson_type === "Content" ? form.lesson_description.trim() || null : null,
        video_source: form.lesson_type === "Video" ? form.video_source : null,
        video_url: form.lesson_type === "Video" && form.video_source === "external" ? form.video_url.trim() || null : null,
        video_file_path: form.lesson_type === "Video" && form.video_source === "upload" ? form.video_file_path || null : null,
        pdf_file_path: form.lesson_type === "PDF" ? form.pdf_file_path || null : null,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
        sequence_no: form.sequence_no ? Number(form.sequence_no) : null,
        status: form.status,
      };
      if (modalMode === "add") {
        await createLesson(selectedCourseId, selectedModuleId, payload);
        setToast({ tone: "success", message: "Lesson created." });
        setJustSaved(true);
      } else {
        await updateLesson(selectedCourseId, selectedModuleId, editingRow.id, payload);
        setToast({ tone: "success", message: "Lesson updated." });
        closeModal();
      }
      loadLessons();
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
      await toggleLessonStatus(selectedCourseId, selectedModuleId, row.id, next);
      setToast({ tone: "success", message: `Lesson set to ${next}.` });
      loadLessons();
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
      await deleteLesson(selectedCourseId, selectedModuleId, deletingRow.id);
      setToast({ tone: "success", message: "Lesson deleted." });
      setDeletingRow(null);
      loadLessons();
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not delete lesson." });
      setDeletingRow(null);
    } finally {
      setActionLoading(false);
    }
  }

  const columns = [
    { key: "sequence_no", header: "#", render: (r) => <span className="tc-muted">{r.sequence_no}</span> },
    { key: "lesson_title", header: "Lesson Title", render: (r) => <strong>{r.lesson_title}</strong> },
    {
      key: "lesson_type", header: "Type",
      render: (r) => r.lesson_type ? <Badge tone={TYPE_TONE[r.lesson_type] ?? "gray"}>{r.lesson_type}</Badge> : <span className="tc-muted">—</span>,
    },
    {
      key: "duration_minutes", header: "Duration",
      render: (r) => r.duration_minutes ? `${r.duration_minutes}m` : <span className="tc-muted">—</span>,
    },
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
          <button type="button" className="dash-icon-btn" title="View" onClick={() => navigate(lessonViewPath(selectedCourseId, selectedModuleId, r.id))}>
            <Icon name="eye" size={15} />
          </button>
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

  const ready = selectedCourseId && selectedModuleId;

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Lessons</h1>
            <Breadcrumb current="Lessons" />
          </div>
        </div>

        <TrainingTabs />

        <div className="panel cl-panel">
          {/* Context selectors */}
          <div className="tc-course-bar">
            <div className="tc-context-selects">
              <div className="tc-course-select-wrap">
                <Icon name="book" size={15} />
                <select
                  className="tc-course-select"
                  value={selectedCourseId}
                  disabled={coursesLoading}
                  onChange={(e) => { setSelectedCourseId(e.target.value); setSearch(""); }}
                >
                  {coursesLoading && <option>Loading…</option>}
                  {!coursesLoading && courses.length === 0 && <option value="">No courses</option>}
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.course_name}</option>)}
                </select>
              </div>

              <Icon name="chevronRight" size={14} className="tc-muted" />

              <div className="tc-course-select-wrap">
                <Icon name="layers" size={15} />
                <select
                  className="tc-course-select"
                  value={selectedModuleId}
                  disabled={modulesLoading || !selectedCourseId}
                  onChange={(e) => { setSelectedModuleId(e.target.value); setSearch(""); }}
                >
                  {modulesLoading && <option>Loading…</option>}
                  {!modulesLoading && courseModules.length === 0 && <option value="">No modules</option>}
                  {courseModules.map((m) => <option key={m.id} value={m.id}>{m.module_name}</option>)}
                </select>
              </div>
            </div>

            <div className="tc-toolbar-right">
              <div className="cl-search tc-search">
                <Icon name="search" size={15} />
                <input type="text" placeholder="Search lessons..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <select className="dt-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                {["All", ...LESSON_TYPES].map((o) => <option key={o} value={o}>{o === "All" ? "All Types" : o}</option>)}
              </select>
              <select className="dt-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {["All", "Active", "Inactive"].map((o) => <option key={o} value={o}>{o === "All" ? "All Status" : o}</option>)}
              </select>
              <button type="button" className="dash-primary-btn cl-add-btn" disabled={!ready} onClick={openAdd}>
                <Icon name="plus" size={15} />
                Add Lesson
              </button>
            </div>
          </div>

          {lessonsError ? (
            <div className="cl-error">
              <Icon name="warning" size={18} /><span>{lessonsError}</span>
              <button type="button" className="cl-btn" onClick={loadLessons}>Retry</button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={filteredLessons}
              isLoading={lessonsLoading || coursesLoading || modulesLoading}
              emptyMessage={
                !selectedCourseId ? "Select a course to get started." :
                !selectedModuleId ? "Select a module to view its lessons." :
                "No lessons found for this module."
              }
            />
          )}

          {!lessonsLoading && !lessonsError && filteredLessons.length > 0 && (
            <div className="cl-footer">
              <p>Showing {filteredLessons.length} of {lessons.length} lessons</p>
            </div>
          )}
        </div>
      </div>

      {modalMode && justSaved ? (
        <Modal
          title="Lesson Saved"
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="cl-btn" onClick={handleAddAnother}>Save &amp; Add Another Lesson</button>
              <button type="button" className="dash-primary-btn cl-add-btn" onClick={closeModal}>Save &amp; Close</button>
            </>
          }
        >
          <div className="lessons-saved-note">
            <Icon name="check" size={28} />
            <p>Lesson saved successfully.</p>
          </div>
        </Modal>
      ) : modalMode && (
        <Modal
          title={modalMode === "add" ? "Add Lesson" : "Edit Lesson"}
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="cl-btn" onClick={closeModal} disabled={submitting}>Cancel</button>
              <button type="submit" form="les-form" className="dash-primary-btn cl-add-btn" disabled={submitting}>
                {submitting ? "Saving…" : modalMode === "add" ? "Add Lesson" : "Save Changes"}
              </button>
            </>
          }
        >
          <form id="les-form" onSubmit={handleSubmit}>
            <FormField label="Lesson Title *" error={formErrors.lesson_title}>
              <input type="text" value={form.lesson_title} onChange={(e) => setForm((f) => ({ ...f, lesson_title: e.target.value }))} placeholder="e.g. Introduction to Selling" />
            </FormField>

            <LessonTypeFields
              lessonType={form.lesson_type}
              onLessonTypeChange={(v) => setForm((f) => ({ ...f, lesson_type: v }))}
              description={form.lesson_description}
              onDescriptionChange={(html) => setForm((f) => ({ ...f, lesson_description: html }))}
              descriptionError={formErrors.lesson_description}
              videoSource={form.video_source}
              onVideoSourceChange={(v) => setForm((f) => ({ ...f, video_source: v }))}
              videoUrl={form.video_url}
              onVideoUrlChange={(v) => setForm((f) => ({ ...f, video_url: v }))}
              videoUrlError={formErrors.video_url}
              videoFileName={form.video_file_name}
              videoFileUrl={form.video_file_url}
              videoFileError={formErrors.video_file_path}
              onVideoFileUploaded={({ path, name, url }) => {
                setForm((f) => ({ ...f, video_file_path: path, video_file_name: name, video_file_url: url }));
                setFormErrors((prev) => ({ ...prev, video_file_path: undefined }));
              }}
              onVideoFileCleared={() => setForm((f) => ({ ...f, video_file_path: "", video_file_name: "", video_file_url: "" }))}
              pdfFileName={form.pdf_file_name}
              pdfFileUrl={form.pdf_file_url}
              pdfFileError={formErrors.pdf_file_path}
              onPdfFileUploaded={({ path, name, url }) => {
                setForm((f) => ({ ...f, pdf_file_path: path, pdf_file_name: name, pdf_file_url: url }));
                setFormErrors((prev) => ({ ...prev, pdf_file_path: undefined }));
              }}
              onPdfFileCleared={() => setForm((f) => ({ ...f, pdf_file_path: "", pdf_file_name: "", pdf_file_url: "" }))}
            />

            <div className="form-row">
              <FormField label="Duration (minutes)">
                <input type="number" min="1" value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))} placeholder="e.g. 15" />
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
          title="Delete Lesson"
          message={`"${deletingRow.lesson_title}" will be permanently deleted.`}
          confirmLabel="Delete"
          onCancel={() => setDeletingRow(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />
    </>
  );
}
