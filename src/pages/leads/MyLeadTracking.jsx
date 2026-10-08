import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Badge from "../../components/Badge.jsx";
import Modal from "../../components/Modal.jsx";
import FormField from "../../components/FormField.jsx";
import Toast from "../../components/Toast.jsx";
import Icon from "../../components/Icon.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getMyLead, updateMyLeadStatus, updateMyFollowup, submitLeadConversion } from "../../services/api/leadsApi.js";
import { ROUTES } from "../../router/routePaths.js";
import "./MyLeadTracking.css";

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

// Display-only relabeling for the Update Status dropdown — the stored
// value/API payload is still "Closed Lost" (no backend or data change),
// this only changes what the employee sees as the option text.
const STATUS_DISPLAY_LABELS = {
  "Closed Lost": "Not Interested",
};

// Mirrors MyLeadController::ALLOWED_TRANSITIONS (spec §22) — used only to
// keep the Status dropdown from offering a move the backend will reject.
// The backend remains the source of truth; this is a convenience filter.
const ALLOWED_TRANSITIONS = {
  New: ["Contacted", "Closed Lost"],
  Assigned: ["Contacted", "Closed Lost"],
  Contacted: ["Follow-up", "Interested", "Closed Lost"],
  "Follow-up": ["Interested", "Follow-up", "Closed Lost", "DND/Not Lifted"],
  Interested: ["Follow-up", "Converted", "Closed Lost"],
  // Unreachable-phone outcome — only reachable from Follow-up, and only
  // moves back to Follow-up once contact is made (not a dead end).
  "DND/Not Lifted": ["Follow-up"],
};

const ACTIVITY_STYLE = {
  "Lead Created": { tone: "gray", icon: "plus" },
  "Lead Imported": { tone: "gray", icon: "plus" },
  "Lead Updated": { tone: "gray", icon: "edit" },
  "Lead Assigned": { tone: "blue", icon: "users" },
  "Lead Reassigned": { tone: "blue", icon: "users" },
  "Status Changed": { tone: "orange", icon: "refresh" },
  "Follow-up Added": { tone: "purple", icon: "clock" },
  "Follow-up Completed": { tone: "green", icon: "check" },
  "Follow-up Missed": { tone: "red", icon: "warning" },
  "Follow-up Cancelled": { tone: "gray", icon: "close" },
  "Conversion Submitted": { tone: "blue", icon: "coin" },
  "Conversion Approved": { tone: "green", icon: "check" },
  "Conversion Rejected": { tone: "red", icon: "close" },
  "More Information Requested": { tone: "orange", icon: "warning" },
};

