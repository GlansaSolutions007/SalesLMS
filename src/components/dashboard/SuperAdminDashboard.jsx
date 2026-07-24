import Icon from "../Icon.jsx";

const stats = [
  { label: "Total Companies", value: "48", change: "+3", trend: "up", icon: "building" },
  { label: "Total Employees", value: "1,284", change: "+12%", trend: "up", icon: "users" },
  { label: "Active Subscriptions", value: "42", change: "+2", trend: "up", icon: "gift" },
  { label: "Revenue", value: "$248.5k", change: "+18%", trend: "up", icon: "coin" },
  { label: "Analytics", value: "89%", change: "+5%", trend: "up", icon: "pieChart" },
];

const companies = [
  { name: "TechGlobal Inc.", employees: 342, plan: "Enterprise", status: "Active", tone: "success" },
  { name: "CloudNet Solutions", employees: 156, plan: "Professional", status: "Active", tone: "success" },
  { name: "Peak Performance", employees: 89, plan: "Standard", status: "Active", tone: "success" },
  { name: "Acme Corp", employees: 210, plan: "Enterprise", status: "Suspended", tone: "warning" },
];

const revenueData = [
  { month: "JUL", target: 180000, actual: 210000 },
  { month: "AUG", target: 200000, actual: 245000 },
  { month: "SEP", target: 220000, actual: 265000 },
  { month: "OCT", target: 250000, actual: 248500 },
];

function formatCurrency(val) {
  return "$" + (val / 1000).toFixed(0) + "k";
}

export default function SuperAdminDashboard() {
  return (
    <div className="dash-body">
      <div className="dash-welcome">
        <div>
          <h1>
            Super Admin Overview <Icon name="grid" size={26} />
          </h1>
          <p>Monitor all companies, subscriptions, and platform revenue.</p>
        </div>
        <div className="dash-welcome-actions">
          <button type="button" className="dash-ghost-btn">
            <Icon name="calendar" size={16} />
            Oct 12 - Oct 19, 2023
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
              <h3>Platform Revenue</h3>
              <p>Monthly subscription revenue trends</p>
            </div>
            <select>
              <option>Last 6 Months</option>
              <option>Year to Date</option>
            </select>
          </div>

          <div className="line-chart">
            <svg viewBox="0 0 800 250" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartFillSa" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary-600)" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="var(--color-primary-600)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,200 Q100,150 200,180 T400,100 T600,120 T800,50 L800,250 L0,250 Z" fill="url(#chartFillSa)" />
              <path d="M0,200 Q100,150 200,180 T400,100 T600,120 T800,50" fill="none" stroke="var(--color-primary-600)" strokeWidth="4" strokeLinecap="round" />
              <circle cx="800" cy="50" r="6" fill="var(--color-primary-600)" />
            </svg>
            <div className="line-chart-labels">
              <span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span>
            </div>
          </div>
        </div>

        <div className="panel bar-panel">
          <div className="panel-head">
            <div>
              <h3>Revenue Targets</h3>
              <p>Targets vs Achievement</p>
            </div>
          </div>
          <div className="bar-chart">
            {revenueData.map((bar) => (
              <div className="bar-track" style={{ height: `${(bar.target / 250000) * 100}%` }} key={bar.month}>
                <div className="bar-fill" style={{ height: `${(bar.actual / 250000) * 100}%` }} />
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
            <h3>Registered Companies</h3>
            <button type="button" className="link-btn">View All Companies</button>
          </div>

          <table className="leads-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Employees</th>
                <th>Plan</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.name}>
                  <td>
                    <div className="lead-name">
                      <span className="avatar-chip">{company.name.split(" ").map((n) => n[0]).join("")}</span>
                      {company.name}
                    </div>
                  </td>
                  <td className="muted">{company.employees}</td>
                  <td className="muted">{company.plan}</td>
                  <td>
                    <span className={`status-pill ${company.tone}`}>{company.status}</span>
                  </td>
                  <td>
                    <button type="button" className="dash-icon-btn">
                      <Icon name="more" size={16} />
                    </button>
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
              <p>Highest subscription revenue this quarter</p>
            </div>
          </div>

          <div className="leaderboard-list">
            {[
              { rank: "01", name: "TechGlobal Inc.", revenue: "$84,200", top: true },
              { rank: "02", name: "CloudNet Solutions", revenue: "$62,500", change: "+4%" },
              { rank: "03", name: "Peak Performance", revenue: "$41,900", change: "+12%" },
            ].map((company) => (
              <div className="leaderboard-row" key={company.rank}>
                <span className="rank">{company.rank}</span>
                <div className={`avatar-chip${company.top ? " top" : ""}`}>
                  {company.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="leaderboard-text">
                  <p>{company.name}</p>
                  <span>{company.revenue}</span>
                </div>
                {company.top ? (
                  <span className="trophy-badge">
                    <Icon name="trophy" size={15} filled />
                  </span>
                ) : (
                  <span className="muted-change">{company.change}</span>
                )}
              </div>
            ))}
          </div>

          <button type="button" className="panel-footer-btn">View Full Report</button>
        </div>
      </div>
    </div>
  );
}

