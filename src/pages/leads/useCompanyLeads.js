import { useEffect, useState } from "react";
import { getCompanyLeads } from "../../services/api/leadsApi.js";

const DEFAULT_PAGINATION = { total: 0, per_page: 25, current_page: 1, last_page: 1, from: 0, to: 0 };

// GET /companies/{company}/leads paginates server-side, so it re-fetches
// whenever any param (search, filters, page) changes — mirrors
// employees/useCompanyEmployees.js.
export default function useCompanyLeads(companyId, params) {
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    if (!companyId) {
      setLeads([]);
      setPagination(DEFAULT_PAGINATION);
      return undefined;
    }

    let cancelled = false;
    setIsLoading(true);
    setError("");

    getCompanyLeads(companyId, params)
      .then((result) => {
        if (cancelled) return;
        setLeads(result.items);
        setPagination(result.pagination);
      })
      .catch((err) => {
        if (cancelled) return;
        setLeads([]);
        setError(err.message ?? "Could not load leads.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, paramsKey, refreshKey]);

  return { leads, pagination, isLoading, error, refetch: () => setRefreshKey((k) => k + 1) };
}
