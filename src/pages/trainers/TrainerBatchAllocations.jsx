import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import DataTable from "../../components/DataTable.jsx";
import Pagination from "../../components/Pagination.jsx";
import Badge from "../../components/Badge.jsx";
import Icon from "../../components/Icon.jsx";
import Toast from "../../components/Toast.jsx";
import TrainerTabs from "./TrainerTabs.jsx";
import useCompanyOptions from "../company/useCompanyOptions.js";
import useCompanyBatches from "../masters/useCompanyBatches.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { ROUTES, batchEditPath } from "../../router/routePaths.js";
import "../company/CompanyList.css";

const STATUS_TONE = { Upcoming: "blue", Ongoing: "orange", Completed: "green", Cancelled: "red" };
const STATUS_OPTIONS = ["All", "Upcoming", "Ongoing", "Completed", "Cancelled"];

function formatDate(value) {
  return value ? String(value).slice(0, 10) : "—";
}

export default function TrainerBatchAllocations() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { roleName, user } = useAuth();
  const isSuperAdmin = roleName === "Super Admin";

  const { options: companies, isLoading: companiesLoading, error: companiesError } = useCompanyOptions(isSuperAdmin);
  const [companyId, setCompanyId] = useState(() => (isSuperAdmin ? "" : String(user?.company?.id ?? "")));

  useEffect(() => {
    if (isSuperAdmin && !companyId && companies.length > 0) setCompanyId(String(companies[0].id));
  }, [isSuperAdmin, companies, companyId]);

  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [companyId, statusFilter]);

  const { batches, pagination, isLoading, error } = useCompanyBatches(companyId, {
    status: statusFilter !== "All" ? statusFilter : undefined,
    page,
    per_page: 25,
  });

  const activeError = companiesError || error;
  const [toastDismissed, setToastDismissed] = useState(false);
  useEffect(() => {
    if (activeError) setToastDismissed(false);
  }, [activeError]);

  const columns = [
    { key: "trainer", header: "Trainer", render: (r) => (r.trainer ? <b>{r.trainer.full_name}</b> : <span className="ep-empty-note">Unassigned</span>) },
    { key: "batch_name", header: "Batch", render: (r) => `${r.batch_name} (${r.batch_code})` },
    { key: "course", header: "Course", render: (r) => r.course?.course_name || "—" },
    { key: "start_date", header: "Start Date", render: (r) => formatDate(r.start_date) },
    { key: "end_date", header: "End Date", render: (r) => formatDate(r.end_date) },
    { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status] ?? "gray"}>{r.status}</Badge> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <button
          type="button"
          className="dash-icon-btn"
          aria-label={`Manage ${r.batch_name}`}
          title="Manage in Batches"
          onClick={() => navigate(batchEditPath(companyId, r.id))}
        >
          <Icon name="edit" size={15} />
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
            <h1>Batch Allocation</h1>
            <Breadcrumb current="Batch Allocation" />
          </div>
        </div>

        <TrainerTabs />

        <div className="panel cl-panel">
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
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            )}

            <select className="dt-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s === "All" ? "All Status" : s}</option>
              ))}
            </select>

            <button
              type="button"
              className="dash-primary-btn cl-add-btn"
              disabled={!companyId}
              onClick={() => navigate(ROUTES.BATCHES_ADD, { state: { companyId } })}
              style={{ marginLeft: "auto" }}
            >
              <Icon name="plus" size={15} />
              Add Batch
            </button>
          </div>

          <DataTable
            columns={columns}
            rows={batches}
            isLoading={isLoading || companiesLoading}
            emptyMessage={companyId ? "No batches found for this company." : "Select a company to view its batch allocations."}
          />

          {!isLoading && companyId && (
            <div className="cl-footer">
              <p>
                Showing {pagination.from ?? 0}–{pagination.to ?? 0} of {pagination.total} batch{pagination.total === 1 ? "" : "es"}
              </p>
              <Pagination page={pagination.current_page} totalPages={pagination.last_page} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      <Toast tone="error" message={!toastDismissed ? activeError : ""} onDismiss={() => setToastDismissed(true)} />
    </>
  );
}
