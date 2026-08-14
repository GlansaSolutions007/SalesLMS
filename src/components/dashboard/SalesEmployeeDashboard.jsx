import Icon from "../Icon.jsx";
import ProgressBar from "../ProgressBar.jsx";

const STATUS_TONE = { Assigned: "info", "In Progress": "warning", Completed: "success", Expired: "danger" };

export default function SalesEmployeeDashboard({ data }) {
  const stats = data?.stats ?? {};
  const myCourses = data?.myCourses ?? [];
  const myCertificates = data?.myCertificates ?? [];
  const targetProgress = data?.targetProgress ?? null;
  const todaysFollowUps = data?.todaysFollowUps ?? [];

  const statCards = [
    { label: "My Courses", value: String(stats.my_courses ?? 0), icon: "book" },
    { label: "Completed", value: String(stats.completed ?? 0), icon: "cap" },
    { label: "Assessment Attempts", value: String(stats.attempts ?? 0), icon: "clipboard" },
    { label: "Certificates", value: String(stats.certificates ?? 0), icon: "trophy" },
  ];

  const salesStatCards = [
    { label: "Assigned Leads", value: String(stats.assigned_leads ?? 0), icon: "users" },
    { label: "Today's Follow-ups", value: String(stats.todays_followups ?? 0), icon: "clock" },
    { label: "Pending Follow-ups", value: String(stats.pending_followups ?? 0), icon: "flag" },
    { label: "Interested Leads", value: String(stats.interested_leads ?? 0), icon: "star" },
    { label: "Converted (Submitted)", value: String(stats.converted_leads ?? 0), icon: "check" },
    { label: "Verified Leads", value: String(stats.verified_leads ?? 0), icon: "trophy" },
    { label: "Monthly Incentive", value: `₹${Number(stats.monthly_incentive ?? 0).toLocaleString()}`, icon: "coin" },
  ];

  return (
    <div className="dash-body">
      <div className="dash-welcome">
        <div>
          <h1>
            My Dashboard <Icon name="star" size={26} filled />
          </h1>
          <p>Track your assigned courses, progress, and certificates.</p>
        </div>
      </div>

      <div className="dash-stats">
        {statCards.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-top">
              <div className="stat-icon">
                <Icon name={stat.icon} size={18} />
              </div>
            </div>
            <p className="stat-label">{stat.label}</p>
            <p className="stat-value">{stat.value}</p>
            <Icon name={stat.icon} size={72} />
          </div>
        ))}
      </div>

      <div className="dash-stats">
        {salesStatCards.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-top">
              <div className="stat-icon">
                <Icon name={stat.icon} size={18} />
              </div>
            </div>
            <p className="stat-label">{stat.label}</p>
            <p className="stat-value">{stat.value}</p>
            <Icon name={stat.icon} size={72} />
          </div>
        ))}
      </div>

      <div className="dash-lower">
        <div className="panel activity-panel">
          <div className="panel-head with-border">
            <h3>My Target Progress</h3>
          </div>
          {targetProgress ? (
            <div className="form-fields-stack" style={{ padding: 16 }}>
              <div>
                <p>Lead Target: {targetProgress.verified_leads} / {targetProgress.lead_target}</p>
                <ProgressBar value={Math.min(targetProgress.lead_achievement_pct, 100)} />
              </div>
              <div>
                <p>Sales Target: {targetProgress.verified_sales} / {targetProgress.sales_target}</p>
                <ProgressBar value={Math.min(targetProgress.sales_achievement_pct, 100)} tone="success" />
              </div>
              <div>
                <p>Revenue Target: ₹{Number(targetProgress.verified_revenue).toLocaleString()} / ₹{Number(targetProgress.revenue_target).toLocaleString()}</p>
                <ProgressBar value={Math.min(targetProgress.revenue_achievement_pct, 100)} tone="warning" />
              </div>
            </div>
          ) : (
            <p className="ep-empty-note">No target set for the current period.</p>
          )}
        </div>

        <div className="panel leaderboard-panel">
          <div className="panel-head with-border">
            <h3>Today's Follow-ups</h3>
          </div>
          <div className="leaderboard-list">
            {todaysFollowUps.length === 0 && <p className="ep-empty-note">No follow-ups due today.</p>}
            {todaysFollowUps.map((lead) => (
              <div className="leaderboard-row" key={lead.lead_id}>
                <div className="leaderboard-text">
                  <p>{lead.name}</p>
                  <span>{lead.mobile}</span>
                </div>
                <span className="muted-change">{lead.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dash-lower">
        <div className="panel leaderboard-panel">
          <div className="panel-head with-border">
            <div>
              <h3>My Assigned Courses</h3>
              <p>Most recently assigned</p>
            </div>
          </div>
          <div className="leaderboard-list">
            {myCourses.length === 0 && <p className="ep-empty-note">No courses assigned yet.</p>}
            {myCourses.map((course, i) => (
              <div className="leaderboard-row" key={course.title + i}>
                <div className="avatar-chip" style={{ width: 36, height: 36 }}>
                  <Icon name="book" size={16} />
                </div>
                <div className="leaderboard-text">
                  <p>{course.title}</p>
                </div>
                <span className={`status-pill ${STATUS_TONE[course.status] ?? "info"}`}>{course.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel activity-panel">
          <div className="panel-head with-border">
            <h3>My Certificates</h3>
          </div>

          <div className="activity-grid">
            {myCertificates.length === 0 && <p className="ep-empty-note">No certificates issued yet.</p>}
            {myCertificates.map((item, i) => (
              <div className="activity-row" key={item.title + i}>
                <span className="activity-icon success">
                  <Icon name="trophy" size={14} filled />
                </span>
                <div>
                  <p><b>{item.title}</b></p>
                  <span>Issued {item.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
