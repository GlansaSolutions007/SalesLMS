import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import Topbar from "../components/Topbar.jsx";
import Badge from "../components/Badge.jsx";
import Pagination from "../components/Pagination.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import Skeleton from "../components/Skeleton.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Toast from "../components/Toast.jsx";
import { ROUTES } from "../router/routePaths.js";
import { listCourses, updateCourseStatus, deleteCourse } from "../services/courseService.js";
import "./CourseList.css";

const TABS = ["All", "Draft", "Published", "Archived"];

const LEVEL_TONE = { Beginner: "green", Intermediate: "blue", Advanced: "orange" };
const STATUS_TONE = { Published: "green", Draft: "gray", Archived: "orange" };

const DEFAULT_PAGINATION = { total: 0, per_page: 25, current_page: 1, last_page: 1, from: 1, to: 0 };

export default function CourseList() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const statusFilter = useMemo(() => (activeTab === "All" ? "" : activeTab), [activeTab]);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, per_page: 25, sort: "created_at", dir: "desc" };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const result = await listCourses(params);
      setCourses(result.items);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message ?? "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function handleTabChange(tab) {
    setActiveTab(tab);
    setPage(1);
  }

  async function handleStatusChange(course, status) {
    setActionLoading(true);
    try {
      await updateCourseStatus(course.id, status);
      setToast({ tone: "success", message: `Course marked as ${status}.` });
      loadCourses();
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not update status." });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    setActionLoading(true);
    try {
      await deleteCourse(confirmDelete.id);
      setToast({ tone: "success", message: "Course deleted." });
      setConfirmDelete(null);
      loadCourses();
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not delete course." });
      setConfirmDelete(null);
    } finally {
      setActionLoading(false);
    }
  }

  const stats = useMemo(() => {
    const total = pagination.total;
    const counts = { Published: 0, Draft: 0, Archived: 0 };
    courses.forEach((c) => { if (c.status in counts) counts[c.status]++; });
    return { total, ...counts };
  }, [courses, pagination.total]);

  return (
    <>
      <Topbar
        onMenuClick={toggleCollapsed}
        searchPlaceholder="Search courses, topics or skills..."
        notifications={3}
        messages={5}
      />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Course List</h1>
            <Breadcrumb current="Course List" />
          </div>

          <div className="cl-actions">
            <div className="cl-search">
              <Icon name="search" size={16} />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <button type="button" className="dash-primary-btn cl-add-btn" onClick={() => navigate(ROUTES.COURSES_CREATE)}>
              <Icon name="plus" size={16} />
              Add New Course
            </button>
          </div>
        </div>

        <div className="cl-stats">
          <StatCard label="Total Courses" value={stats.total} icon="book" tone="blue" />
          <StatCard label="Published" value={stats.Published} icon="play" tone="green" />
          <StatCard label="Draft" value={stats.Draft} icon="clock" tone="purple" />
          <StatCard label="Archived" value={stats.Archived} icon="archive" tone="orange" />
        </div>

        <div className="panel cl-panel">
          <div className="cl-tabs-row">
            <div className="cl-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`cl-tab${activeTab === tab ? " is-active" : ""}`}
                  onClick={() => handleTabChange(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="cl-table-wrap">
            {error ? (
              <div className="cl-error">
                <Icon name="warning" size={18} />
                <span>{error}</span>
                <button type="button" className="cl-btn" onClick={loadCourses}>Retry</button>
              </div>
            ) : loading ? (
              <CourseTableSkeleton />
            ) : courses.length === 0 ? (
              <div className="cl-empty">
                <Icon name="book" size={32} />
                <p>No courses found.</p>
                <button type="button" className="dash-primary-btn" onClick={() => navigate(ROUTES.COURSES_CREATE)}>
                  <Icon name="plus" size={15} />
                  Create Course
                </button>
              </div>
            ) : (
              <table className="cl-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Category</th>
                    <th>Level</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <CourseRow
                      key={course.id}
                      course={course}
                      onStatusChange={handleStatusChange}
                      onDelete={() => setConfirmDelete(course)}
                      disabled={actionLoading}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!loading && !error && (
            <div className="cl-footer">
              <p>
                Showing {pagination.from ?? 1}–{pagination.to ?? courses.length} of {pagination.total} courses
              </p>
              <Pagination page={pagination.current_page} totalPages={pagination.last_page} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />

      {confirmDelete && (
        <ConfirmDialog
          title="Delete course?"
          message={`"${confirmDelete.course_name}" will be permanently deleted. This cannot be undone.`}
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
}

function CourseRow({ course, onStatusChange, onDelete, disabled }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const durationLabel = course.duration_hours
    ? `${Math.floor(course.duration_hours)}h ${Math.round((course.duration_hours % 1) * 60)}m`
    : "—";

  return (
    <tr>
      <td>
        <div className="cl-course-cell">
          <div className="cl-thumb tone-blue">
            {course.thumbnail ? (
              <img src={course.thumbnail} alt={course.course_name} className="cl-thumb-img" />
            ) : (
              <Icon name="book" size={22} />
            )}
          </div>
          <div>
            <p className="cl-course-title">{course.course_name}</p>
            <p className="cl-course-desc">{course.course_code}</p>
          </div>
        </div>
      </td>
      <td>
        {course.category ? (
          <Badge tone="blue">{course.category.category_name}</Badge>
        ) : (
          <span className="cl-muted">—</span>
        )}
      </td>
      <td>
        {course.difficulty_level ? (
          <Badge tone={LEVEL_TONE[course.difficulty_level] ?? "gray"}>{course.difficulty_level}</Badge>
        ) : (
          <span className="cl-muted">—</span>
        )}
      </td>
      <td className="cl-numeric">{durationLabel}</td>
      <td>
        <Badge tone={STATUS_TONE[course.status] ?? "gray"}>{course.status}</Badge>
      </td>
      <td>
        <div className="cl-row-actions" style={{ position: "relative" }}>
          {course.status === "Draft" && (
            <button
              type="button"
              className="dash-icon-btn"
              title="Publish"
              disabled={disabled}
              onClick={() => onStatusChange(course, "Published")}
            >
              <Icon name="play" size={15} />
            </button>
          )}
          {course.status === "Published" && (
            <button
              type="button"
              className="dash-icon-btn"
              title="Archive"
              disabled={disabled}
              onClick={() => onStatusChange(course, "Archived")}
            >
              <Icon name="archive" size={15} />
            </button>
          )}
          <button
            type="button"
            className="dash-icon-btn"
            aria-label="More actions"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <Icon name="more" size={16} />
          </button>
          {menuOpen && (
            <RowMenu
              course={course}
              onClose={() => setMenuOpen(false)}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          )}
        </div>
      </td>
    </tr>
  );
}

function RowMenu({ course, onClose, onDelete, onStatusChange }) {
  useEffect(() => {
    function close(e) {
      if (!e.target.closest(".cl-row-menu")) onClose();
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [onClose]);

  return (
    <div className="cl-row-menu">
      {course.status !== "Published" && (
        <button type="button" onClick={() => { onStatusChange(course, "Published"); onClose(); }}>
          <Icon name="play" size={14} /> Publish
        </button>
      )}
      {course.status !== "Draft" && (
        <button type="button" onClick={() => { onStatusChange(course, "Draft"); onClose(); }}>
          <Icon name="edit" size={14} /> Set to Draft
        </button>
      )}
      {course.status !== "Archived" && (
        <button type="button" onClick={() => { onStatusChange(course, "Archived"); onClose(); }}>
          <Icon name="archive" size={14} /> Archive
        </button>
      )}
      {course.status === "Draft" && (
        <button type="button" className="cl-row-menu-danger" onClick={() => { onDelete(); onClose(); }}>
          <Icon name="trash" size={14} /> Delete
        </button>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, tone }) {
  return (
    <div className="cl-stat-card">
      <div className={`cl-stat-icon tone-${tone}`}>
        <Icon name={icon} size={20} />
      </div>
      <div className="cl-stat-text">
        <p className="cl-stat-label">{label}</p>
        <p className="cl-stat-value">{value}</p>
      </div>
    </div>
  );
}

function CourseTableSkeleton() {
  return (
    <table className="cl-table">
      <thead>
        <tr>
          <th>Course</th>
          <th>Category</th>
          <th>Level</th>
          <th>Duration</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 6 }).map((_, i) => (
          <tr key={i}>
            <td><Skeleton width="200px" height="16px" /></td>
            <td><Skeleton width="80px" height="16px" /></td>
            <td><Skeleton width="80px" height="16px" /></td>
            <td><Skeleton width="60px" height="16px" /></td>
            <td><Skeleton width="70px" height="16px" /></td>
            <td><Skeleton width="40px" height="16px" /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
