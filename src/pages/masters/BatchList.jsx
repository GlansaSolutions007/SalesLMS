import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import DataToolbar from "../../components/DataToolbar.jsx";
import DataTable from "../../components/DataTable.jsx";
import Pagination from "../../components/Pagination.jsx";
import Badge from "../../components/Badge.jsx";
import Toast from "../../components/Toast.jsx";
import Icon from "../../components/Icon.jsx";
import TrainingSectionTabs from "../training/TrainingSectionTabs.jsx";
import useCompanyOptions from "../company/useCompanyOptions.js";
import useCompanyBatches from "./useCompanyBatches.js";
import useMyTrainerBatches from "../trainers/useMyTrainerBatches.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { ROUTES, batchEditPath } from "../../router/routePaths.js";
import { exportToCsv } from "../../utils/csv.js";
import "../company/CompanyList.css";

const STATUS_OPTIONS = ["Upcoming", "Ongoing", "Completed", "Cancelled"];
const STATUS_FILTER_OPTIONS = ["All", ...STATUS_OPTIONS];
const STATUS_TONE = { Upcoming: "blue", Ongoing: "orange", Completed: "green", Cancelled: "red" };
const UNEDITABLE_STATUSES = new Set(["Completed", "Cancelled"]);

const SORT_OPTIONS = [
  { key: "batch_name", label: "Batch Name" },
  { key: "start_date", label: "Start Date" },
  { key: "end_date", label: "End Date" },
  { key: "status", label: "Status" },
];

function formatDate(value) {
  return value ? String(value).slice(0, 10) : "—";
}

function buildColumns(companyId, navigate, showCompanyColumn, hideActions) {
  return [
    {
      key: "batch_name",
      header: "Batch",
      render: (r) => (
        <div>
          <p className="emp-name">{r.batch_name}</p>
          <p className="emp-code">{r.batch_code}</p>
        </div>
      ),
    },
    ...(showCompanyColumn ? [{ key: "company", header: "Company", render: (r) => r.company?.company_name || "—" }] : []),
    { key: "trainer", header: "Trainer", render: (r) => r.trainer?.full_name || "Unassigned" },
    { key: "start_date", header: "Start Date", render: (r) => formatDate(r.start_date) },
    { key: "end_date", header: "End Date", render: (r) => formatDate(r.end_date) },
    {
      key: "enrolled",
      header: "Enrolled",
      render: (r) => (
        <span className="cl-numeric">
          {r.batch_employees_count ?? 0}
          {r.max_strength ? ` / ${r.max_strength}` : ""}
        </span>
      ),
    },
    { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status] ?? "gray"}>{r.status}</Badge> },
    // A Trainer's own account has no company_id, so BatchController's
    // authorizeAccess() would 403 them out of editing any batch here —
    // hide the action instead of offering a button that can only fail.
    ...(hideActions
      ? []
      : [
          {
            key: "actions",
            header: "",
            render: (r) => {
              const locked = UNEDITABLE_STATUSES.has(r.status);
              const rowCompanyId = r.company?.id ?? companyId;
              return (
                <div className="cl-row-actions">
                  <button
                    type="button"
                    className="dash-icon-btn"
                    aria-label={`Edit ${r.batch_name}`}
                    title={locked ? `A ${r.status} batch cannot be edited.` : "Edit"}
                    disabled={locked}
                    onClick={() => navigate(batchEditPath(rowCompanyId, r.id))}
                  >
                    <Icon name="edit" size={15} />
                  </button>
                </div>
              );
            },
          },
        ]),
  ];
}

const CSV_COLUMNS = [
  { key: "batch_name", header: "Batch Name" },
  { key: "batch_code", header: "Batch Code" },
  { key: "trainerName", header: "Trainer" },
  { key: "start_date", header: "Start Date" },
  { key: "end_date", header: "End Date" },
  { key: "status", header: "Status" },
];
const CSV_COLUMNS_WITH_COMPANY = [
  CSV_COLUMNS[0],
  CSV_COLUMNS[1],
  { key: "companyName", header: "Company" },
  ...CSV_COLUMNS.slice(2),
];

function toCsvRow(r) {
  return {
    batch_name: r.batch_name ?? "",
    batch_code: r.batch_code ?? "",
    companyName: r.company?.company_name ?? "",
    trainerName: r.trainer?.full_name ?? "",
    start_date: formatDate(r.start_date),
    end_date: formatDate(r.end_date),
    status: r.status ?? "",
  };
}

