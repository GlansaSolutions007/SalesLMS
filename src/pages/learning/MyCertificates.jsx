import { useEffect, useState, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Icon from "../../components/Icon.jsx";
import Badge from "../../components/Badge.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import DataToolbar from "../../components/DataToolbar.jsx";
import Pagination from "../../components/Pagination.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getMyCertificates } from "../../services/certificateService.js";
import { myCertificateViewPath, ROUTES } from "../../router/routePaths.js";
import { resolveApiAssetUrl } from "../../utils/apiAssetUrl.js";
import "../CourseList.css";

const STATUS_TONE = { Valid: "green", Expired: "orange", Revoked: "red" };
const STATUS_OPTIONS = ["All", "Active"];
const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 400;
const DEFAULT_PAGINATION = { total: 0, per_page: PAGE_SIZE, current_page: 1, last_page: 1 };

function formatDate(value) {
  if (!value) return "—";
  return String(value).slice(0, 10);
}

export default function MyCertificates() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { user } = useAuth();
  const companyId = user?.company?.id;

  const [certificates, setCertificates] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [page, setPage] = useState(1);

  // Filter option lists — derived once from the employee's own full,
  // unfiltered certificate set (via the same list endpoint's all=1 escape
  // hatch already used elsewhere in this app, e.g. CourseCategoryController)
  // rather than a separate categories API, since an employee only ever
  // needs to filter by categories/years that could appear among THEIR OWN
  // certificates — no new endpoint required.
  const [years, setYears] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!companyId) return;
    getMyCertificates(companyId, { all: 1 })
      .then((all) => {
        const list = Array.isArray(all) ? all : [];
        const uniqueYears = [...new Set(list.map((c) => String(c.issue_date).slice(0, 4)).filter(Boolean))].sort().reverse();
        const uniqueCategories = [
          ...new Map(list.filter((c) => c.course?.category).map((c) => [c.course.category.id, c.course.category])).values(),
        ];
        setYears(uniqueYears);
        setCategories(uniqueCategories);
      })
      .catch(() => {
        // Filter options are a nice-to-have — a failure here shouldn't
        // block the main (paginated) list load below.
      });
  }, [companyId]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, yearFilter, categoryFilter]);

  const fetchCertificates = useCallback(() => {
    if (!companyId) return;
    setStatus("loading");
    getMyCertificates(companyId, {
      page,
      per_page: PAGE_SIZE,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(statusFilter !== "All" ? { status: statusFilter } : {}),
      ...(yearFilter !== "All" ? { year: yearFilter } : {}),
      ...(categoryFilter !== "All" ? { category_id: categoryFilter } : {}),
    })
      .then((res) => {
        setCertificates(res?.data ?? []);
        setPagination(res?.pagination ?? DEFAULT_PAGINATION);
        setStatus("success");
      })
      .catch((err) => {
        setErrorMessage(err.message ?? "Could not load your certificates.");
        setStatus("error");
      });
  }, [companyId, page, debouncedSearch, statusFilter, yearFilter, categoryFilter]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const isFiltering = Boolean(debouncedSearch) || statusFilter !== "All" || yearFilter !== "All" || categoryFilter !== "All";
  const totalPages = Math.max(1, pagination.last_page || 1);

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>My Certificates</h1>
            <Breadcrumb current="My Certificates" />
          </div>
        </div>

        <div className="panel cl-panel">
          <DataToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by certificate number or course name..."
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            statusOptions={STATUS_OPTIONS}
          />

          {(years.length > 0 || categories.length > 0) && (
            <div className="dt-toolbar" style={{ paddingTop: 0 }}>
              {years.length > 0 && (
                <select className="dt-select" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                  <option value="All">All Years</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              )}
              {categories.length > 0 && (
                <select className="dt-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="All">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.category_name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {status === "loading" && (
            <div className="cl-stats" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={140} />)}
            </div>
          )}

          {status === "error" && (
            <div className="panel cv-state-panel">
              <Icon name="warning" size={28} />
              <h3>Couldn't load your certificates</h3>
              <p>{errorMessage}</p>
            </div>
          )}

          {status === "success" && certificates.length === 0 && !isFiltering && (
            <div className="panel cv-empty-inline" style={{ padding: 40, flexDirection: "column", gap: 12 }}>
              <Icon name="trophy" size={28} />
              <p>You haven't earned any certificates yet.</p>
              <button type="button" className="dash-primary-btn" onClick={() => navigate(ROUTES.MY_LEARNING)}>
                Go to My Learning
              </button>
            </div>
          )}

          {status === "success" && certificates.length === 0 && isFiltering && (
            <div className="panel cv-empty-inline" style={{ padding: 40 }}>
              <Icon name="search" size={28} />
              <p>No certificates match your search/filters.</p>
            </div>
          )}

          {status === "success" && certificates.length > 0 && (
            <>
              <div className="cl-stats" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                {certificates.map((c) => (
                  <div
                    key={c.id}
                    className="panel"
                    role="button"
                    tabIndex={0}
                    style={{ textAlign: "left", cursor: "pointer", padding: 18, display: "flex", flexDirection: "column", gap: 8 }}
                    onClick={() => navigate(myCertificateViewPath(c.id))}
                    onKeyDown={(e) => e.key === "Enter" && navigate(myCertificateViewPath(c.id))}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Icon name="trophy" size={22} filled />
                      <p className="cl-course-title" style={{ margin: 0 }}>{c.course?.course_name}</p>
                    </div>
                    <p className="cl-course-desc" style={{ margin: 0 }}>{c.certificate_no}</p>
                    {c.course?.category?.category_name && (
                      <span style={{ fontSize: 12, color: "var(--color-muted)" }}>
                        <Icon name="gridView" size={12} /> {c.course.category.category_name}
                      </span>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--color-muted)" }}>
                      <span>Completed {formatDate(c.completion_date)}</span>
                      <span>Issued {formatDate(c.issue_date)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                      <Badge tone={STATUS_TONE[c.verification_status] ?? "gray"}>{c.verification_status}</Badge>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <button type="button" className="cl-btn" onClick={(e) => { e.stopPropagation(); navigate(myCertificateViewPath(c.id)); }}>
                        <Icon name="eye" size={14} /> View
                      </button>
                      {c.certificate_file && (
                        <a
                          className="cl-btn"
                          href={resolveApiAssetUrl(c.certificate_file)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Icon name="download" size={14} /> Download
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {pagination.total > 0 && (
                <div className="cl-footer">
                  <p>Showing {certificates.length} of {pagination.total} certificates</p>
                  <Pagination page={pagination.current_page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
