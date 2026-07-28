import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import DataToolbar from "../../components/DataToolbar.jsx";
import DataTable from "../../components/DataTable.jsx";
import Badge from "../../components/Badge.jsx";
import Toast from "../../components/Toast.jsx";
import Icon from "../../components/Icon.jsx";
import CompanyTabs from "./CompanyTabs.jsx";
import useCompanyOptions from "./useCompanyOptions.js";
import useCompanyDesignations from "./useCompanyDesignations.js";
import DesignationFormModal from "./DesignationFormModal.jsx";
import { getCompanyDesignation } from "../../services/api/companyApi.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { companyDesignationViewPath } from "../../router/routePaths.js";
import { exportToCsv } from "../../utils/csv.js";
import "./CompanyList.css";

const STATUS_TONE = { active: "green", inactive: "gray" };
const STATUS_OPTIONS = ["All", "Active", "Inactive"];

const SORT_OPTIONS = [
  { key: "designation_name", label: "Name" },
  { key: "hierarchy_level", label: "Hierarchy Level" },
  { key: "employees_count", label: "Employees" },
];

const BASE_COLUMNS = [
  {
    key: "designation_name",
    header: "Designation",
    render: (r) => (
      <div>
        <p className="emp-name">{r.designation_name}</p>
        <p className="emp-code">{r.designation_code}</p>
      </div>
    ),
  },
  {
    key: "hierarchy_level",
    header: "Hierarchy Level",
    render: (r) => <span className="cl-numeric">{r.hierarchy_level ?? 0}</span>,
  },
  {
    key: "employees_count",
    header: "Employees",
    render: (r) => <span className="cl-numeric">{(r.employees_count ?? 0).toLocaleString()}</span>,
  },
  {
    key: "status",
    header: "Status",
    render: (r) => {
      const key = String(r.status ?? "").toLowerCase();
      return <Badge tone={STATUS_TONE[key] ?? "gray"}>{r.status || "—"}</Badge>;
    },
  },
];

function buildColumns(companyId, onEdit, editingRowId) {
  return [
    ...BASE_COLUMNS,
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="cl-row-actions">
          <Link to={companyDesignationViewPath(companyId, r.id)} className="dash-icon-btn" aria-label={`View ${r.designation_name}`}>
            <Icon name="eye" size={15} />
          </Link>
          <button
            type="button"
            className="dash-icon-btn"
            aria-label={`Edit ${r.designation_name}`}
            title="Edit"
            onClick={() => onEdit(r)}
            disabled={editingRowId === r.id}
          >
            <Icon name="edit" size={15} />
          </button>
        </div>
      ),
    },
  ];
}

export default function CompanyDesignations() {
  const { toggleCollapsed } = useOutletContext();
  const { token } = useAuth();
  const { options: companies, isLoading: companiesLoading, error: companiesError } = useCompanyOptions();
  const [companyId, setCompanyId] = useState("");

  useEffect(() => {
    if (!companyId && companies.length > 0) setCompanyId(String(companies[0].id));
  }, [companies, companyId]);

  const { designations, isLoading, error, refetch } = useCompanyDesignations(companyId);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sort, setSort] = useState({ key: "hierarchy_level", dir: "asc" });
  const [toastDismissed, setToastDismissed] = useState(false);
  const [toast, setToast] = useState(null);

  const [formModal, setFormModal] = useState(null); // { mode: "add" | "edit", designation } | null
  const [editingRowId, setEditingRowId] = useState(null);

  const activeError = companiesError || error;
  useEffect(() => {
    if (activeError) setToastDismissed(false);
  }, [activeError]);

  function openAdd() {
    setFormModal({ mode: "add", designation: null });
  }

  const openEdit = useCallback(
    async (row) => {
      setEditingRowId(row.id);
      try {
        const full = await getCompanyDesignation(companyId, row.id, token);
        setFormModal({
          mode: "edit",
          designationId: row.id,
          designation: {
            designation_name: full.designation_name ?? "",
            designation_code: full.designation_code ?? "",
            description: full.description ?? "",
            hierarchy_level: full.hierarchy_level != null ? String(full.hierarchy_level) : "",
          },
        });
      } catch (err) {
        setToast({ tone: "error", message: err.message ?? "Could not load this designation for editing." });
      } finally {
        setEditingRowId(null);
      }
    },
    [companyId, token]
  );

  function closeFormModal() {
    setFormModal(null);
  }

  function handleFormSuccess() {
    const wasEdit = formModal?.mode === "edit";
    closeFormModal();
    refetch();
    setToast({ tone: "success", message: wasEdit ? "Designation updated successfully." : "Designation created successfully." });
  }

  const rows = useMemo(() => {
    let list = designations;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((d) => [d.designation_name, d.designation_code].some((v) => String(v ?? "").toLowerCase().includes(q)));
    }

    if (statusFilter !== "All") {
      list = list.filter((d) => String(d.status ?? "").toLowerCase() === statusFilter.toLowerCase());
    }

    list = [...list].sort((a, b) => {
      const av = a[sort.key] ?? "";
      const bv = b[sort.key] ?? "";
      const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [designations, search, statusFilter, sort]);

  const columns = useMemo(() => buildColumns(companyId, openEdit, editingRowId), [companyId, editingRowId, openEdit]);

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Designations</h1>
            <Breadcrumb current="Designations" />
          </div>
        </div>

        <CompanyTabs />

        <div className="panel cl-panel">
          <div className="dt-toolbar" style={{ paddingBottom: 0 }}>
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
          </div>

          <DataToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search designations..."
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            statusOptions={STATUS_OPTIONS}
            sort={sort}
            onSortChange={setSort}
            sortOptions={SORT_OPTIONS}
            onExportCsv={() => exportToCsv("designations.csv", rows, BASE_COLUMNS)}
            onExportPdf={() => window.print()}
            addLabel="Add Designation"
            onAdd={companyId ? openAdd : undefined}
          />

          <DataTable
            columns={columns}
            rows={rows}
            isLoading={isLoading || companiesLoading}
            emptyMessage={companyId ? "No designations found for this company." : "Select a company to view its designations."}
          />

          {!isLoading && companyId && (
            <div className="cl-footer">
              <p>
                Showing {rows.length} of {designations.length} designation{designations.length === 1 ? "" : "s"}
              </p>
            </div>
          )}
        </div>
      </div>

      {formModal && (
        <DesignationFormModal
          mode={formModal.mode}
          companyId={companyId}
          designationId={formModal.designationId}
          initialValues={formModal.designation}
          onClose={closeFormModal}
          onSuccess={handleFormSuccess}
        />
      )}

      <Toast tone="error" message={!toastDismissed ? activeError : ""} onDismiss={() => setToastDismissed(true)} />
      {toast && <Toast tone={toast.tone} message={toast.message} onDismiss={() => setToast(null)} />}
    </>
  );
}
