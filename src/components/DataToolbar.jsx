import { useRef } from "react";
import Icon from "./Icon.jsx";
import "./DataToolbar.css";

export default function DataToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  statusFilter,
  onStatusFilterChange,
  statusOptions = [],
  sort,
  onSortChange,
  sortOptions = [],
  addLabel,
  onAdd,
  selectedCount = 0,
  onBulkDelete,
  onExportCsv,
  onExportPdf,
  onImportCsv,
}) {
  const fileInputRef = useRef(null);

  function handleImportChange(e) {
    const file = e.target.files?.[0];
    if (file) onImportCsv?.(file);
    e.target.value = "";
  }

  if (selectedCount > 0) {
    return (
      <div className="dt-toolbar dt-bulk-bar">
        <span>{selectedCount} selected</span>
        <button type="button" className="cl-btn dt-danger" onClick={onBulkDelete}>
          <Icon name="warning" size={15} />
          Delete Selected
        </button>
      </div>
    );
  }

  return (
    <div className="dt-toolbar">
      <div className="cl-search dt-search">
        <Icon name="search" size={16} />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {statusOptions.length > 0 && (
        <select className="dt-select" value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)}>
          {statusOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt === "All" ? "All Status" : opt}
            </option>
          ))}
        </select>
      )}

      {sortOptions.length > 0 && (
        <select
          className="dt-select"
          value={sort.key}
          onChange={(e) => onSortChange({ ...sort, key: e.target.value })}
        >
          {sortOptions.map((opt) => (
            <option key={opt.key} value={opt.key}>
              Sort: {opt.label}
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        className="cl-btn"
        onClick={() => onSortChange({ ...sort, dir: sort.dir === "asc" ? "desc" : "asc" })}
        title={sort.dir === "asc" ? "Ascending" : "Descending"}
      >
        <Icon name="sort" size={16} />
        {sort.dir === "asc" ? "Asc" : "Desc"}
      </button>

      <div className="dt-spacer" />

      <button type="button" className="cl-btn" onClick={onExportCsv}>
        <Icon name="download" size={15} />
        Export Excel
      </button>

      <button type="button" className="cl-btn" onClick={onExportPdf}>
        <Icon name="download" size={15} />
        Export PDF
      </button>

      <button type="button" className="cl-btn" onClick={() => fileInputRef.current?.click()}>
        <Icon name="download" size={15} style={{ transform: "rotate(180deg)" }} />
        Import Excel
      </button>
      <input ref={fileInputRef} type="file" accept=".csv" hidden onChange={handleImportChange} />

      <button type="button" className="dash-primary-btn cl-add-btn" onClick={onAdd}>
        <Icon name="plus" size={16} />
        {addLabel}
      </button>
    </div>
  );
}
