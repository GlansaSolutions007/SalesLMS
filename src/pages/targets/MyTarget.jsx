import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getMyTarget } from "../../services/api/targetsApi.js";

export default function MyTarget() {
  const { toggleCollapsed } = useOutletContext();
  const { user } = useAuth();
  const companyId = user?.company?.id;

  const [target, setTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    getMyTarget(companyId)
      .then(setTarget)
      .catch(() => setTarget(null))
      .finally(() => setIsLoading(false));
  }, [companyId]);

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

        {isLoading && <p>Loading…</p>}

        {!isLoading && !target && (
          <div className="panel cl-panel">
            <p>No target has been set for the current period yet.</p>
          </div>
        )}

        {!isLoading && target && (
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
