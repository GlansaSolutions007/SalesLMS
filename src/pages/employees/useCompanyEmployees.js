import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getCompanyEmployees } from "../../services/api/companyApi.js";

const DEFAULT_PAGINATION = { total: 0, per_page: 25, current_page: 1, last_page: 1, from: 0, to: 0 };

// GET /companies/{company}/employees paginates server-side, so unlike
// useCompanyBranches/useCompanyDepartments this hook re-fetches whenever any
// param (search, filters, sort, page) changes instead of filtering in-memory.
export default function useCompanyEmployees(companyId, params) {
  const { token } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    if (!companyId) {
      setEmployees([]);
      setPagination(DEFAULT_PAGINATION);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError("");

    getCompanyEmployees(companyId, params, token)
      .then((result) => {
        if (cancelled) return;
        setEmployees(result.items);
        setPagination(result.pagination);
      })
      .catch((err) => {
        if (cancelled) return;
        setEmployees([]);
        setError(err.message ?? "Could not load employees.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, token, paramsKey, refreshKey]);

  return { employees, pagination, isLoading, error, refetch: () => setRefreshKey((k) => k + 1) };
}
