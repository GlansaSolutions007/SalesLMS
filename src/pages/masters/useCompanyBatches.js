import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getCompanyBatches } from "../../services/api/companyApi.js";

const DEFAULT_PAGINATION = { total: 0, per_page: 25, current_page: 1, last_page: 1, from: 0, to: 0 };

// GET /companies/{company}/batches paginates server-side (and supports
// sort/dir, unlike course-assignments), so this re-fetches whenever
// companyId or any param (search, status, sort, page) changes.
export default function useCompanyBatches(companyId, params) {
  const { token } = useAuth();

  const [batches, setBatches] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    if (!companyId) {
      setBatches([]);
      setPagination(DEFAULT_PAGINATION);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError("");

    getCompanyBatches(companyId, params, token)
      .then((result) => {
        if (cancelled) return;
        setBatches(result.items);
        setPagination(result.pagination);
      })
      .catch((err) => {
        if (cancelled) return;
        setBatches([]);
        setError(err.message ?? "Could not load batches.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, token, paramsKey, refreshKey]);

  return { batches, pagination, isLoading, error, refetch: () => setRefreshKey((k) => k + 1) };
}
