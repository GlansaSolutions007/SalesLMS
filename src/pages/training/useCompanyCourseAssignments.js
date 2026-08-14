import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getCourseAssignments } from "../../services/api/companyApi.js";

const DEFAULT_PAGINATION = { total: 0, per_page: 25, current_page: 1, last_page: 1, from: 0, to: 0 };

// GET /companies/{company}/course-assignments paginates server-side, so this
// re-fetches whenever companyId or any param (search, status, page) changes
// instead of filtering in-memory.
export default function useCompanyCourseAssignments(companyId, params) {
  const { token } = useAuth();

  const [assignments, setAssignments] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    if (!companyId) {
      setAssignments([]);
      setPagination(DEFAULT_PAGINATION);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError("");

    getCourseAssignments(companyId, params, token)
      .then((result) => {
        if (cancelled) return;
        setAssignments(result.items);
        setPagination(result.pagination);
      })
      .catch((err) => {
        if (cancelled) return;
        setAssignments([]);
        setError(err.message ?? "Could not load course assignments.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, token, paramsKey, refreshKey]);

  return { assignments, pagination, isLoading, error, refetch: () => setRefreshKey((k) => k + 1) };
}