function activityStyle(action) {
  return ACTIVITY_STYLE[action] ?? { tone: "gray", icon: "flag" };
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

// Date-cast fields (next_followup_date, etc.) come back as full ISO
// timestamps ("2026-08-11T00:00:00.000000Z") even though only the calendar
// date is meaningful — slicing avoids a timezone-shifted `new Date()` parse.
function formatDateOnly(value) {
  return value ? String(value).slice(0, 10) : null;
}

export default function MyLeadTracking() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { leadId } = useParams();
  const { user } = useAuth();
  const companyId = user?.company?.id;

  const [lead, setLead] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState(null);
  const [conversionOpen, setConversionOpen] = useState(false);

  // ── Update Status + Follow-up form state ──────────────────────────────
  const [status, setStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [followupRequired, setFollowupRequired] = useState(false);
  const [followupType, setFollowupType] = useState("Call");
  const [followupNotes, setFollowupNotes] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [nextFollowUpTime, setNextFollowUpTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!companyId) return;
    setIsLoading(true);
    getMyLead(companyId, leadId)
      .then((data) => {
        setLead(data);
        setStatus(data.status);
      })
      .catch(() => setLead(null))
      .finally(() => setIsLoading(false));
  }, [companyId, leadId, refreshKey]);

  async function handleSave() {
    setFormError("");

    if (followupRequired && !followupType) {
      setFormError("Select a follow-up type.");
      return;
    }
    if (followupRequired && !nextFollowUpDate) {
      setFormError("Pick a next follow-up date.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateMyLeadStatus(companyId, lead.id, {
        status,
        remarks: remarks || undefined,
        followup_required: followupRequired,
        followup_type: followupRequired ? followupType : undefined,
        followup_notes: followupRequired ? followupNotes || undefined : undefined,
        next_follow_up_date: followupRequired ? nextFollowUpDate : undefined,
        next_follow_up_time: followupRequired ? nextFollowUpTime || undefined : undefined,
      });
      setRemarks("");
      setFollowupRequired(false);
      setFollowupType("Call");
      setFollowupNotes("");
      setNextFollowUpDate("");
      setNextFollowUpTime("");
      setToast({ tone: "success", message: "Lead updated." });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setFormError(err.message ?? "Could not update this lead.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleFollowupAction(followup, newStatus) {
    try {
      await updateMyFollowup(companyId, followup.id, { status: newStatus });
      setToast({ tone: "success", message: `Follow-up marked ${newStatus}.` });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not update follow-up." });
    }
  }

  if (isLoading) {
    return (
      <>
        <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." />
        <div className="cl-body">
          <p>Loading…</p>
        </div>
      </>
    );
  }

  if (!lead) {
    return (
      <>
        <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." />
        <div className="cl-body">
          <p>Lead not found.</p>
          <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.MY_LEADS)}>
            Back to My Leads
          </button>
        </div>
      </>
    );
  }

  const statusOptions = Array.from(new Set([status || lead.status, ...(ALLOWED_TRANSITIONS[lead.status] ?? [])]));
  const pendingFollowups = (lead.followups ?? []).filter((f) => f.status === "Pending");
  const activities = lead.activities ?? [];

  // Derived, read-only label — there is no real "Verification Requested"
  // lead status. Any existing lead_verification_requests row (created by
  // Send Verification Request) locks the Status field here; it never
  // changes lead.status itself or the verification-request flow. The
  // backend enforces the same rule in updateStatus() regardless of what
  // this renders.
  const hasVerificationRequest = Boolean(lead.verification_request);
  const headerStatusLabel = hasVerificationRequest ? "Verification Requested" : lead.status;
  const headerStatusTone = hasVerificationRequest ? "orange" : (STATUS_TONE[String(lead.status).toLowerCase()] ?? "gray");

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." />
      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>{lead.full_name}</h1>
            <Breadcrumb current="Track Lead" />
          </div>
          <div className="cl-actions">
            <Badge tone={headerStatusTone}>{headerStatusLabel}</Badge>
            <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.MY_LEADS)}>
              Back to My Leads
            </button>
          </div>
        </div>

        {toast && <Toast tone={toast.tone} message={toast.message} onDismiss={() => setToast(null)} />}

        <div className="lt-layout">
          {/* ── Left: lead summary + combined form ───────────────────── */}
          <div className="lt-col-form">
            <div className="panel cl-panel lt-panel">
              <h3>Lead Details</h3>
              <div className="lt-summary">
                <p><strong>Lead Number:</strong> {lead.lead_code || "—"}</p>
                <p><strong>Company:</strong> {lead.company_name || "—"}</p>
                <p><strong>Mobile:</strong> {lead.mobile}</p>
                <p><strong>Source:</strong> {lead.lead_source}</p>
                <p><strong>Priority:</strong> {lead.priority || "Medium"}</p>
              </div>
            </div>

            {!hasVerificationRequest && (
              <div className="panel cl-panel lt-panel">
                <h3>Update Status</h3>
                <div className="form-fields-stack">
                  <FormField label="Status">
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_DISPLAY_LABELS[s] ?? s}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Remarks">
                    <textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                  </FormField>

                  <label className="lt-checkbox">
                    <input type="checkbox" checked={followupRequired} onChange={(e) => setFollowupRequired(e.target.checked)} />
                    Follow-up Required
                  </label>

                  {followupRequired && (
                    <div className="lt-followup-section">
                      <FormField label="Follow-up Type">
                        <select value={followupType} onChange={(e) => setFollowupType(e.target.value)}>
                          {["Call", "Meeting", "WhatsApp", "Email", "Other"].map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </FormField>
                      <FormField label="Follow-up Notes">
                        <textarea rows={2} value={followupNotes} onChange={(e) => setFollowupNotes(e.target.value)} />
                      </FormField>
                      <div className="form-row">
                        <FormField label="Next Follow-up Date">
                          <input type="date" value={nextFollowUpDate} onChange={(e) => setNextFollowUpDate(e.target.value)} />
                        </FormField>
                        <FormField label="Next Follow-up Time">
                          <input type="time" value={nextFollowUpTime} onChange={(e) => setNextFollowUpTime(e.target.value)} />
                        </FormField>
                      </div>
                    </div>
                  )}

                  {formError && <p className="form-field-error">{formError}</p>}

                  <div className="lt-form-actions">
                    <button type="button" className="dash-primary-btn" onClick={handleSave} disabled={isSubmitting}>
                      {isSubmitting ? "Saving…" : "Save"}
                    </button>
                    {status === "Converted" && (
                      <button type="button" className="cl-btn" onClick={() => setConversionOpen(true)}>
                        Submit Conversion
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {pendingFollowups.length > 0 && (
              <div className="panel cl-panel lt-panel">
                <h3>Pending Follow-ups</h3>
                <ul className="lt-pending-list">
                  {pendingFollowups.map((f) => (
                    <li key={f.id}>
                      <div>
                        <strong>{f.followup_type}</strong> — next {formatDateOnly(f.next_followup_date) || "—"}
                        {f.next_followup_time ? ` ${f.next_followup_time.slice(0, 5)}` : ""}
                        {f.notes ? <p className="lt-pending-notes">{f.notes}</p> : null}
                      </div>
                      <div className="lt-pending-actions">
                        <button type="button" className="cl-btn" onClick={() => handleFollowupAction(f, "Completed")}>
                          Complete
                        </button>
                        <button type="button" className="cl-btn" onClick={() => handleFollowupAction(f, "Missed")}>
                          Missed
                        </button>
                        <button type="button" className="cl-btn" onClick={() => handleFollowupAction(f, "Cancelled")}>
                          Cancel
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ── Right: full lead timeline ────────────────────────────── */}
          <div className="lt-col-timeline">
            <div className="panel cl-panel lt-panel">
              <h3>Lead Timeline</h3>
              {activities.length === 0 ? (
                <p>No activity recorded yet.</p>
              ) : (
                <ul className="lt-timeline">
                  {activities.map((a) => {
                    const style = activityStyle(a.action);
                    return (
                      <li className="lt-timeline-item" key={a.id}>
                        <span className={`lt-timeline-dot lt-tone-${style.tone}`}>
                          <Icon name={style.icon} size={13} />
                        </span>
                        <div className="lt-timeline-content">
                          <div className="lt-timeline-head">
                            <strong>{a.action}</strong>
                            <span className="lt-timeline-time">{formatDateTime(a.created_at)}</span>
                          </div>
                          <p className="lt-timeline-meta">by {a.performed_by?.name ?? "System"}</p>
                          {(a.previous_value || a.new_value) && (
                            <p className="lt-timeline-transition">
                              {a.previous_value && <span className="lt-chip">{a.previous_value}</span>}
                              {a.previous_value && a.new_value && <Icon name="arrow" size={12} />}
                              {a.new_value && <span className="lt-chip lt-chip-strong">{a.new_value}</span>}
                            </p>
                          )}
                          {a.description && <p className="lt-timeline-desc">{a.description}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {conversionOpen && (
        <SubmitConversionModal
          companyId={companyId}
          lead={lead}
          onClose={() => setConversionOpen(false)}
          onDone={() => {
            setConversionOpen(false);
            setRefreshKey((k) => k + 1);
            setToast({ tone: "success", message: "Conversion submitted for verification." });
          }}
        />
      )}
    </>
  );
}

function SubmitConversionModal({ companyId, lead, onClose, onDone }) {
  const latestConversion = lead.conversions?.[0];
  const isResubmit = latestConversion?.status === "More Info Requested";

  const [conversionDate, setConversionDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [document, setDocument] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!amount || Number(amount) < 0) {
      setError("Enter a valid sale amount.");
      return;
    }
    if (!conversionDate) {
      setError("Select a conversion date.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await submitLeadConversion(companyId, lead.id, {
        conversion_date: conversionDate,
        converted_amount: amount,
        reference_number: referenceNumber || undefined,
        remarks: remarks || undefined,
        supporting_document: document || undefined,
      });
      onDone();
    } catch (err) {
      setError(err.message ?? "Could not submit conversion.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      title={`${isResubmit ? "Resubmit" : "Submit"} Conversion — ${lead.full_name}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="cl-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="dash-primary-btn" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting…" : isResubmit ? "Resubmit" : "Submit"}
          </button>
        </>
      }
    >
      <div className="form-fields-stack">
        {isResubmit && <p className="form-field-error">More information was requested on your previous submission — please update and resubmit.</p>}
        <FormField label="Conversion Date *">
          <input type="date" value={conversionDate} onChange={(e) => setConversionDate(e.target.value)} />
        </FormField>
        <FormField label="Sale Amount *" error={error}>
          <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </FormField>
        <FormField label="Order / Reference Number">
          <input type="text" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />
        </FormField>
        <FormField label="Conversion Notes">
          <textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </FormField>
        <FormField label="Supporting Document">
          <input type="file" onChange={(e) => setDocument(e.target.files?.[0] ?? null)} />
        </FormField>
      </div>
    </Modal>
  );
}
