import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getCompanies } from "../../services/api/companyApi.js";

// Lightweight { id, company_name } list for company-picker dropdowns (e.g.
// Branches/Departments/Designations, which are scoped to one company at a
// time). Not paginated — fetches enough rows in one shot for a select box.
//
// `enabled` lets callers skip the fetch entirely — the companies list
// endpoint is Super Admin only, so a Company Admin (already locked to their
// own company) should never call it.
export default function useCompanyOptions(enabled = true) {
  const { token } = useAuth();
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) {
      setOptions([]);
      setIsLoading(false);
      setError("");
      return undefined;
    }

    let cancelled = false;
    setIsLoading(true);
    setError("");

    getCompanies({ per_page: 100, sort: "company_name", dir: "asc" }, token)
      .then((result) => {
        if (cancelled) return;
        setOptions(result.items.map((c) => ({ id: c.id, company_name: c.company_name })));
      })
      .catch((err) => {
        if (cancelled) return;
        setOptions([]);
        setError(err.message ?? "Could not load companies.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, token]);

  return { options, isLoading, error };
}