export default function BatchList() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { roleName, user } = useAuth();
  const isSuperAdmin = roleName === "Super Admin";
  // A Trainer's own user account has no company_id (a Trainer is a global
  // roster entry that can be assigned to batches in any company — see
  // useMyTrainerBatches), so they can't use the company-scoped batches
  // endpoint at all; this page fetches their own batches by trainer_id,
  // across every company, instead.
  const isTrainer = roleName === "Trainer";
  // Creating a batch is Super-Admin-only (spec: Training Management —
  // Company Admin). Written as "not Company Admin" rather than "is Super
  // Admin" so it doesn't change what a Trainer sees here — this page is
  // also reachable by Trainer, whose own access is unrelated to this change.
  const canManageBatches = roleName !== "Company Admin";

  const { options: companies, isLoading: companiesLoading, error: companiesError } = useCompanyOptions(isSuperAdmin);
  // "" is the default for Super Admin and means "All Companies", not "none picked yet".
  const [companyId, setCompanyId] = useState(() => (isSuperAdmin ? "" : String(user?.company?.id ?? "")));
  const isAllSelected = isSuperAdmin && !companyId;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sort, setSort] = useState({ key: "start_date", dir: "desc" });
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [companyId, search, statusFilter, sort.key, sort.dir]);

  const sharedParams = {
    search: search.trim() || undefined,
    status: statusFilter !== "All" ? statusFilter : undefined,
    sort: sort.key,
    dir: sort.dir,
    page,
    per_page: 25,
  };

  const {
    batches: companyBatches,
    pagination: companyPagination,
    isLoading: companyBatchesLoading,
    error: companyBatchesError,
  } = useCompanyBatches(companyId, sharedParams, isAllSelected ? companies : undefined);

  const {
    batches: myBatches,
    pagination: myPagination,
    isLoading: myBatchesLoading,
    error: myBatchesError,
  } = useMyTrainerBatches(sharedParams, isTrainer);

  const batches = isTrainer ? myBatches : companyBatches;
  const pagination = isTrainer ? myPagination : companyPagination;
  const isLoading = isTrainer ? myBatchesLoading : companyBatchesLoading;
  const error = isTrainer ? myBatchesError : companyBatchesError;

  const [toastDismissed, setToastDismissed] = useState(false);
  const activeError = companiesError || error;
  useEffect(() => {
    if (activeError) setToastDismissed(false);
  }, [activeError]);

  const showCompanyColumn = isAllSelected || isTrainer;
  const columns = buildColumns(companyId, navigate, showCompanyColumn, isTrainer);

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Batches</h1>
            <Breadcrumb current="Batches" />
          </div>
        </div>

        <TrainingSectionTabs />

        <div className="panel cl-panel">
          {isSuperAdmin && (
            <div className="dt-toolbar" style={{ paddingBottom: 0 }}>
              <select
                className="dt-select"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                disabled={companiesLoading || companies.length === 0}
                aria-label="Select company"
              >
                {companies.length === 0 && <option value="">No companies found</option>}
                {companies.length > 0 && <option value="">All Companies</option>}
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <DataToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by batch name or code..."
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            statusOptions={STATUS_FILTER_OPTIONS}
            sort={sort}
            onSortChange={setSort}
            sortOptions={SORT_OPTIONS}
            onExportCsv={() => exportToCsv("batches.csv", batches.map(toCsvRow), showCompanyColumn ? CSV_COLUMNS_WITH_COMPANY : CSV_COLUMNS)}
            onExportPdf={() => window.print()}
            addLabel={canManageBatches ? "Add New Batch" : undefined}
            // Super Admin gets no location.state.companyId — BatchForm's
            // showCompanyDropdown only renders its Company picker when that
            // state is absent, letting the Super Admin choose the target
            // company there instead of always inheriting whichever company
            // happens to be selected on this list page.
            onAdd={
              canManageBatches && (companyId || isAllSelected)
                ? () => navigate(ROUTES.BATCHES_ADD, isSuperAdmin ? undefined : { state: { companyId } })
                : undefined
            }
          />

          <DataTable
            columns={columns}
            rows={batches}
            isLoading={isLoading || companiesLoading}
            emptyMessage={
              isTrainer
                ? "You have no assigned batches."
                : isAllSelected
                ? "No batches found."
                : companyId
                ? "No batches found for this company."
                : "Select a company to view its batches."
            }
          />

          {!isLoading && (companyId || isAllSelected || isTrainer) && (
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
