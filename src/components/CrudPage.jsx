import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import Icon from "./Icon.jsx";
import Topbar from "./Topbar.jsx";
import Breadcrumb from "./Breadcrumb.jsx";
import DataToolbar from "./DataToolbar.jsx";
import DataTable from "./DataTable.jsx";
import Pagination from "./Pagination.jsx";
import Modal from "./Modal.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import FormField from "./FormField.jsx";
import useCrudTable from "../hooks/useCrudTable.js";
import { exportToCsv, parseCsv } from "../utils/csv.js";
import "./CrudPage.css";

function emptyFormValues(fields) {
  return Object.fromEntries(fields.map((f) => [f.key, f.type === "select" ? f.options[0] : ""]));
}

export default function CrudPage({
  title,
  breadcrumbLabel,
  entityLabel,
  seed,
  columns,
  searchFields,
  statusOptions,
  sortOptions,
  fields,
  subNav,
  extraRowAction,
}) {
  const { toggleCollapsed } = useOutletContext();
  const table = useCrudTable({ seed, searchFields });

  const [modalMode, setModalMode] = useState(null); // "add" | "edit" | null
  const [editingRow, setEditingRow] = useState(null);
  const [formValues, setFormValues] = useState(emptyFormValues(fields));
  const [formErrors, setFormErrors] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [confirmBulk, setConfirmBulk] = useState(false);

  function openAdd() {
    setFormValues(emptyFormValues(fields));
    setFormErrors({});
    setModalMode("add");
  }

  function openEdit(row) {
    setEditingRow(row);
    setFormValues(Object.fromEntries(fields.map((f) => [f.key, row[f.key]])));
    setFormErrors({});
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditingRow(null);
  }

  function validate() {
    const errors = {};
    fields.forEach((f) => {
      if (f.required && !String(formValues[f.key] ?? "").trim()) {
        errors[f.key] = `${f.label} is required.`;
      }
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const payload = { ...formValues };
    fields.forEach((f) => {
      if (f.type === "number") payload[f.key] = Number(payload[f.key]) || 0;
    });

    if (modalMode === "add") {
      table.addItem({ ...payload, status: payload.status || statusOptions[1] });
    } else if (modalMode === "edit") {
      table.updateItem(editingRow.id, payload);
    }
    closeModal();
  }

  function handleImport(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCsv(String(reader.result));
      if (rows.length) table.importRows(rows);
    };
    reader.readAsText(file);
  }

  const tableColumns = [
    ...columns,
    {
      key: "actions",
      header: "",
      render: (row) => {
        const rowLabel = row.name ?? row.title ?? row.employeeName ?? entityLabel;
        return (
          <div className="cl-row-actions">
            {extraRowAction?.(row)}
            <button type="button" className="dash-icon-btn" aria-label={`Edit ${rowLabel}`} onClick={() => openEdit(row)}>
              <Icon name="edit" size={15} />
            </button>
            <button type="button" className="dash-icon-btn" aria-label={`Delete ${rowLabel}`} onClick={() => setDeletingId(row.id)}>
              <Icon name="trash" size={15} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <Topbar
        onMenuClick={toggleCollapsed}
        searchPlaceholder="Search..."
        notifications={3}
        messages={5}
        user={{ name: "John Smith", role: "Sales Manager", initials: "JS" }}
      />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>{title}</h1>
            <Breadcrumb current={breadcrumbLabel} />
          </div>
        </div>

        {subNav}

        <div className="panel cl-panel">
          <DataToolbar
            search={table.search}
            onSearchChange={table.setSearch}
            searchPlaceholder={`Search ${entityLabel.toLowerCase()}s...`}
            statusFilter={table.statusFilter}
            onStatusFilterChange={table.setStatusFilter}
            statusOptions={statusOptions}
            sort={table.sort}
            onSortChange={table.setSort}
            sortOptions={sortOptions}
            addLabel={`Add New ${entityLabel}`}
            onAdd={openAdd}
            selectedCount={table.selectedIds.size}
            onBulkDelete={() => setConfirmBulk(true)}
            onExportCsv={() => exportToCsv(`${entityLabel.toLowerCase()}s.csv`, table.pageItems, columns)}
            onExportPdf={() => window.print()}
            onImportCsv={handleImport}
          />

          <DataTable
            columns={tableColumns}
            rows={table.pageItems}
            selectable
            selectedIds={table.selectedIds}
            onToggleSelect={table.toggleSelect}
            onToggleSelectAll={table.toggleSelectAll}
            isLoading={table.isLoading}
            emptyMessage={`No ${entityLabel.toLowerCase()}s match your search.`}
          />

          {!table.isLoading && table.filteredCount > 0 && (
            <div className="cl-footer">
              <p>
                Showing {table.pageItems.length} of {table.filteredCount} {entityLabel.toLowerCase()}s
              </p>
              <Pagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
            </div>
          )}
        </div>
      </div>

      {modalMode && (
        <Modal
          title={`${modalMode === "add" ? "Add New" : "Edit"} ${entityLabel}`}
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="cl-btn" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" form="crud-form" className="dash-primary-btn cl-add-btn">
                {modalMode === "add" ? "Add" : "Save Changes"}
              </button>
            </>
          }
        >
          <form id="crud-form" onSubmit={handleSubmit}>
            {fields.map((f) => (
              <FormField key={f.key} label={f.label} error={formErrors[f.key]}>
                {f.type === "select" ? (
                  <select
                    value={formValues[f.key]}
                    onChange={(e) => setFormValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  >
                    {f.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea
                    rows={3}
                    value={formValues[f.key]}
                    onChange={(e) => setFormValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                ) : (
                  <input
                    type={f.type === "number" ? "number" : "text"}
                    value={formValues[f.key]}
                    onChange={(e) => setFormValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                )}
              </FormField>
            ))}
          </form>
        </Modal>
      )}

      {deletingId !== null && (
        <ConfirmDialog
          title={`Delete ${entityLabel}`}
          message={`This will permanently remove this ${entityLabel.toLowerCase()}. This action cannot be undone.`}
          onCancel={() => setDeletingId(null)}
          onConfirm={() => {
            table.deleteItem(deletingId);
            setDeletingId(null);
          }}
        />
      )}

      {confirmBulk && (
        <ConfirmDialog
          title={`Delete ${table.selectedIds.size} ${entityLabel}s`}
          message="This will permanently remove all selected rows. This action cannot be undone."
          onCancel={() => setConfirmBulk(false)}
          onConfirm={() => {
            table.bulkDelete();
            setConfirmBulk(false);
          }}
        />
      )}
    </>
  );
}
