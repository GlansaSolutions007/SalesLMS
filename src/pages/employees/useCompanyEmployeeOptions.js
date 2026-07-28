import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getCompanyEmployees } from "../../services/api/companyApi.js";

// Lightweight active-employee list for "Reporting Manager" pickers — asks
// the (paginated) employees API for one large page rather than introducing
// a separate unpaginated endpoint.
export default function useCompanyEmployeeOptions(companyId, excludeEmployeeId) {
  const { token } = useAuth();
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!companyId) {
      setOptions([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getCompanyEmployees(companyId, { per_page: 100, sort: "full_name", dir: "asc", status: "Active" }, token)
      .then((result) => {
        if (cancelled) return;
        const excludeId = excludeEmployeeId ? Number(excludeEmployeeId) : null;
        setOptions(result.items.filter((e) => e.id !== excludeId));
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, token, excludeEmployeeId]);

  return { options, isLoading };
}
