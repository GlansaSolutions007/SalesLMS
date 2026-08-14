import Icon from "../Icon.jsx";

export default function TrainerDashboard({ data }) {
  const stats = data?.stats ?? {};
  const todaySessions = data?.todaySessions ?? [];
  const pendingAssessments = data?.pendingAssessments ?? [];

  const statCards = [
    { label: "My Courses", value: String(stats.my_courses ?? 0), icon: "book" },
    { label: "Today's Sessions", value: String(stats.today_sessions ?? 0), icon: "presentation" },
    { label: "Total Assessments", value: String(stats.assessments ?? 0), icon: "clipboard" },
    { label: "Pending Evaluation", value: String(stats.pending_evaluation ?? 0), icon: "cap" },
  ];

  return (
    <div className="dash-body">
      <div className="dash-welcome">
        <div>
          <h1>
            Trainer Dashboard <Icon name="cap" size={26} />
          </h1>
          <p>Manage your courses, sessions, and track student progress.</p>
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

      <div className="dash-lower">
        <div className="panel leads-panel">
          <div className="panel-head with-border">
            <h3>Today's Batches</h3>
            <span className="today-pill">{todaySessions.length} Today</span>
          </div>

          <table className="leads-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Batch</th>
                <th>Attendees</th>
              </tr>
            </thead>
            <tbody>
              {todaySessions.length === 0 && (
                <tr><td colSpan={3} className="muted">No batches scheduled for today.</td></tr>
              )}
              {todaySessions.map((session, i) => (
                <tr key={i}>
                  <td>
                    <div className="lead-name">{session.course}</div>
                  </td>
                  <td className="muted">{session.batch}</td>
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
              <h3>Assessments Awaiting Evaluation</h3>
              <p>Submitted attempts not yet graded</p>
            </div>
          </div>

          <div className="leaderboard-list">
            {pendingAssessments.length === 0 && <p className="ep-empty-note">Nothing waiting for evaluation.</p>}
            {pendingAssessments.map((assess, i) => (
              <div className="leaderboard-row" key={assess.title + i}>
                <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                <div className="avatar-chip" style={{ width: 36, height: 36 }}>
                  <Icon name="clipboard" size={16} />
                </div>
                <div className="leaderboard-text">
                  <p>{assess.title}</p>
                  <span>{assess.pending} pending</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
