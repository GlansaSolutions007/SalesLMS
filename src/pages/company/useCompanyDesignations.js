import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getCompanyDesignations } from "../../services/api/companyApi.js";

// GET /companies/{company}/designations returns the full unpaginated
// list for that company, so search/status/sort here are client-side only.
export default function useCompanyDesignations(companyId) {
  const { token } = useAuth();

  const [designations, setDesignations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!companyId) {
      setDesignations([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError("");

    getCompanyDesignations(companyId, token)
      .then((items) => {
        if (cancelled) return;
        setDesignations(items);
      })
      .catch((err) => {
        if (cancelled) return;
        setDesignations([]);
        setError(err.message ?? "Could not load designations.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, token, refreshKey]);

  return { designations, isLoading, error, refetch: () => setRefreshKey((k) => k + 1) };
}
