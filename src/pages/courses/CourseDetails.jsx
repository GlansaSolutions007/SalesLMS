import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Icon from "../../components/Icon.jsx";
import Badge from "../../components/Badge.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import StatCard from "../../components/StatCard.jsx";
import { getCourse, listModules, listLessons, getLesson } from "../../services/courseService.js";
import { resolveApiAssetUrl } from "../../utils/apiAssetUrl.js";
import { ROUTES } from "../../router/routePaths.js";
import LessonMedia from "../../components/LessonMedia.jsx";
import "../../components/RichTextEditor.css";
import "./CourseDetails.css";

const RESOURCE_TYPE_TONE = { Video: "blue", PDF: "orange", PPT: "orange", Image: "green", Audio: "green", ZIP: "gray", "External Link": "purple" };

const LEVEL_TONE = { Beginner: "green", Intermediate: "blue", Advanced: "orange" };
const STATUS_TONE = { Published: "green", Draft: "gray", Archived: "orange" };
const THUMB_TONE = { Beginner: "tone-green", Intermediate: "tone-blue", Advanced: "tone-orange" };
const LESSON_TYPE_ICON = { Video: "play", PDF: "file", PPT: "file", Audio: "file", Document: "file", Quiz: "clipboard" };
const LESSON_TYPE_TONE = { Video: "tone-blue", PDF: "tone-orange", PPT: "tone-orange", Audio: "tone-green", Document: "tone-gray", Quiz: "tone-purple" };

