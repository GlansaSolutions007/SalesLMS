import Icon from "../Icon.jsx";

function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function SalesManagerDashboard({ data }) {
  const stats = data?.stats ?? {};
  const teamPerformance = data?.teamPerformance ?? [];

  const statCards = [
    { label: "Team Size", value: String(stats.team_size ?? 0), icon: "users" },
    { label: "Courses Assigned", value: String(stats.assignments ?? 0), icon: "book" },
    { label: "Completed", value: String(stats.completed ?? 0), icon: "cap" },
    { label: "Certificates Earned", value: String(stats.certificates ?? 0), icon: "trophy" },
  ];

  return (
    <div className="dash-body">
      <div className="dash-welcome">
        <div>
          <h1>
            Sales Manager Dashboard <Icon name="pipeline" size={26} />
          </h1>
          <p>Track your team's training progress and completion.</p>
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
        <div className="panel leads-panel" style={{ gridColumn: "1 / -1" }}>
          <div className="panel-head with-border">
            <h3>Team Training Performance</h3>
          </div>

          <table className="leads-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Assigned</th>
                <th>Completed</th>
                <th>Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              {teamPerformance.length === 0 && (
                <tr><td colSpan={4} className="muted">No direct reports found for your account.</td></tr>
              )}
              {teamPerformance.map((member) => (
                <tr key={member.name}>
                  <td>
                    <div className="lead-name">
                      <span className="avatar-chip">{initials(member.name)}</span>
                      {member.name}
                    </div>
                  </td>
                  <td className="muted">{member.assigned}</td>
                  <td className="muted">{member.completed}</td>
                  <td>
                    <span className="status-pill success">{member.completion}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
