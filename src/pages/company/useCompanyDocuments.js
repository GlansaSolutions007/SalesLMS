import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getCompanyDocuments } from "../../services/api/companyApi.js";

// `allCompanies` is optional and only used when companyId is falsy (the
// Documents page's "All Companies" option): it fans out one request per
// company and merges the results, tagging each document with its owning
// company, since the backend has no single all-companies documents endpoint.
export default function useCompanyDocuments(companyId, allCompanies) {
  const { token } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (!companyId) {
      if (!allCompanies || allCompanies.length === 0) {
        setDocuments([]);
        return undefined;
      }

      setIsLoading(true);
      setError("");

      Promise.all(
        allCompanies.map((c) =>
          getCompanyDocuments(c.id, token)
            .then((items) => items.map((d) => ({ ...d, company: { id: c.id, company_name: c.company_name } })))
            .catch(() => [])
        )
      )
        .then((lists) => {
          if (cancelled) return;
          setDocuments(lists.flat());
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
  }, [companyId, allCompanies, token, refreshKey]);

  return { documents, isLoading, error, refetch: () => setRefreshKey((k) => k + 1) };
}
