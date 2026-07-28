import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getCompanyBranches } from "../../services/api/companyApi.js";

// GET /companies/{company}/branches returns the full unpaginated list
// for that company, so search/status/sort here are client-side only.
export default function useCompanyBranches(companyId) {
  const { token } = useAuth();

  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!companyId) {
      setBranches([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError("");

    getCompanyBranches(companyId, token)
      .then((items) => {
        if (cancelled) return;
        setBranches(items);
      })
      .catch((err) => {
        if (cancelled) return;
        setBranches([]);
        setError(err.message ?? "Could not load branches.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, token, refreshKey]);

  return { branches, isLoading, error, refetch: () => setRefreshKey((k) => k + 1) };
}
