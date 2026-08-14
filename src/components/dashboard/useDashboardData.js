import { useEffect, useState } from "react";
import { getDashboard } from "../../services/dashboardService.js";

export default function useDashboardData() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError("");

    getDashboard()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Could not load dashboard data.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  return { data, isLoading, error, retry: () => setRetryKey((k) => k + 1) };
}
