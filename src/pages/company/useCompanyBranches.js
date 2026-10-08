import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getCompanyBranches } from "../../services/api/companyApi.js";

// GET /companies/{company}/branches returns the full unpaginated list
// for that company, so search/status/sort here are client-side only.
//
// `allCompanies` is optional and only used when companyId is falsy (the
// Branches page's "All Companies" option): it fans out one request per
// company and merges the results, tagging each branch with its owning
// company, since the backend has no single all-companies branches endpoint.
// Every other caller passes just companyId and gets the original
// single-company behavior unchanged.
export default function useCompanyBranches(companyId, allCompanies) {
  const { token } = useAuth();

  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (!companyId) {
      if (!allCompanies || allCompanies.length === 0) {
        setBranches([]);
        return undefined;
      }

      setIsLoading(true);
      setError("");

      Promise.all(
        allCompanies.map((c) =>
          getCompanyBranches(c.id, token)
            .then((items) => items.map((b) => ({ ...b, company: { id: c.id, company_name: c.company_name } })))
            .catch(() => [])
        )
      )
        .then((lists) => {
          if (cancelled) return;
          setBranches(lists.flat());
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }

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
  }, [companyId, allCompanies, token, refreshKey]);

  return { branches, isLoading, error, refetch: () => setRefreshKey((k) => k + 1) };
}
