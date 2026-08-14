import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Icon from "../../components/Icon.jsx";
import Badge from "../../components/Badge.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import { getLesson } from "../../services/courseService.js";
import { resolveApiAssetUrl } from "../../utils/apiAssetUrl.js";
import { ROUTES } from "../../router/routePaths.js";
import LessonBlockEditor from "./lesson-editor/LessonBlockEditor.jsx";
import "../CourseList.css";

const TYPE_TONE = { Video: "blue", PDF: "purple", PPT: "orange", Audio: "green", Document: "gray", Quiz: "pink" };
const RESOURCE_TYPE_TONE = { Video: "blue", PDF: "orange", PPT: "orange", Image: "green", Audio: "green", ZIP: "gray", "External Link": "purple" };

export default function LessonDetails() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { courseId, moduleId, lessonId } = useParams();

  const [lesson, setLesson] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    getLesson(courseId, moduleId, lessonId)
      .then((data) => {
        if (cancelled) return;
        setLesson(data);
        setStatus("success");
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMessage(err.message ?? "Could not load this lesson.");
          setStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, moduleId, lessonId]);

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body wizard-page-body cv-body">
        <div className="cv-header">
          <div>
            <h1>Lesson Details</h1>
            <Breadcrumb current="Lesson Details" />
          </div>
          <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.COURSES_LESSONS)}>
            <Icon name="back" size={15} />
            Back to Lessons
          </button>
        </div>

        {status === "loading" && <Skeleton height={220} />}

        {status === "error" && (
          <div className="panel cv-state-panel">
            <Icon name="warning" size={28} />
            <h3>Couldn't load this lesson</h3>
            <p>{errorMessage}</p>
          </div>
        )}

        {status === "success" && lesson && (
          <>
            <section className="panel cv-section">
              <div className="cv-profile-title" style={{ marginBottom: 8 }}>
                <h2>{lesson.lesson_title}</h2>
                <Badge tone={lesson.status === "Active" ? "green" : "gray"}>{lesson.status}</Badge>
              </div>
              <div className="cv-profile-meta" style={{ marginBottom: 14 }}>
                {lesson.lesson_type && <Badge tone={TYPE_TONE[lesson.lesson_type] ?? "gray"}>{lesson.lesson_type}</Badge>}
                {lesson.duration_minutes && (
                  <span>
                    <Icon name="clock" size={14} />
                    {lesson.duration_minutes} minutes
                  </span>
                )}
                {lesson.sequence_no != null && (
                  <span>
                    <Icon name="layers" size={14} />
                    Sequence #{lesson.sequence_no}
                  </span>
                )}
              </div>
              {lesson.lesson_description ? (
                <div className="lbr-paragraph" dangerouslySetInnerHTML={{ __html: lesson.lesson_description }} />
              ) : (
                <p>No description provided.</p>
              )}
            </section>

            <section style={{ marginBottom: 24 }}>
              <LessonBlockEditor courseId={courseId} moduleId={moduleId} lessonId={lessonId} lessonTitle={lesson.lesson_title} />
            </section>

            <section>
              <h3 className="cv-section-title" style={{ marginBottom: 12 }}>Resources</h3>
              {(lesson.resources ?? []).length === 0 ? (
                <div className="panel cv-empty-inline">
                  <Icon name="file" size={22} />
                  <p>No resources attached to this lesson.</p>
                </div>
              ) : (
                <div className="dtable-wrap panel" style={{ padding: 0 }}>
                  <table className="dtable form-doc-table">
                    <thead>
                      <tr>
                        <th>Resource</th>
                        <th>Type</th>
                        <th>Size</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lesson.resources.map((r) => {
                        const href = r.resource_type === "External Link" ? r.external_url : resolveApiAssetUrl(r.file_path);
                        return (
                          <tr key={r.id}>
                            <td>{r.resource_title || r.resource_type}</td>
                            <td><Badge tone={RESOURCE_TYPE_TONE[r.resource_type] ?? "gray"}>{r.resource_type}</Badge></td>
                            <td>{r.file_size || "—"}</td>
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
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}
