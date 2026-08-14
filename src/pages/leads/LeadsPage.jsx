import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import SubNavTabs from "../../components/SubNavTabs.jsx";
import LeadPool from "./LeadPool.jsx";
import LeadVerificationQueue from "./LeadVerificationQueue.jsx";
import MyAssignedLeads from "./MyAssignedLeads.jsx";

// Leads are assigned only to individual employees — there is no "Sales
// Teams" tab here (Sales Teams remain a separate, unrelated org-structure
// feature, decoupled from lead ownership).
const TABS = [
  { key: "pool", label: "Lead Pool" },
  { key: "verification", label: "Pending Verification" },
];

// Admins (Super Admin / Company Admin) manage the lead pool, assignment and
// conversion verification; an Employee only ever sees their own assigned
// leads (see MyLeadController on the backend — a separate, narrower API).
export default function LeadsPage() {
  const { roleName } = useAuth();

  if (roleName === "Employee") {
    return <MyAssignedLeads />;
  }

  return <AdminLeadsView />;
}

function AdminLeadsView() {
  const { toggleCollapsed } = useOutletContext();
  const [tab, setTab] = useState("pool");

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." />
      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Leads</h1>
            <Breadcrumb current="Leads" />
          </div>
        </div>

        <SubNavTabs tabs={TABS} active={tab} onNavigate={setTab} />

        {tab === "pool" && <LeadPool />}
        {tab === "verification" && <LeadVerificationQueue />}
      </div>
    </>
  );
}
