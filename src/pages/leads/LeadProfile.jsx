import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Badge from "../../components/Badge.jsx";
import { getLead } from "../../services/api/leadsApi.js";
import { ROUTES } from "../../router/routePaths.js";

const STATUS_TONE = {
  new: "blue",
  assigned: "blue",
  contacted: "orange",
  "follow-up": "orange",
  interested: "purple",
  converted: "green",
  verified: "green",
  "closed lost": "red",
};

export default function LeadProfile() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { companyId, leadId } = useParams();
  const [lead, setLead] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getLead(companyId, leadId)
      .then(setLead)
      .catch(() => setLead(null))
      .finally(() => setIsLoading(false));
  }, [companyId, leadId]);

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." />
      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>{lead?.full_name ?? "Lead"}</h1>
            <Breadcrumb current="Lead Profile" />
          </div>
          <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.LEADS)}>
            Back to Leads
          </button>
        </div>

        {isLoading && <p>Loading…</p>}

        {!isLoading && !lead && <p>Lead not found.</p>}

        {!isLoading && lead && (
          <>
            <div className="panel cl-panel">
              <h3>Customer Information</h3>
              <div className="form-row">
                <p><strong>Customer Name:</strong> {lead.full_name}</p>
                <p><strong>Company Name:</strong> {lead.company_name || "—"}</p>
                <p><strong>Email:</strong> {lead.email || "—"}</p>
              </div>
              <div className="form-row">
                <p><strong>Mobile:</strong> {lead.mobile}</p>
                <p><strong>Alternate Mobile:</strong> {lead.alternate_mobile || "—"}</p>
                <p><strong>Address:</strong> {[lead.address, lead.city, lead.state].filter(Boolean).join(", ") || "—"}</p>
              </div>
            </div>

            <div className="panel cl-panel">
              <h3>Lead Information</h3>
              <div className="form-row">
                <p><strong>Lead Number:</strong> {lead.lead_code || "—"}</p>
                <p><strong>Source:</strong> {lead.lead_source}</p>
                <p><strong>Product / Service:</strong> {lead.product_service || "—"}</p>
              </div>
              <div className="form-row">
                <p><strong>Priority:</strong> <Badge tone={lead.priority === "High" ? "red" : lead.priority === "Low" ? "gray" : "orange"}>{lead.priority || "Medium"}</Badge></p>
                <p><strong>Status:</strong> <Badge tone={STATUS_TONE[String(lead.status).toLowerCase()] ?? "gray"}>{lead.status}</Badge></p>
                <p><strong>Assigned Employee:</strong> {lead.assigned_employee?.full_name || "Unassigned"}</p>
              </div>
              {lead.remarks && <p><strong>Notes:</strong> {lead.remarks}</p>}
            </div>

            <div className="panel cl-panel">
              <h3>Follow-up Information</h3>
              <p><strong>Next Follow-up:</strong> {lead.next_follow_up_date || "—"}</p>
              {Array.isArray(lead.followups) && lead.followups.length > 0 ? (
                <ul>
                  {lead.followups.map((f) => (
                    <li key={f.id}>
                      <Badge tone={f.status === "Completed" ? "green" : f.status === "Missed" ? "red" : f.status === "Cancelled" ? "gray" : "orange"}>{f.status}</Badge>{" "}
                      {f.followup_type} on {f.followup_date}{f.followup_time ? ` ${f.followup_time}` : ""} — {f.notes || "No notes"}
                      {f.next_followup_date ? ` (next: ${f.next_followup_date}${f.next_followup_time ? ` ${f.next_followup_time}` : ""})` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No follow-ups logged yet.</p>
              )}
            </div>

            <div className="panel cl-panel">
              <h3>Conversion Information</h3>
              {Array.isArray(lead.conversions) && lead.conversions.length > 0 ? (
                <ul>
                  {lead.conversions.map((c) => (
                    <li key={c.id}>
                      <Badge tone={c.status === "Approved" ? "green" : c.status === "Rejected" ? "red" : "orange"}>{c.status}</Badge>{" "}
                      ₹{Number(c.converted_amount).toLocaleString()} on {c.conversion_date || "—"}
                      {c.reference_number ? ` — Ref: ${c.reference_number}` : ""}
                      {c.remarks ? ` — ${c.remarks}` : ""}
                      {c.supporting_document ? " (document attached)" : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No conversion submitted yet.</p>
              )}
            </div>

            <div className="panel cl-panel">
              <h3>Verification Information</h3>
              <div className="form-row">
                <p><strong>Verification Status:</strong> {lead.verification_status ? <Badge tone={lead.verification_status === "Approved" ? "green" : lead.verification_status === "Rejected" ? "red" : "orange"}>{lead.verification_status}</Badge> : "—"}</p>
                <p><strong>Verified By:</strong> {lead.verified_by?.name || "—"}</p>
                <p><strong>Verified Date:</strong> {lead.verified_at ? new Date(lead.verified_at).toLocaleString() : "—"}</p>
              </div>
              {lead.rejection_reason && <p><strong>Rejection Reason:</strong> {lead.rejection_reason}</p>}
            </div>

            <div className="panel cl-panel">
              <h3>Status History</h3>
              {Array.isArray(lead.status_logs) && lead.status_logs.length > 0 ? (
                <ul>
                  {lead.status_logs.map((log) => (
                    <li key={log.id}>
                      {log.previous_status ?? "—"} → {log.new_status} by {log.changed_by?.name ?? "—"} ({new Date(log.created_at).toLocaleString()})
                      {log.remarks ? ` — ${log.remarks}` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No status changes yet.</p>
              )}
            </div>

            <div className="panel cl-panel">
              <h3>Assignment History</h3>
              {Array.isArray(lead.assignment_history) && lead.assignment_history.length > 0 ? (
                <ul>
                  {lead.assignment_history.map((h) => (
                    <li key={h.id}>
                      {h.previous_employee?.full_name || "Unassigned"} → {h.new_employee?.full_name || "—"} by {h.assigned_by?.name ?? "—"} ({new Date(h.assigned_at).toLocaleString()})
                      {h.reason ? ` — ${h.reason}` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No reassignments yet.</p>
              )}
            </div>

            <div className="panel cl-panel">
              <h3>Activity History</h3>
              {Array.isArray(lead.activities) && lead.activities.length > 0 ? (
                <ul>
                  {lead.activities.map((a) => (
                    <li key={a.id}>
                      <strong>{a.action}</strong> by {a.performed_by?.name ?? "System"} ({new Date(a.created_at).toLocaleString()})
                      {a.description ? ` — ${a.description}` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No activity recorded yet.</p>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
