import Icon from "../components/Icon.jsx";
import Sidebar, { NAV_ITEMS } from "../components/Sidebar.jsx";
import "./dashboard.css";

const stats = [
  { label: "Total Leads", value: "1,284", change: "+12%", trend: "up", icon: "users" },
  { label: "Active Sales", value: "432", change: "+5%", trend: "up", icon: "pipeline" },
  { label: "Follow-ups", value: "89", change: "-2%", trend: "down", icon: "clock" },
  { label: "Revenue", value: "$124.5k", change: "+18%", trend: "up", icon: "coin" },
  { label: "Conv. Rate", value: "12.4%", change: "+3%", trend: "up", icon: "cursor" },
  { label: "Training", value: "88%", change: "+7%", trend: "up", icon: "cap" },
];

const leads = [
  { initials: "SM", name: "Sarah Miller", company: "TechGlobal Inc.", probability: 85, status: "Meeting Set", tone: "info" },
  { initials: "DC", name: "David Chen", company: "CloudNet Solutions", probability: 60, status: "Negotiation", tone: "warning" },
  { initials: "RJ", name: "Robert Jackson", company: "Peak Performance", probability: 95, status: "Proposal Sent", tone: "success" },
];

const leaderboard = [
  { rank: "01", name: "Elena Rodriguez", closed: "$184,200 closed", top: true },
  { rank: "02", name: "Marcus Thorne", closed: "$142,500 closed", change: "+4%" },
  { rank: "03", name: "Jessica Wang", closed: "$121,900 closed", change: "+12%" },
];

const meetings = [
  { date: "14", month: "Oct", title: "Strategy Review - Ford", time: "10:30 AM • Zoom Meeting", highlight: true },
  { date: "14", month: "Oct", title: "Demo: AI Voice Dialer", time: "02:00 PM • HQ Room 4B" },
  { date: "15", month: "Oct", title: "Q4 Sales Kickoff", time: "09:00 AM • Main Ballroom" },
];

const activity = [
  { icon: "check", tone: "success", title: "Course Completed:", text: '"Objection Handling 101" by Marcus Thorne.', time: "12 minutes ago" },
  { icon: "mail", tone: "info", title: "Email Opened:", text: "Follow-up sent to TechGlobal was viewed 4 times.", time: "45 minutes ago" },
  { icon: "warning", tone: "warning", title: "Lead Stagnant:", text: "Acme Corp lead has had no activity for 7 days.", time: "2 hours ago" },
  { icon: "rocket", tone: "purple", title: "New Campaign:", text: '"Winter Enterprise Rush" has been launched.', time: "5 hours ago" },
];

export default function Dashboard({ page = "dashboard", onNavigate, onLogout }) {
  const pageTitle = NAV_ITEMS.find((item) => item.key === page)?.label ?? "Dashboard";

  return (
    <div className="dash-shell">
      <Sidebar active={page} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="dash-main">
        <header className="dash-topbar">
          <div className="dash-search">
            <Icon name="search" size={18} />
            <input placeholder="Search analytics, courses, or leads..." type="text" />
          </div>

          <div className="dash-topbar-actions">
            <div className="dash-status">
              <span className="dash-status-dot" />
              System Online
            </div>
            <button type="button" className="dash-icon-btn dash-bell">
              <Icon name="bell" size={18} />
            </button>
            <div className="dash-divider" />
            <button type="button" className="dash-primary-btn">
              <Icon name="plus" size={16} />
              New Campaign
            </button>
          </div>
        </header>

        <div className="dash-body">
          <div className="dash-welcome">
            <div>
              <h1>{page === "dashboard" ? "Welcome back, John 👋" : pageTitle}</h1>
              <p>Here is a summary of your team's sales performance and training progress.</p>
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
                  <h3>Sales Performance</h3>
                  <p>Monthly sales pipeline value trends</p>
                </div>
                <select>
                  <option>Last 6 Months</option>
                  <option>Year to Date</option>
                </select>
              </div>

              <div className="line-chart">
                <svg viewBox="0 0 800 250" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary-600)" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="var(--color-primary-600)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,200 Q100,150 200,180 T400,100 T600,120 T800,50 L800,250 L0,250 Z" fill="url(#chartFill)" />
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
                <h3>Hot Leads This Week</h3>
                <button type="button" className="link-btn">View All Leads</button>
              </div>

              <table className="leads-table">
                <thead>
                  <tr>
                    <th>Lead Name</th>
                    <th>Company</th>
                    <th>Probability</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.name}>
                      <td>
                        <div className="lead-name">
                          <span className="avatar-chip">{lead.initials}</span>
                          {lead.name}
                        </div>
                      </td>
                      <td className="muted">{lead.company}</td>
                      <td>
                        <div className="probability">
                          <div className="probability-track">
                            <div className={`probability-fill ${lead.tone}`} style={{ width: `${lead.probability}%` }} />
                          </div>
                          <span>{lead.probability}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${lead.tone}`}>{lead.status}</span>
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
                  <h3>Team Leaderboard</h3>
                  <p>Top sales performers this month</p>
                </div>
              </div>

              <div className="leaderboard-list">
                {leaderboard.map((person) => (
                  <div className="leaderboard-row" key={person.rank}>
                    <span className="rank">{person.rank}</span>
                    <div className={`avatar-chip${person.top ? " top" : ""}`}>
                      {person.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="leaderboard-text">
                      <p>{person.name}</p>
                      <span>{person.closed}</span>
                    </div>
                    {person.top ? (
                      <span className="trophy-badge">
                        <Icon name="trophy" size={15} filled />
                      </span>
                    ) : (
                      <span className="muted-change">{person.change}</span>
                    )}
                  </div>
                ))}
              </div>

              <button type="button" className="panel-footer-btn">View Full Leaderboard</button>
            </div>
          </div>

          <div className="dash-lower">
            <div className="panel meetings-panel">
              <div className="panel-head with-border">
                <h3>Upcoming</h3>
                <span className="today-pill">3 Today</span>
              </div>

              <div className="meetings-list">
                {meetings.map((meeting, i) => (
                  <div className={`meeting-row${meeting.highlight ? " is-next" : ""}`} key={i}>
                    <div className="meeting-date">
                      <span>{meeting.date}</span>
                      <small>{meeting.month}</small>
                    </div>
                    <div>
                      <p>{meeting.title}</p>
                      <span>{meeting.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel activity-panel">
              <div className="panel-head with-border">
                <h3>Activity Feed</h3>
                <button type="button" className="filter-btn">Filters</button>
              </div>

              <div className="activity-grid">
                {activity.map((item, i) => (
                  <div className="activity-row" key={i}>
                    <span className={`activity-icon ${item.tone}`}>
                      <Icon name={item.icon} size={14} filled={item.icon === "check"} />
                    </span>
                    <div>
                      <p><b>{item.title}</b> {item.text}</p>
                      <span>{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}