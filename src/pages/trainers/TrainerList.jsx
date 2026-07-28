import { useNavigate } from "react-router-dom";
import Badge from "../../components/Badge.jsx";
import Icon from "../../components/Icon.jsx";
import DataToolbar from "../../components/DataToolbar.jsx";
import DataTable from "../../components/DataTable.jsx";
import Pagination from "../../components/Pagination.jsx";
import { exportToCsv } from "../../utils/csv.js";
import TrainerTabs from "./TrainerTabs.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import useTrainersList from "./useTrainerList.js";
import { ROUTES } from "../../router/routePaths.js";

const STATUS_TONE = { Active: "green", Inactive: "gray" };

function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function TrainerList() {
  const navigate = useNavigate();
  const table = useTrainersList();

  const COLUMNS = [
    {
      key: "full_name",
      header: "Trainer",
      render: (r) => (
        <div className="emp-cell">
          <span className="emp-avatar">{initials(r.full_name)}</span>
          <div>
            <p className="emp-name">{r.full_name}</p>
            <p className="emp-code">{r.trainer_code}</p>
          </div>
        </div>
      ),
    },
    { key: "specialization", header: "Specialization" },
    { key: "experience_years", header: "Exp (Yrs)" },
    { key: "email", header: "Email" },
    { key: "mobile", header: "Mobile" },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge tone={STATUS_TONE[r.status] ?? "gray"}>{r.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <button
          type="button"
          className="fa-outline-btn"
          onClick={(e) => {
            e.stopPropagation();
            navigate(ROUTES.TRAINER_PROFILE, { state: { trainerId: r.id } });
          }}
        >
          <Icon name="eye" size={14} />
          View
        </button>
      ),
    },
  ];

  const STATUS_OPTIONS = ["All", "Active", "Inactive"];
  const SORT_OPTIONS = [
    { key: "full_name", label: "Name" },
    { key: "trainer_code", label: "Code" },
    { key: "specialization", label: "Specialization" },
    { key: "experience_years", label: "Experience" },
    { key: "joining_date", label: "Joining Date" },
    { key: "status", label: "Status" },
  ];

  return (
    <div className="cl-body">
      <div className="cl-header">
        <div>
          <h1>Trainers</h1>
          <Breadcrumb current="All Trainers" />
        </div>
      </div>

      <TrainerTabs />

      <div className="panel cl-panel">
        <DataToolbar
          search={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Search trainers..."
          statusFilter={table.statusFilter}
          onStatusFilterChange={table.setStatusFilter}
          statusOptions={STATUS_OPTIONS}
          sort={table.sort}
          onSortChange={table.setSort}
          sortOptions={SORT_OPTIONS}
          addLabel="Add Trainer"
          onAdd={() => navigate(ROUTES.TRAINER_ADD)}
          onExportCsv={() =>
            exportToCsv(
              "trainers.csv",
              table.items,
              COLUMNS.filter((c) => c.key !== "actions"),
            )
          }
          onExportPdf={() => window.print()}
        />

        {table.error && <p className="cl-error">{table.error}</p>}

        <DataTable
          columns={COLUMNS}
          rows={table.items}
          isLoading={table.isLoading}
          emptyMessage="No trainers match your search."
        />

        {!table.isLoading && table.total > 0 && (
          <div className="cl-footer">
            <p>
              Showing {table.from}–{table.to} of {table.total} trainers
            </p>
            <Pagination
              page={table.page}
              totalPages={table.totalPages}
              onPageChange={table.setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
