import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Icon from "../../components/Icon.jsx";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Badge from "../../components/Badge.jsx";
import DataToolbar from "../../components/DataToolbar.jsx";
import DataTable from "../../components/DataTable.jsx";
import Pagination from "../../components/Pagination.jsx";
import Modal from "../../components/Modal.jsx";
import FormField from "../../components/FormField.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import Toast from "../../components/Toast.jsx";
import TrainingTabs from "../../components/TrainingTabs.jsx";
import "./training.css";
import {
  listCategoriesPaginated,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory,
} from "../../services/courseService.js";

const STATUS_TONE = { Active: "green", Inactive: "gray" };
const STATUS_OPTIONS = ["All", "Active", "Inactive"];
const SORT_OPTIONS = [
  { key: "category_name", label: "Name" },
  { key: "created_at", label: "Created" },
];

const EMPTY_FORM = { category_name: "", description: "", status: "Active" };

export default function CourseCategories() {
  const { toggleCollapsed } = useOutletContext();

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, current_page: 1, last_page: 1, from: 1, to: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sort, setSort] = useState({ key: "category_name", dir: "asc" });
  const [page, setPage] = useState(1);

  const [modalMode, setModalMode] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [deletingRow, setDeletingRow] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, per_page: 25, sort: sort.key, dir: sort.dir };
      if (statusFilter !== "All") params.status = statusFilter;
      if (search) params.search = search;
      const result = await listCategoriesPaginated(params);
      setItems(result.items);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message ?? "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, sort, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalMode("add");
  }

  function openEdit(row) {
    setEditingRow(row);
    setForm({ category_name: row.category_name, description: row.description ?? "", status: row.status });
    setFormErrors({});
    setModalMode("edit");
  }

  function closeModal() { setModalMode(null); setEditingRow(null); }

  function validate() {
    const errors = {};
    if (!form.category_name.trim()) errors.category_name = "Category name is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = { category_name: form.category_name.trim(), description: form.description.trim() || null, status: form.status };
      if (modalMode === "add") {
        await createCategory(payload);
        setToast({ tone: "success", message: "Category created." });
      } else {
        await updateCategory(editingRow.id, payload);
        setToast({ tone: "success", message: "Category updated." });
      }
      closeModal();
      load();
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(row) {
    const next = row.status === "Active" ? "Inactive" : "Active";
    setActionLoading(true);
    try {
      await toggleCategoryStatus(row.id, next);
      setToast({ tone: "success", message: `Category set to ${next}.` });
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
      await deleteCategory(deletingRow.id);
      setToast({ tone: "success", message: "Category deleted." });
      setDeletingRow(null);
      load();
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not delete category." });
      setDeletingRow(null);
    } finally {
      setActionLoading(false);
    }
  }

  const columns = [
    { key: "category_name", header: "Category Name", render: (r) => <strong>{r.category_name}</strong> },
    { key: "description", header: "Description", render: (r) => <span className="tc-muted">{r.description || "—"}</span> },
    { key: "courses_count", header: "Courses", render: (r) => r.courses_count ?? 0 },
    {
      key: "status", header: "Status",
      render: (r) => (
        <button type="button" className="tc-status-btn" disabled={actionLoading} onClick={() => handleToggleStatus(r)}>
          <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
        </button>
      ),
    },
    {
      key: "actions", header: "",
      render: (r) => (
        <div className="cl-row-actions">
          <button type="button" className="dash-icon-btn" title="Edit" onClick={() => openEdit(r)}>
            <Icon name="edit" size={15} />
          </button>
          <button type="button" className="dash-icon-btn" title="Delete" disabled={actionLoading} onClick={() => setDeletingRow(r)}>
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
            <h1>Course Categories</h1>
            <Breadcrumb current="Categories" />
          </div>
        </div>

        <TrainingTabs />

        <div className="panel cl-panel">
          <DataToolbar
            search={searchInput}
            onSearchChange={(v) => { setSearchInput(v); }}
            searchPlaceholder="Search categories..."
            statusFilter={statusFilter}
            onStatusFilterChange={(v) => { setStatusFilter(v); setPage(1); }}
            statusOptions={STATUS_OPTIONS}
            sort={sort}
            onSortChange={setSort}
            sortOptions={SORT_OPTIONS}
            addLabel="Add New Category"
            onAdd={openAdd}
          />

          {error ? (
            <div className="cl-error">
              <Icon name="warning" size={18} /><span>{error}</span>
              <button type="button" className="cl-btn" onClick={load}>Retry</button>
            </div>
          ) : (
            <DataTable columns={columns} rows={items} isLoading={loading} emptyMessage="No categories found." />
          )}

          {!loading && !error && pagination.total > 0 && (
            <div className="cl-footer">
              <p>Showing {pagination.from}–{pagination.to} of {pagination.total} categories</p>
              <Pagination page={pagination.current_page} totalPages={pagination.last_page} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {modalMode && (
        <Modal
          title={modalMode === "add" ? "Add New Category" : "Edit Category"}
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="cl-btn" onClick={closeModal} disabled={submitting}>Cancel</button>
              <button type="submit" form="cat-form" className="dash-primary-btn cl-add-btn" disabled={submitting}>
                {submitting ? "Saving…" : modalMode === "add" ? "Add Category" : "Save Changes"}
              </button>
            </>
          }
        >
          <form id="cat-form" onSubmit={handleSubmit}>
            <FormField label="Category Name *" error={formErrors.category_name}>
              <input
                type="text"
                value={form.category_name}
                onChange={(e) => setForm((f) => ({ ...f, category_name: e.target.value }))}
                placeholder="e.g. Sales Skills"
              />
            </FormField>
            <FormField label="Description">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional description..."
              />
            </FormField>
            <FormField label="Status">
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </FormField>
          </form>
        </Modal>
      )}

      {deletingRow && (
        <ConfirmDialog
          title="Delete Category"
          message={`"${deletingRow.category_name}" will be permanently deleted. Categories with assigned courses cannot be deleted.`}
          confirmLabel="Delete"
          onCancel={() => setDeletingRow(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />
    </>
  );
}
