import { useEffect, useState } from "react";
import DataTable from "../../components/DataTable.jsx";
import Badge from "../../components/Badge.jsx";
import Modal from "../../components/Modal.jsx";
import FormField from "../../components/FormField.jsx";
import Toast from "../../components/Toast.jsx";
import MultiSelectDropdown from "../../components/MultiSelectDropdown.jsx";
// Hand-rolled dt-toolbar/dt-select markup needs its own stylesheet import —
// see TargetList.jsx for why relying on another page to load it first breaks
// direct/refresh navigation.
import "../../components/DataToolbar.css";
import useCompanyOptions from "../company/useCompanyOptions.js";
import useCompanyEmployeeOptions from "../employees/useCompanyEmployeeOptions.js";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getSalesTeams,
  getSalesTeam,
  createSalesTeam,
  updateSalesTeamStatus,
  addSalesTeamMembers,
  removeSalesTeamMember,
} from "../../services/api/salesTeamsApi.js";

export default function SalesTeamsTab() {
  const { roleName, user } = useAuth();
  const isSuperAdmin = roleName === "Super Admin";
  const { options: companies } = useCompanyOptions(isSuperAdmin);
  const [companyId, setCompanyId] = useState(() => (isSuperAdmin ? "" : String(user?.company?.id ?? "")));

  useEffect(() => {
    if (isSuperAdmin && !companyId && companies.length > 0) setCompanyId(String(companies[0].id));
  }, [isSuperAdmin, companies, companyId]);

  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [membersTarget, setMembersTarget] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { options: employees } = useCompanyEmployeeOptions(companyId);

  useEffect(() => {
    if (!companyId) {
      setTeams([]);
      return;
    }
    setIsLoading(true);
    getSalesTeams(companyId)
      .then(setTeams)
      .catch(() => setTeams([]))
      .finally(() => setIsLoading(false));
  }, [companyId, refreshKey]);

  const columns = [
    { key: "team_name", header: "Team Name" },
    { key: "manager", header: "Manager", render: (r) => r.manager?.full_name || "—" },
    { key: "members_count", header: "Members", render: (r) => r.members_count ?? 0 },
    { key: "status", header: "Status", render: (r) => <Badge tone={r.status === "Active" ? "green" : "gray"}>{r.status}</Badge> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="cl-btn" onClick={() => setMembersTarget(r)}>
            Members
          </button>
          <button
            type="button"
            className="cl-btn"
            onClick={async () => {
              await updateSalesTeamStatus(companyId, r.id, r.status === "Active" ? "Inactive" : "Active");
              setRefreshKey((k) => k + 1);
            }}
          >
            {r.status === "Active" ? "Deactivate" : "Activate"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="panel cl-panel">
      {toast && <Toast tone={toast.tone} message={toast.message} onDismiss={() => setToast(null)} />}

      <div className="dt-toolbar" style={{ paddingBottom: 0 }}>
        {isSuperAdmin && (
          <select className="dt-select" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
              </option>
            ))}
          </select>
        )}
        <div className="dt-spacer" />
        <button type="button" className="dash-primary-btn" onClick={() => setShowCreate(true)} disabled={!companyId}>
          Create Sales Team
        </button>
      </div>

      <DataTable columns={columns} rows={teams} isLoading={isLoading} emptyMessage="No sales teams yet." />

      {showCreate && (
        <CreateTeamModal
          companyId={companyId}
          employees={employees}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            setRefreshKey((k) => k + 1);
            setToast({ tone: "success", message: "Sales team created." });
          }}
        />
      )}

      {membersTarget && (
        <MembersModal
          companyId={companyId}
          team={membersTarget}
          employees={employees}
          onClose={() => setMembersTarget(null)}
          onChanged={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}

function CreateTeamModal({ companyId, employees, onClose, onCreated }) {
  const [teamName, setTeamName] = useState("");
  const [managerId, setManagerId] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!teamName.trim()) {
      setError("Team name is required.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await createSalesTeam(companyId, { team_name: teamName, manager_id: managerId || undefined });
      onCreated();
    } catch (err) {
      setError(err.message ?? "Could not create this team.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      title="Create Sales Team"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="cl-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="dash-primary-btn" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Create"}
          </button>
        </>
      }
    >
      <div className="form-fields-stack">
        <FormField label="Team Name *" error={error}>
          <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
        </FormField>
        <FormField label="Manager">
          <select value={managerId} onChange={(e) => setManagerId(e.target.value)}>
            <option value="">None</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name}
              </option>
            ))}
          </select>
        </FormField>
      </div>
    </Modal>
  );
}

function MembersModal({ companyId, team, employees, onClose, onChanged }) {
  const [detail, setDetail] = useState(team);
  const [toAdd, setToAdd] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getSalesTeam(companyId, team.id)
      .then(setDetail)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team.id]);

  async function handleAdd() {
    if (toAdd.length === 0) return;
    setIsSubmitting(true);
    try {
      await addSalesTeamMembers(companyId, team.id, toAdd.map(Number));
      setToAdd([]);
      onChanged();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemove(memberId) {
    await removeSalesTeamMember(companyId, team.id, memberId);
    setDetail((d) => ({ ...d, members: d.members?.filter((m) => m.id !== memberId) }));
    onChanged();
  }

  return (
    <Modal title={`${team.team_name} — Members`} onClose={onClose} footer={<button type="button" className="cl-btn" onClick={onClose}>Close</button>}>
      <div className="form-fields-stack">
        {Array.isArray(detail.members) && detail.members.length > 0 ? (
          <ul>
            {detail.members.map((m) => (
              <li key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {m.employee?.full_name}
                <button type="button" className="cl-btn" onClick={() => handleRemove(m.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No members yet.</p>
        )}

        <FormField label="Add Members">
          <MultiSelectDropdown
            options={employees}
            getOptionValue={(e) => e.id}
            getOptionLabel={(e) => e.full_name}
            selectedValues={toAdd}
            onChange={setToAdd}
            placeholder="Select employees to add"
          />
        </FormField>
        <button type="button" className="dash-primary-btn" onClick={handleAdd} disabled={isSubmitting || toAdd.length === 0}>
          {isSubmitting ? "Adding…" : "Add Selected"}
        </button>
      </div>
    </Modal>
  );
}
