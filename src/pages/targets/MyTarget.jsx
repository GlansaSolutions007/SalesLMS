import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";
import Badge from "../../components/Badge.jsx";
import Icon from "../../components/Icon.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getMyTarget } from "../../services/api/targetsApi.js";
import { getTargetStatus } from "../../utils/targetStatus.js";
import "./MyTarget.css";

function formatPeriodDate(dateStr) {
  if (!dateStr) return "—";
  const parsed = new Date(`${String(dateStr).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return String(dateStr).slice(0, 10);
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function TargetCard({ title, achievedText, pct, remainingText, tone, previousText, platformText, showBreakdown }) {
  const rawPct = Number(pct) || 0;
  const displayPct = Math.min(Math.max(Math.round(rawPct), 0), 100);
  const status = getTargetStatus(rawPct);
  return (
    <div className="target-card">
      <p className="target-card-title">{title}</p>
      <p className="target-card-value">{achievedText}</p>
      {showBreakdown && (
        <div className="target-card-breakdown">
          <span>Previous: {previousText}</span>
          <span>Platform: {platformText}</span>
        </div>
      )}
      <ProgressBar value={displayPct} tone={tone} />
      <div className="target-card-footer">
        <span className="target-card-remaining">{remainingText}</span>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
    </div>
  );
}

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

        {isLoading && (
          <div className="panel cl-panel">
            <p style={{ padding: 20, margin: 0 }}>Loading…</p>
          </div>
        )}

        {!isLoading && !target && (
          <div className="panel cl-panel">
            <p style={{ padding: 20, margin: 0 }}>No target has been set for the current period yet.</p>
          </div>
        )}

        {!isLoading && target && (
          <>
            <div className="target-period-card">
              <div className="target-period-icon">
                <Icon name="calendar" size={18} />
              </div>
              <div>
                <p className="target-period-label">Target Period</p>
                <p className="target-period-value">
                  {formatPeriodDate(target.start_date)} – {formatPeriodDate(target.end_date)}
                </p>
              </div>
            </div>

            <div className="target-cards-grid">
              <TargetCard
                title="Lead Target"
                achievedText={`${target.verified_leads} / ${target.lead_target}`}
                pct={target.lead_achievement_pct}
                remainingText={`${Math.max(target.lead_target - target.verified_leads, 0)} remaining`}
                tone="primary"
                showBreakdown={target.has_historical_achievement}
                previousText={target.previous_leads}
                platformText={target.platform_leads}
              />
              <TargetCard
                title="Sales Target"
                achievedText={`${target.verified_sales} / ${target.sales_target}`}
                pct={target.sales_achievement_pct}
                remainingText={`${Math.max(target.sales_target - target.verified_sales, 0)} remaining`}
                tone="success"
                showBreakdown={target.has_historical_achievement}
                previousText={target.previous_sales}
                platformText={target.platform_sales}
              />
              <TargetCard
                title="Revenue Target"
                achievedText={`₹${Number(target.verified_revenue).toLocaleString()} / ₹${Number(target.revenue_target).toLocaleString()}`}
                pct={target.revenue_achievement_pct}
                remainingText={`₹${Math.max(target.revenue_target - target.verified_revenue, 0).toLocaleString()} remaining`}
                tone="warning"
                showBreakdown={target.has_historical_achievement}
                previousText={`₹${Number(target.previous_revenue).toLocaleString()}`}
                platformText={`₹${Number(target.platform_revenue).toLocaleString()}`}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}
