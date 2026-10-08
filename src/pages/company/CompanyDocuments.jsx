import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import DataTable from "../../components/DataTable.jsx";
import Badge from "../../components/Badge.jsx";
import Toast from "../../components/Toast.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import Icon from "../../components/Icon.jsx";
import Modal from "../../components/Modal.jsx";
import FormField from "../../components/FormField.jsx";
import DocumentUploader from "../../components/DocumentUploader.jsx";
import CompanyTabs from "./CompanyTabs.jsx";
import useCompanyOptions from "./useCompanyOptions.js";
import useCompanyDocuments from "./useCompanyDocuments.js";
import { createCompanyDocument, verifyCompanyDocument, deleteCompanyDocument, ApiValidationError } from "../../services/api/companyApi.js";
import { resolveApiAssetUrl } from "../../utils/apiAssetUrl.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "./CompanyList.css";

const DOCUMENT_TYPES = ["Registration Certificate", "GST Certificate", "PAN Card", "Address Proof", "Contract", "Other"];
const VERIFY_TONE = { Pending: "orange", Verified: "green", Rejected: "red" };

function emptyUploadForm(companyId) {
  return { company_id: String(companyId ?? ""), document_type: DOCUMENT_TYPES[0], document_name: "", expiry_date: "", file: null, fileName: "" };
}

