import Icon from "../Icon.jsx";

function formatCurrency(val) {
  const n = Number(val) || 0;
  return "$" + (n / 1000).toFixed(1) + "k";
}

function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function SuperAdminDashboard({ data }) {
  const stats = data?.stats ?? {};
  const companies = data?.companies ?? [];
  const topByRevenue = data?.topByRevenue ?? [];
  const revenueTrend = data?.revenueTrend ?? [];
  const maxTrend = Math.max(1, ...revenueTrend.map((r) => r.actual));

  const statCards = [
    { label: "Total Companies", value: String(stats.companies ?? 0), icon: "building" },
    { label: "Total Employees", value: String(stats.employees ?? 0), icon: "users" },
    { label: "Active Subscriptions", value: String(stats.active_subscriptions ?? 0), icon: "gift" },
    { label: "Revenue Collected", value: formatCurrency(stats.revenue), icon: "coin" },
    { label: "Active Trainers", value: String(stats.trainers ?? 0), icon: "presentation" },
  ];

  return (
    <div className="dash-body">
      <div className="dash-welcome">
        <div>
          <h1>
            Super Admin Overview <Icon name="grid" size={26} />
          </h1>
          <p>Monitor all companies, subscriptions, and platform revenue.</p>
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

      <div className="dash-charts">
        <div className="panel bar-panel" style={{ gridColumn: "1 / -1" }}>
          <div className="panel-head">
            <div>
              <h3>Platform Revenue (Paid Subscriptions)</h3>
              <p>Last 6 months</p>
            </div>
          </div>
          {revenueTrend.length === 0 ? (
            <p className="ep-empty-note">No paid subscriptions recorded yet.</p>
          ) : (
            <div className="bar-chart">
              {revenueTrend.map((bar) => (
                <div className="bar-track" style={{ height: "100%" }} key={bar.month}>
                  <div className="bar-fill" style={{ height: `${(bar.actual / maxTrend) * 100}%` }} />
                  <span>{bar.month}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dash-lower">
        <div className="panel leads-panel">
          <div className="panel-head with-border">
            <h3>Recently Registered Companies</h3>
          </div>

          <table className="leads-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Employees</th>
                <th>Plan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 && (
                <tr><td colSpan={4} className="muted">No companies yet.</td></tr>
              )}
              {companies.map((company) => (
                <tr key={company.name}>
                  <td>
                    <div className="lead-name">
                      <span className="avatar-chip">{initials(company.name)}</span>
                      {company.name}
                    </div>
                  </td>
                  <td className="muted">{company.employees}</td>
                  <td className="muted">{company.plan}</td>
                  <td>
                    <span className={`status-pill ${company.status === "Active" ? "success" : "warning"}`}>{company.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel leaderboard-panel">
          <div className="panel-head with-border">
            <div>
              <h3>Top Companies by Revenue</h3>
              <p>Highest paid subscription revenue</p>
            </div>
          </div>

          <div className="leaderboard-list">
            {topByRevenue.length === 0 && <p className="ep-empty-note">No revenue recorded yet.</p>}
            {topByRevenue.map((company, i) => (
              <div className="leaderboard-row" key={company.name + i}>
                <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                <div className={`avatar-chip${i === 0 ? " top" : ""}`}>{initials(company.name)}</div>
                <div className="leaderboard-text">
                  <p>{company.name}</p>
                  <span>{formatCurrency(company.revenue)}</span>
                </div>
                {i === 0 && (
                  <span className="trophy-badge">
                    <Icon name="trophy" size={15} filled />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
