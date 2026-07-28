import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getTrainers } from "../../services/api/trainersApi.js";

const PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 400;

export default function useTrainersList() {
  const { token } = useAuth();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sort, setSort] = useState({ key: "full_name", dir: "asc" });
  const [page, setPage] = useState(1);

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, per_page: PER_PAGE, current_page: 1, last_page: 1, from: 0, to: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, sort.key, sort.dir]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError("");

    const params = { per_page: PER_PAGE, page, sort: sort.key, dir: sort.dir };
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (statusFilter !== "All") params.status = statusFilter;

    getTrainers(params, token)
      .then((result) => {
        if (cancelled) return;
        setItems(result.items);
        setPagination(result.pagination);
      })
      .catch((err) => {
        if (cancelled) return;
        setItems([]);
        setError(err.message ?? "Could not load trainers.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, page, sort.key, sort.dir, statusFilter, debouncedSearch]);

  return {
    items,
    isLoading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sort,
    setSort,
    page: pagination.current_page,
    setPage,
    totalPages: Math.max(1, pagination.last_page),
    total: pagination.total,
    from: pagination.from,
    to: pagination.to,
  };
}
