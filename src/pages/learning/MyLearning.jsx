import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Icon from "../../components/Icon.jsx";
import Badge from "../../components/Badge.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getMyCourses } from "../../services/learningService.js";
import { resolveApiAssetUrl } from "../../utils/apiAssetUrl.js";
import { myLearningCoursePath, myCertificateViewPath } from "../../router/routePaths.js";
import "../CourseList.css";

const STATUS_TONE = { Assigned: "blue", "In Progress": "orange", Completed: "green", Expired: "red" };

function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function MyLearning() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { user } = useAuth();
  const companyId = user?.company?.id;

  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    setStatus("loading");
    getMyCourses(companyId)
      .then((data) => {
        if (cancelled) return;
        setCourses(data);
        setStatus("success");
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMessage(err.message ?? "Could not load your courses.");
          setStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const inProgressCourses = courses.filter((c) => c.status !== "Completed");
  const completedCourses = courses.filter((c) => c.status === "Completed");

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>My Learning</h1>
            <Breadcrumb current="My Learning" />
          </div>
        </div>

        {status === "loading" && (
          <div className="cl-stats">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={140} />
            ))}
          </div>
        )}

        {status === "error" && (
          <div className="panel cv-state-panel">
            <Icon name="warning" size={28} />
            <h3>Couldn't load your courses</h3>
            <p>{errorMessage}</p>
          </div>
        )}

        {status === "success" && courses.length === 0 && (
          <div className="panel cv-empty-inline" style={{ padding: 40 }}>
            <Icon name="book" size={28} />
            <p>No courses have been assigned to you yet.</p>
          </div>
        )}

        {status === "success" && courses.length > 0 && (
          <>
            {inProgressCourses.length > 0 && (
              <section style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-heading)", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.03em" }}>In Progress</h3>
                <div className="cl-stats" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                  {inProgressCourses.map((item) => (
                    <button
                      key={item.assignment_id}
                      type="button"
                      className="panel"
                      style={{ textAlign: "left", cursor: "pointer", border: "none", padding: 18, display: "flex", flexDirection: "column", gap: 10 }}
                      onClick={() => navigate(myLearningCoursePath(item.course.id))}
                    >
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div className="cl-thumb tone-blue" style={{ width: 48, height: 48, flexShrink: 0 }}>
                          {item.course.thumbnail ? (
                            <img src={resolveApiAssetUrl(item.course.thumbnail)} alt={item.course.course_name} className="cl-thumb-img" />
                          ) : (
                            <Icon name="book" size={20} />
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p className="cl-course-title" style={{ margin: 0 }}>{item.course.course_name}</p>
                          <p className="cl-course-desc" style={{ margin: 0 }}>{item.course.course_code}</p>
                        </div>
                      </div>

                      <Badge tone={STATUS_TONE[item.status] ?? "gray"}>{item.status}</Badge>

                      <div>
                        <ProgressBar value={item.completion_percent} />
                        <p style={{ fontSize: 12, color: "var(--color-muted)", margin: "4px 0 0" }}>
                          {item.completed_lessons} of {item.total_lessons} lessons complete
                        </p>
                      </div>

                      {item.due_date && (
                        <p style={{ fontSize: 12, color: "var(--color-muted)", margin: 0 }}>
                          <Icon name="calendar" size={13} /> Due {String(item.due_date).slice(0, 10)}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {completedCourses.length > 0 && (
              <section>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-heading)", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.03em" }}>Completed Courses</h3>
                <div className="cl-stats" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                  {completedCourses.map((item) => (
                    <div
                      key={item.assignment_id}
                      className="panel"
                      role="button"
                      tabIndex={0}
                      style={{ textAlign: "left", cursor: "pointer", padding: 18, display: "flex", flexDirection: "column", gap: 10 }}
                      onClick={() => navigate(myLearningCoursePath(item.course.id))}
                      onKeyDown={(e) => e.key === "Enter" && navigate(myLearningCoursePath(item.course.id))}
                    >
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div className="cl-thumb tone-green" style={{ width: 48, height: 48, flexShrink: 0 }}>
                          {item.course.thumbnail ? (
                            <img src={resolveApiAssetUrl(item.course.thumbnail)} alt={item.course.course_name} className="cl-thumb-img" />
                          ) : (
                            <Icon name="book" size={20} />
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p className="cl-course-title" style={{ margin: 0 }}>{item.course.course_name}</p>
                          <p className="cl-course-desc" style={{ margin: 0 }}>{item.course.course_code}</p>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <Badge tone="green">
                          <Icon name="check" size={12} /> Course Completed
                        </Badge>
                        {item.certificate && (
                          <Badge tone="purple">
                            <Icon name="trophy" size={12} /> Certificate Available
                          </Badge>
                        )}
                      </div>

                      {item.completed_at && (
                        <p style={{ fontSize: 12, color: "var(--color-muted)", margin: 0 }}>
                          <Icon name="calendar" size={13} /> Completed {formatDateTime(item.completed_at)}
                        </p>
                      )}

                      {item.certificate && (
                        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                          <button
                            type="button"
                            className="cl-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(myCertificateViewPath(item.certificate.id));
                            }}
                          >
                            <Icon name="eye" size={14} /> View Certificate
                          </button>
                          {item.certificate.certificate_file && (
                            <a
                              className="cl-btn"
                              href={resolveApiAssetUrl(item.certificate.certificate_file)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Icon name="download" size={14} /> Download Certificate
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
