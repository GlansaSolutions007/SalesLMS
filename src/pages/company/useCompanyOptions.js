import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getCompanies } from "../../services/api/companyApi.js";

// Lightweight { id, company_name } list for company-picker dropdowns (e.g.
// Branches/Departments/Designations, which are scoped to one company at a
// time). Not paginated — fetches enough rows in one shot for a select box.
export default function useCompanyOptions() {
  const { token } = useAuth();
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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
  }, [token]);

  return { options, isLoading, error };
}
