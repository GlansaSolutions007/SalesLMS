import { useCallback, useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import DataTable from "../../components/DataTable.jsx";
import DataToolbar from "../../components/DataToolbar.jsx";
import Pagination from "../../components/Pagination.jsx";
import Badge from "../../components/Badge.jsx";
import Icon from "../../components/Icon.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import Toast from "../../components/Toast.jsx";
import TrainingTabs from "../../components/TrainingTabs.jsx";
import { listAssessments, updateAssessmentStatus, deleteAssessment } from "../../services/courseService.js";
import { assessmentAttemptsPath } from "../../router/routePaths.js";

const STATUS_TONE = { Draft: "gray", Published: "green", Archived: "orange" };
const STATUS_OPTIONS = ["All", "Draft", "Published", "Archived"];
const SORT_OPTIONS = [
  { key: "assessment_title", label: "Title" },
  { key: "created_at", label: "Created" },
];

export default function AssessmentsList() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, current_page: 1, last_page: 1, from: 1, to: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sort, setSort] = useState({ key: "created_at", dir: "desc" });
  const [page, setPage] = useState(1);

  const [actionLoading, setActionLoading] = useState(false);
  const [deletingRow, setDeletingRow] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, per_page: 25, sort: sort.key, dir: sort.dir };
      if (statusFilter !== "All") params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const result = await listAssessments(params);
      setItems(result.items);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message ?? "Could not load assessments.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, sort]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  async function handleStatusChange(row, status) {
    setActionLoading(true);
    try {
      await updateAssessmentStatus(row.id, status);
      setToast({ tone: "success", message: `Assessment set to ${status}.` });
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
      await deleteAssessment(deletingRow.id);
      setToast({ tone: "success", message: "Assessment deleted." });
      setDeletingRow(null);
      load();
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
    { key: "course", header: "Course", render: (r) => r.course?.course_name ?? "—" },
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
            <h1>Assessments</h1>
            <Breadcrumb current="Assessments" />
          </div>
        </div>

        <TrainingTabs />

        <div className="panel cl-panel">
          <DataToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search assessments..."
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            statusOptions={STATUS_OPTIONS}
            sort={sort}
            onSortChange={setSort}
            sortOptions={SORT_OPTIONS}
          />

          {error && <p className="cl-error">{error}</p>}

          <DataTable columns={columns} rows={items} isLoading={loading} emptyMessage="No assessments found. Assessments are created from within the Course wizard, either as a course's Final Assessment or attached to an individual lesson." />

          {!loading && (
            <div className="cl-footer">
              <p>
                Showing {pagination.from ?? 0}–{pagination.to ?? 0} of {pagination.total} assessment{pagination.total === 1 ? "" : "s"}
              </p>
              <Pagination page={pagination.current_page} totalPages={pagination.last_page} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {deletingRow && (
        <ConfirmDialog
          title="Delete Assessment"
          message={`"${deletingRow.assessment_title}" will be permanently deleted.`}
          confirmLabel={actionLoading ? "Deleting…" : "Delete"}
          onCancel={() => setDeletingRow(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />
    </>
  );
}
