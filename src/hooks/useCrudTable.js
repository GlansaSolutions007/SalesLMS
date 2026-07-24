import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 8;

export default function useCrudTable({ seed, searchFields, idField = "id" }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sort, setSort] = useState({ key: searchFields[0], dir: "asc" });
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(seed);
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let rows = items;

    if (statusFilter !== "All") {
      rows = rows.filter((row) => row.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((row) => searchFields.some((f) => String(row[f] ?? "").toLowerCase().includes(q)));
    }

    const sorted = [...rows].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === "asc" ? cmp : -cmp;
    });

    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, search, statusFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function addItem(data) {
    setItems((prev) => [{ ...data, [idField]: Date.now() }, ...prev]);
  }

  function updateItem(id, data) {
    setItems((prev) => prev.map((row) => (row[idField] === id ? { ...row, ...data } : row)));
  }

  function deleteItem(id) {
    setItems((prev) => prev.filter((row) => row[idField] !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function bulkDelete() {
    setItems((prev) => prev.filter((row) => !selectedIds.has(row[idField])));
    setSelectedIds(new Set());
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.size === pageItems.length ? new Set() : new Set(pageItems.map((r) => r[idField]))));
  }

  function importRows(rows) {
    setItems((prev) => [...rows.map((r) => ({ ...r, [idField]: Date.now() + Math.random() })), ...prev]);
  }

  return {
    items,
    isLoading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sort,
    setSort,
    page: safePage,
    setPage,
    totalPages,
    pageItems,
    filteredCount: filtered.length,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    addItem,
    updateItem,
    deleteItem,
    bulkDelete,
    importRows,
  };
}
