import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getCompanyEmployees } from "../../services/api/companyApi.js";

const DEFAULT_PAGINATION = { total: 0, per_page: 25, current_page: 1, last_page: 1, from: 0, to: 0 };

// GET /companies/{company}/employees paginates server-side, so unlike
// useCompanyBranches/useCompanyDepartments this hook re-fetches whenever any
// param (search, filters, sort, page) changes instead of filtering in-memory.
//
// `allCompanies` is optional and only used when companyId is falsy (the
// Employees page's "All Companies" option): since the backend has no single
// all-companies employees endpoint, it fans out one request per company
// (pulling a large page so each company's results are effectively
// unpaginated), tags each employee with its owning company, merges and
// re-sorts the combined list, then paginates it client-side using
// params.page/per_page. branch_id/department_id are company-scoped ids that
// don't mean anything across companies, so they're dropped from the
// per-company requests in this mode.
export default function useCompanyEmployees(companyId, params, allCompanies) {
  const { token } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;

    if (!companyId) {
      if (!allCompanies || allCompanies.length === 0) {
        setEmployees([]);
        setPagination(DEFAULT_PAGINATION);
        return undefined;
      }

      setIsLoading(true);
      setError("");

      const { branch_id, department_id, page = 1, per_page = 25, sort, dir, ...rest } = params ?? {};

      Promise.all(
        allCompanies.map((c) =>
          getCompanyEmployees(c.id, { ...rest, sort, dir, per_page: 1000, page: 1 }, token)
            .then((result) => result.items.map((e) => ({ ...e, company: { id: c.id, company_name: c.company_name } })))
            .catch(() => [])
        )
      )
        .then((lists) => {
          if (cancelled) return;
          let merged = lists.flat();

          if (sort) {
            merged = [...merged].sort((a, b) => {
              const av = a[sort] ?? "";
              const bv = b[sort] ?? "";
              const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
              return dir === "desc" ? -cmp : cmp;
            });
          }

          const total = merged.length;
          const lastPage = Math.max(1, Math.ceil(total / per_page));
          const currentPage = Math.min(page, lastPage);
          const start = (currentPage - 1) * per_page;
          const pageItems = merged.slice(start, start + per_page);

          setEmployees(pageItems);
          setPagination({
            total,
            per_page,
            current_page: currentPage,
            last_page: lastPage,
            from: total === 0 ? 0 : start + 1,
            to: Math.min(start + per_page, total),
          });
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

    getCompanyEmployees(companyId, params, token)
      .then((result) => {
        if (cancelled) return;
        setEmployees(result.items);
        setPagination(result.pagination);
      })
      .catch((err) => {
        if (cancelled) return;
        setEmployees([]);
        setError(err.message ?? "Could not load employees.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, allCompanies, token, paramsKey, refreshKey]);

  return { employees, pagination, isLoading, error, refetch: () => setRefreshKey((k) => k + 1) };
}
