import { useState, useEffect, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import Icon from "../../components/Icon.jsx";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Badge from "../../components/Badge.jsx";
import DataTable from "../../components/DataTable.jsx";
import DataToolbar from "../../components/DataToolbar.jsx";
import Pagination from "../../components/Pagination.jsx";
import Modal from "../../components/Modal.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import MastersTabs from "./MastersTabs.jsx";
import CertificateLivePreview from "../../components/CertificateLivePreview.jsx";
import { resolveApiAssetUrl } from "../../utils/apiAssetUrl.js";
import {
  listCertificateTemplates,
  deleteCertificateTemplate,
  duplicateCertificateTemplate,
  setDefaultCertificateTemplate,
} from "../../services/certificateTemplateService.js";
import { DetailField } from "../company/companyDisplay.jsx";
import { ROUTES, certificateTemplateEditPath } from "../../router/routePaths.js";
import "./SubscriptionPlanList.css";

const PAGE_SIZE = 10;
const STATUS_OPTIONS = ["All", "Active", "Inactive"];
const SEARCH_DEBOUNCE_MS = 400;
const DEFAULT_PAGINATION = { total: 0, per_page: PAGE_SIZE, current_page: 1, last_page: 1 };

function normalizeList(response) {
  const payload = response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function normalizePagination(response) {
  const payload = response?.data ?? response;
  return payload?.pagination ?? null;
}

function getStatusTone(status) {
  return String(status).toLowerCase() === "active" ? "green" : "gray";
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CertificateTemplateList() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  const [viewingRow, setViewingRow] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const params = {
        page,
        per_page: PAGE_SIZE,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(statusFilter !== "All" ? { status: statusFilter } : {}),
      };
      const res = await listCertificateTemplates(params);
      setTemplates(normalizeList(res));
      setPagination(normalizePagination(res) ?? DEFAULT_PAGINATION);
    } catch {
      setApiError("Could not load certificate templates. Please try again.");
      setTemplates([]);
      setPagination(DEFAULT_PAGINATION);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const pageItems = Array.isArray(templates) ? templates : [];
  const totalPages = Math.max(1, pagination.last_page || 1);

  async function handleDuplicate(row) {
    setBusyId(row.id);
    setApiError(null);
    try {
      await duplicateCertificateTemplate(row.id);
      fetchTemplates();
    } catch (err) {
      setApiError(err.message ?? "Could not duplicate this template.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleSetDefault(row) {
    setBusyId(row.id);
    setApiError(null);
    try {
      await setDefaultCertificateTemplate(row.id);
      fetchTemplates();
    } catch (err) {
      setApiError(err.message ?? "Could not set this template as Default.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    try {
      await deleteCertificateTemplate(deletingId);
      setDeletingId(null);
      fetchTemplates();
    } catch (err) {
      setApiError(err.message ?? "Could not delete this template.");
      setDeletingId(null);
    }
  }

  const columns = [
    {
      key: "template_name",
      header: "Template Name",
      render: (r) => <b style={{ color: "var(--color-heading)" }}>{r.template_name}</b>,
    },
    {
      key: "preview",
      header: "Preview",
      render: (r) =>
        r.background_image ? (
          <img
            src={resolveApiAssetUrl(r.background_image)}
            alt=""
            style={{ width: 48, height: 34, objectFit: "cover", borderRadius: 4, border: "1px solid var(--color-border)" }}
          />
        ) : (
          <span
            style={{
              display: "inline-block",
              width: 48,
              height: 34,
              borderRadius: 4,
              border: "1px dashed var(--color-border)",
              background: "var(--color-surface-alt, #f5f6f8)",
            }}
          />
        ),
    },
    {
      key: "orientation",
      header: "Orientation",
      render: (r) => <Badge tone="blue">{r.orientation || "—"}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge tone={getStatusTone(r.status)}>{r.status || "Unknown"}</Badge>,
    },
    {
      key: "is_default",
      header: "Default",
      render: (r) =>
        r.is_default ? (
          <Badge tone="green">
            <Icon name="star" size={12} /> Default
          </Badge>
        ) : (
          "—"
        ),
    },
    {
      key: "created_at",
      header: "Created Date",
      render: (r) => formatDate(r.created_at),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="cl-row-actions">
          <button type="button" className="dash-icon-btn" aria-label={`View ${row.template_name}`} onClick={() => setViewingRow(row)}>
            <Icon name="eye" size={15} />
          </button>
          <button
            type="button"
            className="dash-icon-btn"
            aria-label={`Edit ${row.template_name}`}
            onClick={() => navigate(certificateTemplateEditPath(row.id))}
          >
            <Icon name="edit" size={15} />
          </button>
          <button
            type="button"
            className="dash-icon-btn"
            aria-label={`Duplicate ${row.template_name}`}
            disabled={busyId === row.id}
            onClick={() => handleDuplicate(row)}
          >
            <Icon name="layers" size={15} />
          </button>
          {!row.is_default && (
            <button
              type="button"
              className="dash-icon-btn"
              aria-label={`Set ${row.template_name} as Default`}
              title="Set as Default"
              disabled={busyId === row.id}
              onClick={() => handleSetDefault(row)}
            >
              <Icon name="star" size={15} />
            </button>
          )}
          {!row.is_default && (
            <button type="button" className="dash-icon-btn" aria-label={`Delete ${row.template_name}`} onClick={() => setDeletingId(row.id)}>
              <Icon name="trash" size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Certificate Templates</h1>
            <Breadcrumb current="Certificate Templates" />
          </div>
        </div>

        <MastersTabs />

        <div className="panel cl-panel">
          <DataToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search templates..."
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            statusOptions={STATUS_OPTIONS}
            addLabel="Add New Template"
            onAdd={() => navigate(ROUTES.MASTERS_CERTIFICATE_TEMPLATES_ADD)}
          />

          {apiError && <p className="sp-api-error">{apiError}</p>}

          <DataTable columns={columns} rows={pageItems} isLoading={isLoading} emptyMessage="No certificate templates found." />

          {!isLoading && pagination.total > 0 && (
            <div className="cl-footer">
              <p>
                Showing {pageItems.length} of {pagination.total} templates
              </p>
              <Pagination page={pagination.current_page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {viewingRow && (
        <Modal title={viewingRow.template_name} onClose={() => setViewingRow(null)} size="lg" footer={
          <button type="button" className="cl-btn" onClick={() => setViewingRow(null)}>
            Close
          </button>
        }>
          <div className="detail-grid">
            <DetailField label="Template Name">{viewingRow.template_name}</DetailField>
            <DetailField label="Description">{viewingRow.description || "—"}</DetailField>
            <DetailField label="Orientation">{viewingRow.orientation}</DetailField>
            <DetailField label="Paper Size">{viewingRow.paper_size}</DetailField>
            <DetailField label="Status">
              <Badge tone={getStatusTone(viewingRow.status)}>{viewingRow.status}</Badge>
            </DetailField>
            <DetailField label="Default">{viewingRow.is_default ? "Yes" : "No"}</DetailField>
          </div>
          <div style={{ marginTop: 16 }}>
            <CertificateLivePreview
              orientation={viewingRow.orientation}
              paperSize={viewingRow.paper_size}
              backgroundImage={viewingRow.background_image}
              config={viewingRow.template_config}
            />
          </div>
        </Modal>
      )}

      {deletingId !== null && (
        <ConfirmDialog
          title="Delete Certificate Template"
          message="This will permanently remove this template. This action cannot be undone."
          onCancel={() => setDeletingId(null)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}
