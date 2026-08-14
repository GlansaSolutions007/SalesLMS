import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import LeadPool from "./LeadPool.jsx";
// import LeadVerificationQueue from "./LeadVerificationQueue.jsx";
import MyAssignedLeads from "./MyAssignedLeads.jsx";

// Leads are assigned only to individual employees — there is no "Sales
// Teams" tab here (Sales Teams remain a separate, unrelated org-structure
// feature, decoupled from lead ownership).
//
// The "Pending Verification" tab (LeadVerificationQueue) is paused for now
// along with the rest of the trimmed-down Sales Performance menu — Leads is
// scoped to the lead pool (view/create/edit/import/search/filter/details)
// only. LeadVerificationQueue.jsx and its API are untouched; re-enable by
// restoring the SubNavTabs below.

// Admins (Super Admin / Company Admin) manage the lead pool; an Employee
// only ever sees their own assigned leads (see MyLeadController on the
// backend — a separate, narrower API).
export default function LeadsPage() {
  const { roleName } = useAuth();

  if (roleName === "Employee") {
    return <MyAssignedLeads />;
  }

  return <AdminLeadsView />;
}

function AdminLeadsView() {
  const { toggleCollapsed } = useOutletContext();

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

        <LeadPool />
      </div>
    </>
  );
}
