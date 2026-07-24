import "./DataTable.css";

export default function DataTable({
  columns,
  rows,
  idField = "id",
  selectable = false,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  isLoading,
  emptyMessage = "No records found.",
}) {
  if (isLoading) {
    return (
      <div className="dtable-state">
        <div className="dtable-spinner" />
        <p>Loading…</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="dtable-state">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const allSelected = selectable && rows.length > 0 && rows.every((r) => selectedIds.has(r[idField]));

  return (
    <div className="dtable-wrap">
      <table className="dtable">
        <thead>
          <tr>
            {selectable && (
              <th className="dtable-check-col">
                <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll} aria-label="Select all rows" />
              </th>
            )}
            {columns.map((col) => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[idField]}>
              {selectable && (
                <td className="dtable-check-col">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(row[idField])}
                    onChange={() => onToggleSelect(row[idField])}
                    aria-label={`Select row ${row[idField]}`}
                  />
                </td>
              )}
              {columns.map((col) => (
                <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
