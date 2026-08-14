import { useEffect, useState } from "react";
import { getCompanyTargets } from "../../services/api/targetsApi.js";

const DEFAULT_PAGINATION = { total: 0, per_page: 25, current_page: 1, last_page: 1, from: 0, to: 0 };

export default function useCompanyTargets(companyId, params) {
  const [targets, setTargets] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    if (!companyId) {
      setTargets([]);
      setPagination(DEFAULT_PAGINATION);
      return undefined;
    }

    let cancelled = false;
    setIsLoading(true);
    setError("");

    getCompanyTargets(companyId, params)
      .then((result) => {
        if (cancelled) return;
        setTargets(result.items);
        setPagination(result.pagination);
      })
      .catch((err) => {
        if (cancelled) return;
        setTargets([]);
        setError(err.message ?? "Could not load targets.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, paramsKey, refreshKey]);

  return { targets, pagination, isLoading, error, refetch: () => setRefreshKey((k) => k + 1) };
}
