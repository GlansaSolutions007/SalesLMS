import Icon from "../Icon.jsx";

const stats = [
  { label: "Team Performance", value: "94%", change: "+7%", trend: "up", icon: "users" },
  { label: "Leads", value: "1,284", change: "+12%", trend: "up", icon: "users" },
  { label: "Conversions", value: "156", change: "+8%", trend: "up", icon: "cursor" },
  { label: "Revenue", value: "$124.5k", change: "+18%", trend: "up", icon: "coin" },
];

const teamMembers = [
  { initials: "ER", name: "Elena Rodriguez", deals: "$184.2k", leads: 42, conversion: "68%" },
  { initials: "MT", name: "Marcus Thorne", deals: "$142.5k", leads: 38, conversion: "55%" },
  { initials: "JW", name: "Jessica Wang", deals: "$121.9k", leads: 35, conversion: "51%" },
  { initials: "SM", name: "Sarah Miller", deals: "$98.4k", leads: 28, conversion: "46%" },
];

const weeklyLeads = [
  { month: "MON", value: 24 },
  { month: "TUE", value: 32 },
  { month: "WED", value: 28 },
  { month: "THU", value: 36 },
  { month: "FRI", value: 22 },
];

export default function SalesManagerDashboard() {
  return (
    <div className="dash-body">
      <div className="dash-welcome">
        <div>
          <h1>
            Sales Manager Dashboard <Icon name="pipeline" size={26} />
          </h1>
          <p>Track your team's performance, leads, and revenue targets.</p>
        </div>
        <div className="dash-welcome-actions">
          <button type="button" className="dash-ghost-btn">
            <Icon name="calendar" size={16} />
            This Month
          </button>
          <button type="button" className="dash-ghost-btn">
            <Icon name="download" size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="dash-stats">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-top">
              <div className="stat-icon">
                <Icon name={stat.icon} size={18} />
              </div>
              <span className={`stat-change ${stat.trend}`}>{stat.change}</span>
            </div>
            <p className="stat-label">{stat.label}</p>
            <p className="stat-value">{stat.value}</p>
            <Icon name={stat.icon} size={72} />
          </div>
        ))}
      </div>

      <div className="dash-charts">
        <div className="panel chart-panel">
          <div className="panel-head">
            <div>
              <h3>Weekly Lead Generation</h3>
              <p>New leads acquired this week</p>
            </div>
          </div>
          <div className="bar-chart" style={{ minHeight: 200, margin: "24px 22px 0" }}>
            {weeklyLeads.map((bar) => (
              <div className="bar-track" style={{ height: `${(bar.value / 36) * 100}%` }} key={bar.month}>
                <div className="bar-fill" style={{ height: `${(bar.value / 36) * 100}%` }} />
                <span>{bar.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel bar-panel">
          <div className="panel-head">
            <div>
              <h3>Revenue Forecast</h3>
              <p>Targets vs Achievement</p>
            </div>
          </div>
          <div className="bar-chart">
            {[
              { month: "JUL", target: 40, actual: 70 },
              { month: "AUG", target: 60, actual: 85 },
              { month: "SEP", target: 50, actual: 90 },
              { month: "OCT", target: 80, actual: 65 },
            ].map((bar) => (
              <div className="bar-track" style={{ height: `${bar.target}%` }} key={bar.month}>
                <div className="bar-fill" style={{ height: `${bar.actual}%` }} />
                <span>{bar.month}</span>
              </div>
            ))}
          </div>
          <div className="bar-legend">
            <span><i className="dot target" />Target</span>
            <span><i className="dot actual" />Actual</span>
          </div>
        </div>
      </div>

      <div className="dash-lower">
        <div className="panel leads-panel">
          <div className="panel-head with-border">
            <h3>Team Performance</h3>
            <button type="button" className="link-btn">View All</button>
          </div>

          <table className="leads-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Deals Closed</th>
                <th>Leads</th>
                <th>Conversion</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => (
                <tr key={member.name}>
                  <td>
                    <div className="lead-name">
                      <span className="avatar-chip">{member.initials}</span>
                      {member.name}
                    </div>
                  </td>
                  <td className="muted">{member.deals}</td>
                  <td className="muted">{member.leads}</td>
                  <td>
                    <span className="status-pill success">{member.conversion}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel leaderboard-panel">
          <div className="panel-head with-border">
            <div>
              <h3>Top Performers</h3>
              <p>Best conversion rates this month</p>
            </div>
          </div>
          <div className="leaderboard-list">
            {teamMembers.slice(0, 3).map((member, i) => (
              <div className="leaderboard-row" key={member.name}>
                <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                <div className={`avatar-chip${i === 0 ? " top" : ""}`}>
                  {member.initials}
                </div>
                <div className="leaderboard-text">
                  <p>{member.name}</p>
                  <span>{member.deals} closed</span>
                </div>
                {i === 0 ? (
                  <span className="trophy-badge">
                    <Icon name="trophy" size={15} filled />
                  </span>
                ) : (
                  <span className="muted-change">+{member.conversion}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

