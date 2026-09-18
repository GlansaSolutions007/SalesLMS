import { useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";

// Design-only data — see LeadPool.jsx's note on this module's UI-only scope.
const DUMMY_TARGET = {
  start_date: "2026-09-01",
  end_date: "2026-09-30",
  verified_leads: 27,
  lead_target: 35,
  lead_achievement_pct: 77,
  verified_sales: 14,
  sales_target: 18,
  sales_achievement_pct: 78,
  verified_revenue: 840000,
  revenue_target: 1000000,
  revenue_achievement_pct: 84,
};

export default function MyTarget() {
  const { toggleCollapsed } = useOutletContext();
  const target = DUMMY_TARGET;

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." />
      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>My Target</h1>
            <Breadcrumb current="Targets" />
          </div>
        </div>

        {!target && (
          <div className="panel cl-panel">
            <p>No target has been set for the current period yet.</p>
          </div>
        )}

        {target && (
          <div className="panel cl-panel">
            <p>
              Period: {target.start_date} to {target.end_date}
            </p>

            <div className="form-fields-stack">
              <div>
                <p>
                  Lead Target: {target.verified_leads} / {target.lead_target}
                </p>
                <ProgressBar value={Math.min(target.lead_achievement_pct, 100)} />
              </div>
              <div>
                <p>
                  Sales Target: {target.verified_sales} / {target.sales_target}
                </p>
                <ProgressBar value={Math.min(target.sales_achievement_pct, 100)} tone="success" />
              </div>
              <div>
                <p>
                  Revenue Target: ₹{Number(target.verified_revenue).toLocaleString()} / ₹{Number(target.revenue_target).toLocaleString()}
                </p>
                <ProgressBar value={Math.min(target.revenue_achievement_pct, 100)} tone="warning" />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
