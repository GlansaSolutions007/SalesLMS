import { useCallback, useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Icon from "../../components/Icon.jsx";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Badge from "../../components/Badge.jsx";
import DataTable from "../../components/DataTable.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import Toast from "../../components/Toast.jsx";
import TrainingTabs from "../../components/TrainingTabs.jsx";
import "./training.css";
import { listAllCourses, listAssessments, updateAssessmentStatus, deleteAssessment } from "../../services/courseService.js";
import { assessmentAttemptsPath, courseAssessmentEditPath, ROUTES } from "../../router/routePaths.js";

const STATUS_TONE = { Draft: "gray", Published: "green", Archived: "orange" };

export default function CourseAssessments() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [coursesLoading, setCoursesLoading] = useState(true);

  const [assessments, setAssessments] = useState([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [assessmentsError, setAssessmentsError] = useState(null);

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

  const loadAssessments = useCallback(async () => {
    if (!selectedCourseId) { setAssessments([]); return; }
    setAssessmentsLoading(true);
    setAssessmentsError(null);
    try {
      const result = await listAssessments({ course_id: selectedCourseId, per_page: 100 });
      setAssessments(result.items);
    } catch (err) {
      setAssessmentsError(err.message ?? "Failed to load assessments.");
    } finally {
      setAssessmentsLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => { loadAssessments(); }, [loadAssessments]);

  async function handleStatusChange(row, status) {
    setActionLoading(true);
    try {
      await updateAssessmentStatus(row.id, status);
      setToast({ tone: "success", message: `Assessment set to ${status}.` });
      loadAssessments();
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
      await deleteAssessment(deletingRow.id);
      setToast({ tone: "success", message: "Assessment deleted." });
      setDeletingRow(null);
      loadAssessments();
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not delete assessment." });
      setDeletingRow(null);
    } finally {
      setActionLoading(false);
    }
  }

  const columns = [
    {
      key: "assessment_title",
      header: "Assessment",
      render: (r) => (
        <div>
          <p className="emp-name">{r.assessment_title}</p>
          <p className="emp-code">{r.assessment_code}</p>
        </div>
      ),
    },
    {
      key: "scope",
      header: "Scope",
      render: (r) => (r.lesson ? `Lesson: ${r.lesson.lesson_title}` : r.module?.module_name ?? "Whole course"),
    },
    { key: "assessment_type", header: "Type" },
    { key: "questions_count", header: "Questions", render: (r) => r.questions_count ?? 0 },
    { key: "total_marks", header: "Total Marks" },
    { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status] ?? "gray"}>{r.status}</Badge> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="cl-row-actions">
          <button type="button" className="fa-outline-btn" onClick={() => navigate(assessmentAttemptsPath(r.id))}>
            <Icon name="clipboard" size={14} />
            Attempts
          </button>
          {r.status === "Draft" && (
            <button type="button" className="dash-icon-btn" title="Publish" disabled={actionLoading} onClick={() => handleStatusChange(r, "Published")}>
              <Icon name="play" size={15} />
            </button>
          )}
          {r.status === "Published" && (
            <button type="button" className="dash-icon-btn" title="Archive" disabled={actionLoading} onClick={() => handleStatusChange(r, "Archived")}>
              <Icon name="archive" size={15} />
            </button>
          )}
          <button type="button" className="dash-icon-btn" title="Edit" onClick={() => navigate(courseAssessmentEditPath(r.id))}>
            <Icon name="edit" size={15} />
          </button>
          <button
            type="button"
            className="dash-icon-btn"
            title="Delete"
            disabled={actionLoading || r.status !== "Draft"}
            onClick={() => setDeletingRow(r)}
          >
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
            <h1>Assessment</h1>
            <Breadcrumb current="Assessment" />
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
              <button
                type="button"
                className="dash-primary-btn cl-add-btn"
                disabled={!selectedCourseId}
                onClick={() => navigate(`${ROUTES.COURSES_ASSESSMENTS_ADD}?course_id=${selectedCourseId}`)}
              >
                <Icon name="plus" size={15} />
                Add Assessment
              </button>
            </div>
          </div>

          {assessmentsError ? (
            <div className="cl-error">
              <Icon name="warning" size={18} /><span>{assessmentsError}</span>
              <button type="button" className="cl-btn" onClick={loadAssessments}>Retry</button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={assessments}
              isLoading={assessmentsLoading || coursesLoading}
              emptyMessage={selectedCourseId ? "No assessments added to this course yet." : "Select a course to view its assessments."}
            />
          )}
        </div>
      </div>

      {deletingRow && (
        <ConfirmDialog
          title="Delete Assessment"
          message={`"${deletingRow.assessment_title}" will be permanently deleted.`}
          confirmLabel="Delete"
          onCancel={() => setDeletingRow(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />
    </>
  );
}
