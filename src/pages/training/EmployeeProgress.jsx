import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Icon from "../../components/Icon.jsx";
import DataTable from "../../components/DataTable.jsx";
import DataToolbar from "../../components/DataToolbar.jsx";
import Pagination from "../../components/Pagination.jsx";
import Modal from "../../components/Modal.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";
import TrainingSectionTabs from "./TrainingSectionTabs.jsx";
import useCompanyOptions from "../company/useCompanyOptions.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { getEmployeeProgress, getEmployeeProgressDetail, updateCourseAssignmentStatus } from "../../services/api/companyApi.js";
import { listAllCourses } from "../../services/courseService.js";
import "../company/CompanyList.css";

const STATUS_OPTIONS = ["Assigned", "In Progress", "Completed", "Expired"];

function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function ProgressDetailModal({ companyId, employee, onClose, onChanged }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getEmployeeProgressDetail(companyId, employee.id, token)
      .then(setData)
      .catch((err) => setError(err.message ?? "Could not load this employee's progress."))
      .finally(() => setLoading(false));
  }, [companyId, employee.id, token]);

  useEffect(() => { load(); }, [load]);

  async function handleStatusChange(assignment, status) {
    setUpdatingId(assignment.id);
    try {
      await updateCourseAssignmentStatus(companyId, assignment.id, status, token);
      load();
      onChanged();
    } catch {
      // surfaced implicitly by leaving the row unchanged; keep modal open
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <Modal title={`${employee.full_name} — Course Progress`} onClose={onClose} size="lg" footer={<button type="button" className="cl-btn" onClick={onClose}>Close</button>}>
      {loading && <p className="ep-empty-note">Loading…</p>}
      {error && <p className="rl-api-error">{error}</p>}
      {!loading && !error && data && (
        (data.assignments ?? []).length === 0 ? (
          <p className="ep-empty-note">No courses assigned to this employee yet.</p>
        ) : (
          <div className="dtable-wrap">
            <table className="dtable form-doc-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Batch</th>
                  <th>Assigned</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.assignments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.course?.course_name ?? "—"}</td>
                    <td>{a.batch?.batch_name ?? "—"}</td>
                    <td>{a.assigned_date ? String(a.assigned_date).slice(0, 10) : "—"}</td>
                    <td>{a.due_date ? String(a.due_date).slice(0, 10) : "—"}</td>
                    <td>
                      <select
                        className="form-doc-select"
                        value={a.status}
                        disabled={updatingId === a.id}
                        onChange={(e) => handleStatusChange(a, e.target.value)}
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </Modal>
  );
}

export default function EmployeeProgress() {
  const { toggleCollapsed } = useOutletContext();
  const { token, roleName, user } = useAuth();
  const isSuperAdmin = roleName === "Super Admin";

  const { options: companies, isLoading: companiesLoading, error: companiesError } = useCompanyOptions(isSuperAdmin);
  const [companyId, setCompanyId] = useState(() => (isSuperAdmin ? "" : String(user?.company?.id ?? "")));

  useEffect(() => {
    if (isSuperAdmin && !companyId && companies.length > 0) setCompanyId(String(companies[0].id));
  }, [isSuperAdmin, companies, companyId]);

  const [search, setSearch] = useState("");
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState([]);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, current_page: 1, last_page: 1, from: 0, to: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailTarget, setDetailTarget] = useState(null);

  useEffect(() => {
    listAllCourses().then(setCourses).catch(() => setCourses([]));
  }, []);

  const load = useCallback(() => {
    if (!companyId) { setItems([]); return; }
    setLoading(true);
    setError("");
    getEmployeeProgress(companyId, { search: search.trim() || undefined, course_id: courseId || undefined, page, per_page: 25 }, token)
      .then((result) => {
        setItems(result.items);
        setPagination(result.pagination);
      })
      .catch((err) => setError(err.message ?? "Could not load employee progress."))
      .finally(() => setLoading(false));
  }, [companyId, search, courseId, page, token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [companyId, search, courseId]);

  const columns = [
    {
      key: "full_name",
      header: "Employee",
      render: (r) => (
        <div className="emp-cell">
          <span className="emp-avatar">{initials(r.full_name)}</span>
          <div>
            <p className="emp-name">{r.full_name}</p>
            <p className="emp-code">{r.employee_code}</p>
          </div>
        </div>
      ),
    },
    { key: "assigned_count", header: "Assigned", render: (r) => r.assigned_count },
    { key: "in_progress_count", header: "In Progress", render: (r) => r.in_progress_count },
    { key: "completed_count", header: "Completed", render: (r) => r.completed_count },
    {
      key: "completion_rate",
      header: "Completion",
      render: (r) => (
        <div style={{ minWidth: 120 }}>
          <ProgressBar value={r.completion_rate} />
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <button type="button" className="dash-icon-btn" aria-label={`View ${r.full_name}'s progress`} title="View Details" onClick={() => setDetailTarget(r)}>
          <Icon name="eye" size={15} />
        </button>
      ),
    },
  ];

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Employee Progress</h1>
            <Breadcrumb current="Employee Progress" />
          </div>
        </div>

        <TrainingSectionTabs />

        <div className="panel cl-panel">
          {(isSuperAdmin || courses.length > 0) && (
            <div className="dt-toolbar" style={{ paddingBottom: 0 }}>
              {isSuperAdmin && (
                <select
                  className="dt-select"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  disabled={companiesLoading || companies.length === 0}
                  aria-label="Select company"
                >
                  {companies.length === 0 && <option value="">No companies found</option>}
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              )}
              <select
                className="dt-select"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                aria-label="Filter by course"
              >
                <option value="">All Courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.course_name}</option>
                ))}
              </select>
            </div>
          )}

          <DataToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search employees..."
          />

          {(error || companiesError) && <p className="cl-error">{error || companiesError}</p>}

          <DataTable
            columns={columns}
            rows={items}
            isLoading={loading || companiesLoading}
            emptyMessage={companyId ? "No employees found for this company." : "Select a company to view training progress."}
          />

          {!loading && companyId && (
            <div className="cl-footer">
              <p>
                Showing {pagination.from ?? 0}–{pagination.to ?? 0} of {pagination.total} employee{pagination.total === 1 ? "" : "s"}
              </p>
              <Pagination page={pagination.current_page} totalPages={pagination.last_page} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {detailTarget && (
        <ProgressDetailModal
          companyId={companyId}
          employee={detailTarget}
          onClose={() => setDetailTarget(null)}
          onChanged={load}
        />
      )}
    </>
  );
}
