import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getCompanyDepartments } from "../../services/api/companyApi.js";

// GET /companies/{company}/departments returns the full unpaginated
// list for that company, so search/status/sort here are client-side only.
export default function useCompanyDepartments(companyId) {
  const { token } = useAuth();

  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!companyId) {
      setDepartments([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError("");

    getCompanyDepartments(companyId, token)
      .then((items) => {
        if (cancelled) return;
        setDepartments(items);
      })
      .catch((err) => {
        if (cancelled) return;
        setDepartments([]);
        setError(err.message ?? "Could not load departments.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, token, refreshKey]);

  return { departments, isLoading, error, refetch: () => setRefreshKey((k) => k + 1) };
}
