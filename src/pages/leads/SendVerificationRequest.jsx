import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import DataTable from "../../components/DataTable.jsx";
import Badge from "../../components/Badge.jsx";
import Icon from "../../components/Icon.jsx";
import Toast from "../../components/Toast.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
// Same reason MyAssignedLeads/FollowupsPage need this: the dt-toolbar/
// dt-select classes used below only come from this stylesheet.
import "../../components/DataToolbar.css";
import { useAuth } from "../../context/AuthContext.jsx";
import { getEligibleVerificationLeads, bulkSubmitVerificationRequests } from "../../services/api/leadsApi.js";

const STATUS_TONE = {
  new: "blue",
  assigned: "blue",
  contacted: "orange",
  "follow-up": "orange",
  interested: "purple",
  converted: "green",
  verified: "green",
  "closed lost": "red",
  "dnd/not lifted": "gray",
};

const COLUMNS = [
  { key: "lead_code", header: "Lead Number", render: (r) => r.lead_code || "—" },
  { key: "full_name", header: "Customer Name" },
  { key: "company_name", header: "Company Name", render: (r) => r.company_name || "—" },
  { key: "mobile", header: "Mobile" },
  { key: "lead_source", header: "Source", render: (r) => r.lead_source || "—" },
  { key: "priority", header: "Priority", render: (r) => r.priority || "Medium" },
  {
    key: "next_follow_up_date",
    header: "Next Follow-up",
    render: (r) =>
      r.next_follow_up_date
        ? `${String(r.next_follow_up_date).slice(0, 10)}${r.next_follow_up_time ? ` ${r.next_follow_up_time.slice(0, 5)}` : ""}`
        : "—",
  },
  { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[String(r.status).toLowerCase()] ?? "gray"}>{r.status}</Badge> },
];

export default function SendVerificationRequest() {
  const { toggleCollapsed } = useOutletContext();
  const { user } = useAuth();
  const companyId = user?.company?.id;

  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(() => {
    if (!companyId) return;
    setIsLoading(true);
    getEligibleVerificationLeads(companyId, { search: search.trim() || undefined, per_page: 100 })
      .then((res) => setLeads(res.items))
      .catch(() => setLeads([]))
      .finally(() => setIsLoading(false));
  }, [companyId, search]);

  useEffect(() => {
    load();
  }, [load]);

  // The eligible list already excludes anything not selectable, so
  // selections never need pruning here beyond dropping ids that scrolled
  // out of the current result set (e.g. after a search change).
  useEffect(() => {
    setSelectedIds((prev) => {
      const visibleIds = new Set(leads.map((l) => l.id));
      const next = new Set([...prev].filter((id) => visibleIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [leads]);

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.size === leads.length ? new Set() : new Set(leads.map((l) => l.id))));
  }

  async function handleConfirmSend() {
    setSubmitting(true);
    try {
      const result = await bulkSubmitVerificationRequests(companyId, [...selectedIds]);
      setConfirmOpen(false);
      setSelectedIds(new Set());
      setToast({ tone: "success", message: result?.message || "Verification requests sent successfully." });
      load();
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not send verification requests." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." />
      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Send Verification Request</h1>
            <Breadcrumb current="Send Verification Request" />
          </div>
        </div>

        <div className="panel cl-panel">
          <div className="dt-toolbar" style={{ paddingBottom: 0 }}>
            <div className="cl-search dt-search">
              <Icon name="search" size={16} />
              <input
                type="text"
                placeholder="Search by lead no., name, company, mobile"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="dt-spacer" />

            <button
              type="button"
              className="dash-primary-btn cl-add-btn"
              disabled={selectedIds.size === 0}
              onClick={() => setConfirmOpen(true)}
            >
              Send Verification Request{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </button>
          </div>

          <DataTable
            columns={COLUMNS}
            rows={leads}
            isLoading={isLoading}
            selectable
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            emptyMessage="No leads are available for verification request."
          />
        </div>
      </div>

      {confirmOpen && (
        <ConfirmDialog
          title="Send Verification Request"
          message={`Are you sure you want to send verification requests for the selected ${selectedIds.size} lead${selectedIds.size === 1 ? "" : "s"}?`}
          confirmLabel={submitting ? "Sending…" : "Send Request"}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirmSend}
        />
      )}

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />
    </>
  );
}
