import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getCompanyDesignations } from "../../services/api/companyApi.js";

// GET /companies/{company}/designations returns the full unpaginated
// list for that company, so search/status/sort here are client-side only.
//
// `allCompanies` is optional and only used when companyId is falsy (the
// Designations page's "All Companies" option): it fans out one request per
// company and merges the results, tagging each designation with its owning
// company, since the backend has no single all-companies designations
// endpoint. Every other caller passes just companyId and gets the original
// single-company behavior unchanged.
export default function useCompanyDesignations(companyId, allCompanies) {
  const { token } = useAuth();

  const [designations, setDesignations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (!companyId) {
      if (!allCompanies || allCompanies.length === 0) {
        setDesignations([]);
        return undefined;
      }

      setIsLoading(true);
      setError("");

      Promise.all(
        allCompanies.map((c) =>
          getCompanyDesignations(c.id, token)
            .then((items) => items.map((d) => ({ ...d, company: { id: c.id, company_name: c.company_name } })))
            .catch(() => [])
        )
      )
        .then((lists) => {
          if (cancelled) return;
          setDesignations(lists.flat());
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
  }, [companyId, allCompanies, token, refreshKey]);

  return { designations, isLoading, error, refetch: () => setRefreshKey((k) => k + 1) };
}