export default function CompanyDocuments() {
  const { toggleCollapsed } = useOutletContext();
  const { token, roleName, user } = useAuth();
  const isSuperAdmin = roleName === "Super Admin";
  const { options: companies, isLoading: companiesLoading, error: companiesError } = useCompanyOptions(isSuperAdmin);
  // "" is the default for Super Admin and means "All Companies", not "none picked yet".
  const [companyId, setCompanyId] = useState(() => (isSuperAdmin ? "" : String(user?.company?.id ?? "")));
  const isAllSelected = isSuperAdmin && !companyId;

  const { documents, isLoading, error, refetch } = useCompanyDocuments(companyId, isAllSelected ? companies : undefined);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState(emptyUploadForm);
  const [uploadErrors, setUploadErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  const [verifyTarget, setVerifyTarget] = useState(null); // { document, decision }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [toastDismissed, setToastDismissed] = useState(false);

  const activeError = companiesError || error;
  useEffect(() => {
    if (activeError) setToastDismissed(false);
  }, [activeError]);

  function openUpload() {
    setUploadForm(emptyUploadForm(companyId));
    setUploadErrors({});
    setUploadOpen(true);
  }

  async function handleUpload(e) {
    e.preventDefault();
    const errors = {};
    if (isSuperAdmin && !uploadForm.company_id) errors.company_id = "Company is required.";
    if (!uploadForm.document_name.trim()) errors.document_name = "Document name is required.";
    if (!uploadForm.file) errors.file = "Please attach a file.";
    if (Object.keys(errors).length) {
      setUploadErrors(errors);
      return;
    }

    const targetCompanyId = isSuperAdmin ? uploadForm.company_id : companyId;

    const fd = new FormData();
    fd.append("document_type", uploadForm.document_type);
    fd.append("document_name", uploadForm.document_name.trim());
    if (uploadForm.expiry_date) fd.append("expiry_date", uploadForm.expiry_date);
    fd.append("file", uploadForm.file);

    setUploading(true);
    setUploadErrors({});
    try {
      await createCompanyDocument(targetCompanyId, fd, token);
      setUploadOpen(false);
      if (targetCompanyId && targetCompanyId !== companyId) {
        // Document was uploaded under a different company than the page's
        // current filter — switch to it so the new document is visible;
        // useCompanyDocuments refetches on companyId change.
        setCompanyId(String(targetCompanyId));
      } else {
        refetch();
      }
      setToast({ tone: "success", message: "Document uploaded successfully." });
    } catch (err) {
      if (err instanceof ApiValidationError) {
        const fieldErrors = {};
        Object.entries(err.errors ?? {}).forEach(([field, messages]) => {
          fieldErrors[field] = Array.isArray(messages) ? messages[0] : messages;
        });
        setUploadErrors(fieldErrors);
      } else {
        setUploadErrors({ _api: err.message ?? "Could not upload this document." });
      }
    } finally {
      setUploading(false);
    }
  }

  async function confirmVerify() {
    if (!verifyTarget) return;
    setActionLoading(true);
    try {
      await verifyCompanyDocument(verifyTarget.document.company?.id ?? companyId, verifyTarget.document.id, { verification_status: verifyTarget.decision }, token);
      setVerifyTarget(null);
      refetch();
      setToast({ tone: "success", message: `Document marked as ${verifyTarget.decision}.` });
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not update verification status." });
    } finally {
      setActionLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await deleteCompanyDocument(deleteTarget.company?.id ?? companyId, deleteTarget.id, token);
      setDeleteTarget(null);
      refetch();
      setToast({ tone: "success", message: "Document deleted." });
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not delete this document." });
    } finally {
      setActionLoading(false);
    }
  }

  const columns = [
    { key: "document_name", header: "Document", render: (r) => <b>{r.document_name}</b> },
    ...(isAllSelected ? [{ key: "company", header: "Company", render: (r) => r.company?.company_name || "—" }] : []),
    { key: "document_type", header: "Type" },
    { key: "expiry_date", header: "Expiry", render: (r) => (r.expiry_date ? String(r.expiry_date).slice(0, 10) : "—") },
    { key: "uploaded_by", header: "Uploaded By", render: (r) => r.uploaded_by?.name ?? "—" },
    {
      key: "verification_status",
      header: "Status",
      render: (r) => <Badge tone={VERIFY_TONE[r.verification_status] ?? "gray"}>{r.verification_status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="cl-row-actions">
          <a href={resolveApiAssetUrl(r.file_path)} target="_blank" rel="noreferrer" className="dash-icon-btn" aria-label={`Download ${r.document_name}`}>
            <Icon name="download" size={15} />
          </a>
          {r.verification_status === "Pending" && (
            <>
              <button type="button" className="dash-icon-btn" aria-label="Verify" title="Verify" onClick={() => setVerifyTarget({ document: r, decision: "Verified" })}>
                <Icon name="check" size={15} />
              </button>
              <button type="button" className="dash-icon-btn" aria-label="Reject" title="Reject" onClick={() => setVerifyTarget({ document: r, decision: "Rejected" })}>
                <Icon name="close" size={15} />
              </button>
            </>
          )}
          <button type="button" className="dash-icon-btn" aria-label={`Delete ${r.document_name}`} title="Delete" onClick={() => setDeleteTarget(r)}>
            <Icon name="trash" size={15} />
          </button>
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
            <h1>Company Documents</h1>
            <Breadcrumb current="Documents" />
          </div>
        </div>

        <CompanyTabs />

        <div className="panel cl-panel">
          <div className="dt-toolbar" style={{ paddingBottom: 0 }}>
            {isSuperAdmin && (
              <select
                className="dt-select"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                disabled={companiesLoading || companies.length === 0}
                aria-label="Select company"
              >
                {companies.length === 0 && <option value="">No companies found</option>}
                {companies.length > 0 && <option value="">All Companies</option>}
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            )}

            <button type="button" className="dash-primary-btn cl-add-btn" onClick={openUpload} style={{ marginLeft: "auto" }}>
              <Icon name="upload" size={15} />
              Upload Document
            </button>
          </div>

          <DataTable
            columns={columns}
            rows={documents}
            isLoading={isLoading || companiesLoading}
            emptyMessage={isAllSelected ? "No documents found." : companyId ? "No documents uploaded for this company." : "Select a company to view its documents."}
          />

          {!isLoading && (companyId || isAllSelected) && (
            <div className="cl-footer">
              <p>Showing {documents.length} document{documents.length === 1 ? "" : "s"}</p>
            </div>
          )}
        </div>
      </div>

      {uploadOpen && (
        <Modal
          title="Upload Document"
          onClose={() => setUploadOpen(false)}
          footer={
            <>
              <button type="button" className="cl-btn" onClick={() => setUploadOpen(false)}>
                Cancel
              </button>
              <button type="submit" form="doc-upload-form" className="dash-primary-btn cl-add-btn" disabled={uploading}>
                {uploading ? "Uploading…" : "Upload"}
              </button>
            </>
          }
        >
          <form id="doc-upload-form" onSubmit={handleUpload}>
            {uploadErrors._api && <p className="rl-api-error">{uploadErrors._api}</p>}

            {isSuperAdmin && (
              <FormField label="Company *" error={uploadErrors.company_id}>
                <select value={uploadForm.company_id} onChange={(e) => setUploadForm((f) => ({ ...f, company_id: e.target.value }))}>
                  <option value="">Select a company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            <FormField label="Document Type">
              <select value={uploadForm.document_type} onChange={(e) => setUploadForm((f) => ({ ...f, document_type: e.target.value }))}>
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Document Name *" error={uploadErrors.document_name}>
              <input
                type="text"
                value={uploadForm.document_name}
                onChange={(e) => setUploadForm((f) => ({ ...f, document_name: e.target.value }))}
                placeholder="e.g. GST Registration Certificate"
              />
            </FormField>

            <FormField label="Expiry Date (optional)" error={uploadErrors.expiry_date}>
              <input type="date" value={uploadForm.expiry_date} onChange={(e) => setUploadForm((f) => ({ ...f, expiry_date: e.target.value }))} />
            </FormField>

            <FormField label="File *" error={uploadErrors.file}>
              <DocumentUploader
                fileName={uploadForm.fileName}
                onSelect={(file) => setUploadForm((f) => ({ ...f, file, fileName: file.name }))}
                onRemove={() => setUploadForm((f) => ({ ...f, file: null, fileName: "" }))}
              />
            </FormField>
          </form>
        </Modal>
      )}

      {verifyTarget && (
        <ConfirmDialog
          title={verifyTarget.decision === "Verified" ? "Verify Document" : "Reject Document"}
          message={`Mark "${verifyTarget.document.document_name}" as ${verifyTarget.decision}?`}
          confirmLabel={actionLoading ? "Saving…" : verifyTarget.decision}
          onCancel={() => setVerifyTarget(null)}
          onConfirm={confirmVerify}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Document"
          message={`"${deleteTarget.document_name}" will be permanently deleted.`}
          confirmLabel={actionLoading ? "Deleting…" : "Delete"}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}

      <Toast tone="error" message={!toastDismissed ? activeError : ""} onDismiss={() => setToastDismissed(true)} />
      {toast && <Toast tone={toast.tone} message={toast.message} onDismiss={() => setToast(null)} />}
    </>
  );
}
