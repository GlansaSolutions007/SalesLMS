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
  listLessons,
  listResources,
  createResource,
  updateResource,
  deleteResource,
} from "../../services/courseService.js";
import { resolveApiAssetUrl } from "../../utils/apiAssetUrl.js";

const RESOURCE_TYPES = ["Video", "PDF", "PPT", "Image", "Audio", "ZIP", "External Link"];
const TYPE_TONE = { Video: "blue", PDF: "orange", PPT: "orange", Image: "green", Audio: "green", ZIP: "gray", "External Link": "purple" };

const EMPTY_FORM = { resource_type: "PDF", resource_title: "", external_url: "", file: null, fileName: "" };

export default function LessonResources() {
  const { toggleCollapsed } = useOutletContext();

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [coursesLoading, setCoursesLoading] = useState(true);

  const [courseModules, setCourseModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [modulesLoading, setModulesLoading] = useState(false);

  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [lessonsLoading, setLessonsLoading] = useState(false);

  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourcesError, setResourcesError] = useState(null);

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

  useEffect(() => {
    if (!selectedCourseId || !selectedModuleId) { setLessons([]); setSelectedLessonId(""); return; }
    setLessonsLoading(true);
    setSelectedLessonId("");
    listLessons(selectedCourseId, selectedModuleId)
      .then((data) => {
        setLessons(data);
        if (data.length) setSelectedLessonId(String(data[0].id));
      })
      .catch(() => {})
      .finally(() => setLessonsLoading(false));
  }, [selectedCourseId, selectedModuleId]);

  const loadResources = useCallback(async () => {
    if (!selectedCourseId || !selectedModuleId || !selectedLessonId) { setResources([]); return; }
    setResourcesLoading(true);
    setResourcesError(null);
    try {
      const data = await listResources(selectedCourseId, selectedModuleId, selectedLessonId);
      setResources(data);
    } catch (err) {
      setResourcesError(err.message ?? "Failed to load resources.");
    } finally {
      setResourcesLoading(false);
    }
  }, [selectedCourseId, selectedModuleId, selectedLessonId]);

  useEffect(() => { loadResources(); }, [loadResources]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalMode("add");
  }

  function openEdit(row) {
    setEditingRow(row);
    setForm({
      resource_type: row.resource_type ?? "PDF",
      resource_title: row.resource_title ?? "",
      external_url: row.external_url ?? "",
      file: null,
      fileName: row.file_path ? row.file_path.split("/").pop() : "",
    });
    setFormErrors({});
    setModalMode("edit");
  }

  function closeModal() { setModalMode(null); setEditingRow(null); }

  function validate() {
    const errors = {};
    if (form.resource_type === "External Link" && !form.external_url.trim()) {
      errors.external_url = "An external URL is required for External Link resources.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("resource_type", form.resource_type);
      if (form.resource_title.trim()) fd.append("resource_title", form.resource_title.trim());
      if (form.external_url.trim()) fd.append("external_url", form.external_url.trim());
      if (form.file) fd.append("file", form.file);

      if (modalMode === "add") {
        await createResource(selectedCourseId, selectedModuleId, selectedLessonId, fd);
        setToast({ tone: "success", message: "Resource added." });
      } else {
        await updateResource(selectedCourseId, selectedModuleId, selectedLessonId, editingRow.id, fd);
        setToast({ tone: "success", message: "Resource updated." });
      }
      closeModal();
      loadResources();
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingRow) return;
    setActionLoading(true);
    try {
      await deleteResource(selectedCourseId, selectedModuleId, selectedLessonId, deletingRow.id);
      setToast({ tone: "success", message: "Resource deleted." });
      setDeletingRow(null);
      loadResources();
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not delete resource." });
      setDeletingRow(null);
    } finally {
      setActionLoading(false);
    }
  }

  const columns = [
    {
      key: "resource_title",
      header: "Resource",
      render: (r) => <strong>{r.resource_title || r.resource_type}</strong>,
    },
    { key: "resource_type", header: "Type", render: (r) => <Badge tone={TYPE_TONE[r.resource_type] ?? "gray"}>{r.resource_type}</Badge> },
    { key: "file_size", header: "Size", render: (r) => r.file_size || "—" },
    {
      key: "link",
      header: "",
      render: (r) => {
        const href = r.resource_type === "External Link" ? r.external_url : resolveApiAssetUrl(r.file_path);
        return href ? (
          <a href={href} target="_blank" rel="noreferrer" className="dash-icon-btn" aria-label="Open resource">
            <Icon name={r.resource_type === "External Link" ? "globe" : "download"} size={15} />
          </a>
        ) : (
          <span className="tc-muted">—</span>
        );
      },
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

  const ready = selectedCourseId && selectedModuleId && selectedLessonId;

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Lesson Resources</h1>
            <Breadcrumb current="Resources" />
          </div>
        </div>

        <TrainingTabs />

        <div className="panel cl-panel">
          <div className="tc-course-bar">
            <div className="tc-context-selects">
              <div className="tc-course-select-wrap">
                <Icon name="book" size={15} />
                <select className="tc-course-select" value={selectedCourseId} disabled={coursesLoading} onChange={(e) => setSelectedCourseId(e.target.value)}>
                  {coursesLoading && <option>Loading…</option>}
                  {!coursesLoading && courses.length === 0 && <option value="">No courses</option>}
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.course_name}</option>)}
                </select>
              </div>

              <Icon name="chevronRight" size={14} className="tc-muted" />

              <div className="tc-course-select-wrap">
                <Icon name="layers" size={15} />
                <select className="tc-course-select" value={selectedModuleId} disabled={modulesLoading || !selectedCourseId} onChange={(e) => setSelectedModuleId(e.target.value)}>
                  {modulesLoading && <option>Loading…</option>}
                  {!modulesLoading && courseModules.length === 0 && <option value="">No modules</option>}
                  {courseModules.map((m) => <option key={m.id} value={m.id}>{m.module_name}</option>)}
                </select>
              </div>

              <Icon name="chevronRight" size={14} className="tc-muted" />

              <div className="tc-course-select-wrap">
                <Icon name="file" size={15} />
                <select className="tc-course-select" value={selectedLessonId} disabled={lessonsLoading || !selectedModuleId} onChange={(e) => setSelectedLessonId(e.target.value)}>
                  {lessonsLoading && <option>Loading…</option>}
                  {!lessonsLoading && lessons.length === 0 && <option value="">No lessons</option>}
                  {lessons.map((l) => <option key={l.id} value={l.id}>{l.lesson_title}</option>)}
                </select>
              </div>
            </div>

            <div className="tc-toolbar-right">
              <button type="button" className="dash-primary-btn cl-add-btn" disabled={!ready} onClick={openAdd}>
                <Icon name="plus" size={15} />
                Add Resource
              </button>
            </div>
          </div>

          {resourcesError ? (
            <div className="cl-error">
              <Icon name="warning" size={18} /><span>{resourcesError}</span>
              <button type="button" className="cl-btn" onClick={loadResources}>Retry</button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={resources}
              isLoading={resourcesLoading || coursesLoading || modulesLoading || lessonsLoading}
              emptyMessage={!ready ? "Select a course, module, and lesson to view its resources." : "No resources added to this lesson yet."}
            />
          )}

          {!resourcesLoading && !resourcesError && resources.length > 0 && (
            <div className="cl-footer">
              <p>Showing {resources.length} resource{resources.length === 1 ? "" : "s"}</p>
            </div>
          )}
        </div>
      </div>

      {modalMode && (
        <Modal
          title={modalMode === "add" ? "Add Resource" : "Edit Resource"}
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="cl-btn" onClick={closeModal} disabled={submitting}>Cancel</button>
              <button type="submit" form="res-form" className="dash-primary-btn cl-add-btn" disabled={submitting}>
                {submitting ? "Saving…" : modalMode === "add" ? "Add Resource" : "Save Changes"}
              </button>
            </>
          }
        >
          <form id="res-form" onSubmit={handleSubmit}>
            <FormField label="Resource Type">
              <select value={form.resource_type} onChange={(e) => setForm((f) => ({ ...f, resource_type: e.target.value }))}>
                {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Title">
              <input type="text" value={form.resource_title} onChange={(e) => setForm((f) => ({ ...f, resource_title: e.target.value }))} placeholder="e.g. Sales Funnel Worksheet" />
            </FormField>

            {form.resource_type === "External Link" ? (
              <FormField label="External URL *" error={formErrors.external_url}>
                <input type="url" value={form.external_url} onChange={(e) => setForm((f) => ({ ...f, external_url: e.target.value }))} placeholder="https://..." />
              </FormField>
            ) : (
              <FormField label={`File${form.fileName ? ` (current: ${form.fileName})` : ""}`}>
                <input type="file" onChange={(e) => setForm((f) => ({ ...f, file: e.target.files?.[0] ?? null, fileName: e.target.files?.[0]?.name ?? f.fileName }))} />
              </FormField>
            )}
          </form>
        </Modal>
      )}

      {deletingRow && (
        <ConfirmDialog
          title="Delete Resource"
          message={`"${deletingRow.resource_title || deletingRow.resource_type}" will be permanently deleted.`}
          confirmLabel="Delete"
          onCancel={() => setDeletingRow(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />
    </>
  );
}
