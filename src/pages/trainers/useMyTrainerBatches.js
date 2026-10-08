import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getMyTrainerBatches } from "../../services/api/trainersApi.js";

const DEFAULT_PAGINATION = { total: 0, per_page: 25, current_page: 1, last_page: 1, from: 0, to: 0 };

// GET /trainer/batches — the logged-in Trainer's own batches across every
// company (see getMyTrainerBatches for why this can't be the company-scoped
// batches endpoint). Paginates server-side, so re-fetches whenever any
// param (status, sort, page) changes.
//
// `enabled` lets callers skip the fetch entirely for roles other than
// Trainer, so a shared list page doesn't fire this request on every render.
export default function useMyTrainerBatches(params, enabled = true) {
  const { token } = useAuth();

  const [batches, setBatches] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    if (!enabled) {
      setBatches([]);
      setPagination(DEFAULT_PAGINATION);
      return undefined;
    }

    let cancelled = false;
    setIsLoading(true);
    setError("");

    getMyTrainerBatches(params, token)
      .then((result) => {
        if (cancelled) return;
        setBatches(result.items);
        setPagination(result.pagination);
      })
      .catch((err) => {
        if (cancelled) return;
        setBatches([]);
        setError(err.message ?? "Could not load your batches.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, token, paramsKey, refreshKey]);

  return { batches, pagination, isLoading, error, refetch: () => setRefreshKey((k) => k + 1) };
}