function durationLabel(minutes) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ""}`.trim() : `${m}m`;
}

// Expanding a lesson lazy-fetches its full detail (lesson_description,
// video_source/video_url/video_file_url, pdf_file_url, content_blocks,
// resources) via the same GET .../lessons/{lesson} endpoint the admin
// Lesson Details page already uses — the lightweight list endpoint above
// only returns lesson_type/title/duration for the collapsed row.
function LessonRow({ courseId, moduleId, lesson }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && detail === null) {
      setLoading(true);
      setError("");
      getLesson(courseId, moduleId, lesson.id)
        .then(setDetail)
        .catch((err) => setError(err.message ?? "Could not load this lesson."))
        .finally(() => setLoading(false));
    }
  }

  return (
    <div className={`cdv-lesson${open ? " is-open" : ""}`}>
      <button type="button" className="cdv-lesson-row" onClick={toggle}>
        <span className={`cdv-lesson-icon ${LESSON_TYPE_TONE[lesson.lesson_type] ?? "tone-gray"}`}>
          <Icon name={LESSON_TYPE_ICON[lesson.lesson_type] ?? "file"} size={15} />
        </span>
        <div className="cdv-lesson-text">
          <p>{lesson.lesson_title}</p>
          <span>
            {lesson.lesson_type}
            {lesson.duration_minutes ? ` · ${lesson.duration_minutes}m` : ""}
          </span>
        </div>
        <Icon name="chevronRight" size={14} className="cdv-lesson-chevron" />
      </button>

      {open && (
        <div className="cdv-lesson-body">
          {loading && <Skeleton height={80} />}
          {!loading && error && <p className="ep-empty-note">{error}</p>}
          {!loading && detail && (
            <>
              <LessonMedia lesson={detail} />

              {(detail.resources ?? []).length > 0 && (
                <>
                  <div className="cdv-lesson-resources-label">Resources</div>
                  <div className="dtable-wrap">
                    <table className="dtable form-doc-table">
                      <tbody>
                        {detail.resources.map((r) => {
                          const href = r.resource_type === "External Link" ? r.external_url : resolveApiAssetUrl(r.file_path);
                          return (
                            <tr key={r.id}>
                              <td>{r.resource_title || r.resource_type}</td>
                              <td>
                                <Badge tone={RESOURCE_TYPE_TONE[r.resource_type] ?? "gray"}>{r.resource_type}</Badge>
                              </td>
                              <td>
                                {href && (
                                  <a href={href} target="_blank" rel="noreferrer" className="dash-icon-btn" aria-label="Open resource">
                                    <Icon name={r.resource_type === "External Link" ? "globe" : "download"} size={15} />
                                  </a>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ModuleAccordion({ courseId, module, index }) {
  const [open, setOpen] = useState(false);
  const [lessons, setLessons] = useState(null);
  const [loading, setLoading] = useState(false);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && lessons === null) {
      setLoading(true);
      listLessons(courseId, module.id)
        .then(setLessons)
        .catch(() => setLessons([]))
        .finally(() => setLoading(false));
    }
  }

  return (
    <div className={`cdv-module${open ? " is-open" : ""}`}>
      <button type="button" className="cdv-module-head" onClick={toggle}>
        <span className="cdv-module-num">{module.sequence_no ?? index + 1}</span>
        <span className="cdv-module-title">{module.module_name}</span>
        <span className="cdv-module-meta">
          {module.lessons_count ?? 0} lesson{module.lessons_count === 1 ? "" : "s"}
          {durationLabel(module.estimated_duration) && ` · ${durationLabel(module.estimated_duration)}`}
          <Icon name="chevronRight" size={14} />
        </span>
      </button>

      {open && (
        <div className="cdv-module-body">
          {loading && <Skeleton height={40} />}
          {!loading && lessons?.length === 0 && <p className="ep-empty-note">No lessons in this module yet.</p>}
          {!loading &&
            lessons?.map((lesson) => (
              <LessonRow key={lesson.id} courseId={courseId} moduleId={module.id} lesson={lesson} />
            ))}
        </div>
      )}
    </div>
  );
}

export default function CourseDetails() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    Promise.all([getCourse(id), listModules(id)])
      .then(([courseData, moduleData]) => {
        if (cancelled) return;
        setCourse(courseData);
        setModules(moduleData);
        setStatus("success");
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMessage(err.message ?? "Could not load this course.");
          setStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const durationHoursLabel = course?.duration_hours
    ? `${Math.floor(course.duration_hours)}h ${Math.round((course.duration_hours % 1) * 60)}m`
    : "—";

  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons_count ?? 0), 0);

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body wizard-page-body cv-body">
        <div className="cv-header">
          <div>
            <h1>Course Details</h1>
            <Breadcrumb current="Course Details" />
          </div>
          <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.COURSES)}>
            <Icon name="back" size={15} />
            Back to Courses
          </button>
        </div>

        {status === "loading" && (
          <div className="panel cdv-hero">
            <Skeleton width={108} height={108} radius={20} />
            <div className="cdv-hero-info">
              <Skeleton width="40%" height={24} />
              <Skeleton width="20%" height={14} className="cv-skeleton-gap" />
              <Skeleton width="60%" height={24} className="cv-skeleton-gap" />
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="panel cv-state-panel">
            <Icon name="warning" size={28} />
            <h3>Couldn't load this course</h3>
            <p>{errorMessage}</p>
          </div>
        )}

        {status === "success" && course && (
          <>
            <div className="panel cdv-hero">
              <div className={`cdv-hero-thumb ${THUMB_TONE[course.difficulty_level] ?? "tone-blue"}`}>
                {course.thumbnail ? (
                  <img src={resolveApiAssetUrl(course.thumbnail)} alt={course.course_name} className="cdv-hero-thumb-img" />
                ) : (
                  <Icon name="book" size={36} />
                )}
              </div>
              <div className="cdv-hero-info">
                <div className="cdv-hero-top">
                  <h2>{course.course_name}</h2>
                  <Badge tone={STATUS_TONE[course.status] ?? "gray"}>{course.status}</Badge>
                </div>
                <p className="cdv-hero-code">{course.course_code}</p>
                <div className="cdv-hero-badges">
                  {course.category && (
                    <span className="cdv-chip">
                      <Icon name="gridView" size={13} />
                      {course.category.category_name}
                    </span>
                  )}
                  {course.difficulty_level && (
                    <Badge tone={LEVEL_TONE[course.difficulty_level] ?? "gray"}>{course.difficulty_level}</Badge>
                  )}
                  {durationHoursLabel !== "—" && (
                    <span className="cdv-chip">
                      <Icon name="clock" size={13} />
                      {durationHoursLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="cdv-stats-grid">
              <StatCard icon="gridView" label="Modules" value={course.modules_count ?? modules.length} tone="blue" />
              <StatCard icon="book" label="Lessons" value={totalLessons} tone="purple" />
              <StatCard icon="cap" label="Batches" value={course.batches_count ?? 0} tone="green" />
              <StatCard icon="clipboard" label="Assessments" value={course.assessments_count ?? 0} tone="orange" />
              <StatCard icon="clock" label="Duration" value={durationHoursLabel} tone="blue" />
            </div>

            <div className="cv-columns">
              <div className="cv-main-col">
                <section className="panel cv-section">
                  <h3 className="cv-section-title">Description</h3>
                  {course.description ? (
                    // Authored via the Add Course wizard's RichTextEditor
                    // (contentEditable, admin/trainer-only) — this is trusted
                    // internal HTML, not arbitrary user input, so rendering
                    // it is the same trust boundary as the rest of this
                    // admin panel.
                    <div className="cdv-description rte-content" dangerouslySetInnerHTML={{ __html: course.description }} />
                  ) : (
                    <p className="cdv-description">No description provided.</p>
                  )}
                </section>

                <section className="panel cv-section">
                  <h3 className="cv-section-title">Curriculum</h3>
                  {modules.length === 0 ? (
                    <div className="cv-empty-inline">
                      <Icon name="book" size={22} />
                      <p>No modules added to this course yet.</p>
                    </div>
                  ) : (
                    <div className="cdv-curriculum-list">
                      {modules.map((m, i) => (
                        <ModuleAccordion key={m.id} courseId={id} module={m} index={i} />
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <div className="cv-side-col">
                <section className="panel cv-section">
                  <h3 className="cv-section-title">Course Information</h3>
                  <div className="cdv-info-list">
                    <div className="cdv-info-row">
                      <span>Category</span>
                      <p>{course.category?.category_name ?? "—"}</p>
                    </div>
                    <div className="cdv-info-row">
                      <span>Difficulty</span>
                      <p>{course.difficulty_level ?? "—"}</p>
                    </div>
                    <div className="cdv-info-row">
                      <span>Duration</span>
                      <p>{durationHoursLabel}</p>
                    </div>
                    <div className="cdv-info-row">
                      <span>Status</span>
                      <Badge tone={STATUS_TONE[course.status] ?? "gray"}>{course.status}</Badge>
                    </div>
                  </div>
                </section>

                {course.created_by && (
                  <section className="panel cv-section">
                    <h3 className="cv-section-title">Created Information</h3>
                    <div className="cdv-info-list">
                      <div className="cdv-info-row">
                        <span>Created By</span>
                        <p>{course.created_by.name}</p>
                      </div>
                      <div className="cdv-info-row">
                        <span>Created Date</span>
                        <p>{course.created_at ? String(course.created_at).slice(0, 10) : "—"}</p>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
