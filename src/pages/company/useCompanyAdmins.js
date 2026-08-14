import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getCompanyAdmins } from "../../services/api/companyApi.js";

export default function useCompanyAdmins(companyId) {
  const { token } = useAuth();

  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!companyId) {
      setAdmins([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError("");

    getCompanyAdmins(companyId, token)
      .then((items) => {
        if (cancelled) return;
        setAdmins(items);
      })
      .catch((err) => {
        if (cancelled) return;
        setAdmins([]);
        setError(err.message ?? "Could not load admins.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, token, refreshKey]);

  return { admins, isLoading, error, refetch: () => setRefreshKey((k) => k + 1) };
}
