import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getCompanyAdmins } from "../../services/api/companyApi.js";

// `allCompanies` is optional and only used when companyId is falsy (the
// Admins page's "All Companies" option): it fans out one request per company
// and merges the results, tagging each admin with its owning company, since
// the backend has no single all-companies admins endpoint.
export default function useCompanyAdmins(companyId, allCompanies) {
  const { token } = useAuth();

  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (!companyId) {
      if (!allCompanies || allCompanies.length === 0) {
        setAdmins([]);
        return undefined;
      }

      setIsLoading(true);
      setError("");

      Promise.all(
        allCompanies.map((c) =>
          getCompanyAdmins(c.id, token)
            .then((items) => items.map((a) => ({ ...a, company: { id: c.id, company_name: c.company_name } })))
            .catch(() => [])
        )
      )
        .then((lists) => {
          if (cancelled) return;
          setAdmins(lists.flat());
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
  }, [companyId, allCompanies, token, refreshKey]);

  return { admins, isLoading, error, refetch: () => setRefreshKey((k) => k + 1) };
}
