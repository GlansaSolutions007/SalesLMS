import Icon from "../Icon.jsx";
import ProgressBar from "../ProgressBar.jsx";

export default function CompanyAdminDashboard({ data }) {
  const stats = data?.stats ?? {};
  const todayBatches = data?.todayBatches ?? [];
  const activeCourses = data?.activeCourses ?? [];
  const topPerformers = data?.topPerformers ?? [];
  const targetAchievement = data?.targetAchievement ?? null;

  const statCards = [
    { label: "Employees", value: String(stats.employees ?? 0), icon: "users" },
    // { label: "Active Trainers", value: String(stats.trainers ?? 0), icon: "presentation" },
    // { label: "Published Courses", value: String(stats.active_courses ?? 0), icon: "book" },
    { label: "Course Assignments", value: String(stats.assignments ?? 0), icon: "cap" },
  ];

  const salesStatCards = [
    { label: "Leads Uploaded", value: String(stats.leads_uploaded ?? 0), icon: "users" },
    { label: "Leads Assigned", value: String(stats.leads_assigned ?? 0), icon: "flag" },
    { label: "Pending Verification", value: String(stats.pending_verification ?? 0), icon: "clock" },
    { label: "Verified Conversions", value: String(stats.verified_conversions ?? 0), icon: "check" },
    { label: "Monthly Revenue", value: `₹${Number(stats.monthly_revenue ?? 0).toLocaleString()}`, icon: "coin" },
    { label: "Pending Incentives", value: `₹${Number(stats.pending_incentives ?? 0).toLocaleString()}`, icon: "gift" },
  ];

  return (
    <div className="dash-body">
      <div className="dash-welcome">
        <div>
          <h1>
            Company Dashboard <Icon name="building" size={26} />
          </h1>
          <p>Manage your employees, trainers, courses and track training progress.</p>
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
        <div className="panel leaderboard-panel">
          <div className="panel-head with-border">
            <div>
              <h3>Top Performers</h3>
              <p>By verified revenue, this month</p>
            </div>
          </div>

          <div className="leaderboard-list">
            {topPerformers.length === 0 && <p className="ep-empty-note">No verified conversions this month yet.</p>}
            {topPerformers.map((p, i) => (
              <div className="leaderboard-row" key={p.name + i}>
                <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                <div className="leaderboard-text">
                  <p>{p.name}</p>
                  <span>{p.verified_conversions} verified conversions</span>
                </div>
                <span className="muted-change">₹{Number(p.verified_revenue).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel activity-panel">
          <div className="panel-head with-border">
            <h3>Monthly Target Achievement</h3>
          </div>
          {targetAchievement ? (
            <div className="form-fields-stack" style={{ padding: 16 }}>
              <div>
                <p>
                  Leads: {targetAchievement.verified_leads_total} / {targetAchievement.lead_target_total}
                </p>
                <ProgressBar value={Math.min(targetAchievement.achievement_pct, 100)} />
              </div>
              <div>
                <p>Revenue: ₹{Number(targetAchievement.verified_revenue_total).toLocaleString()} / ₹{Number(targetAchievement.revenue_target_total).toLocaleString()}</p>
              </div>
            </div>
          ) : (
            <p className="ep-empty-note">No targets set yet.</p>
          )}
        </div>
      </div>

      <div className="dash-lower">
        <div className="panel leads-panel">
          <div className="panel-head with-border">
            <h3>Batches Running Today</h3>
            <span className="today-pill">{todayBatches.length} Today</span>
          </div>

          <table className="leads-table">
            <thead>
              <tr>
                <th>Batch</th>
                <th>Course</th>
                <th>Trainer</th>
                <th>Enrolled</th>
              </tr>
            </thead>
            <tbody>
              {todayBatches.length === 0 && (
                <tr><td colSpan={4} className="muted">No batches running today.</td></tr>
              )}
              {todayBatches.map((session, i) => (
                <tr key={i}>
                  <td>
                    <div className="lead-name">{session.batch}</div>
                  </td>
                  <td className="muted">{session.course}</td>
                  <td className="muted">{session.trainer}</td>
                  <td>
                    <span className="status-pill info">{session.attendees}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel leaderboard-panel">
          <div className="panel-head with-border">
            <div>
              <h3>Most Assigned Courses</h3>
              <p>By enrollment, this company</p>
            </div>
          </div>

          <div className="leaderboard-list">
            {activeCourses.length === 0 && <p className="ep-empty-note">No course assignments yet.</p>}
            {activeCourses.map((course, i) => (
              <div className="leaderboard-row" key={course.title + i}>
                <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                <div className="avatar-chip" style={{ width: 36, height: 36 }}>
                  <Icon name="book" size={16} />
                </div>
                <div className="leaderboard-text">
                  <p>{course.title}</p>
                  <span>{course.enrolled} enrolled</span>
                </div>
                <span className="muted-change">{course.completion}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
