import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getCompanyDocuments } from "../../services/api/companyApi.js";

export default function useCompanyDocuments(companyId) {
  const { token } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!companyId) {
      setDocuments([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError("");

    getCompanyDocuments(companyId, token)
      .then((items) => {
        if (cancelled) return;
        setDocuments(items);
      })
      .catch((err) => {
        if (cancelled) return;
        setDocuments([]);
        setError(err.message ?? "Could not load documents.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, token, refreshKey]);

  return { documents, isLoading, error, refetch: () => setRefreshKey((k) => k + 1) };
}
