import Icon from "../Icon.jsx";

const stats = [
  { label: "Employees", value: "156", change: "+8", trend: "up", icon: "users" },
  { label: "Trainers", value: "12", change: "+2", trend: "up", icon: "presentation" },
  { label: "Active Courses", value: "24", change: "+3", trend: "up", icon: "book" },
  { label: "Today's Training", value: "6", change: "", trend: "up", icon: "cap" },
  { label: "Sales Overview", value: "$89.5k", change: "+15%", trend: "up", icon: "coin" },
];

const todaySessions = [
  { time: "09:00 AM", title: "Objection Handling", trainer: "Elena Rodriguez", attendees: 12 },
  { time: "10:30 AM", title: "Product Knowledge - Level 2", trainer: "Marcus Thorne", attendees: 8 },
  { time: "02:00 PM", title: "CRM Mastery Workshop", trainer: "Jessica Wang", attendees: 15 },
  { time: "04:00 PM", title: "Sales Pitch Practice", trainer: "Robert Jackson", attendees: 10 },
];

const salesData = [
  { month: "JUL", target: 40, actual: 70 },
  { month: "AUG", target: 60, actual: 85 },
  { month: "SEP", target: 50, actual: 90 },
  { month: "OCT", target: 80, actual: 65 },
];

export default function CompanyAdminDashboard() {
  return (
    <div className="dash-body">
      <div className="dash-welcome">
        <div>
          <h1>
            Company Dashboard <Icon name="building" size={26} />
          </h1>
          <p>Manage your employees, trainers, courses and track training progress.</p>
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
              <h3>Sales Overview</h3>
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
                <linearGradient id="chartFillCa" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary-600)" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="var(--color-primary-600)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,200 Q100,150 200,180 T400,100 T600,120 T800,50 L800,250 L0,250 Z" fill="url(#chartFillCa)" />
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
            {salesData.map((bar) => (
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
            <h3>Today's Training Sessions</h3>
            <span className="today-pill">{todaySessions.length} Sessions</span>
          </div>

          <table className="leads-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Session</th>
                <th>Trainer</th>
                <th>Attendees</th>
              </tr>
            </thead>
            <tbody>
              {todaySessions.map((session, i) => (
                <tr key={i}>
                  <td className="muted">{session.time}</td>
                  <td>
                    <div className="lead-name">
                      {session.title}
                    </div>
                  </td>
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
              <h3>Active Courses</h3>
              <p>Top performing courses this month</p>
            </div>
          </div>

          <div className="leaderboard-list">
            {[
              { title: "Objection Handling 101", enrolled: 42, completion: "88%" },
              { title: "Advanced Negotiation", enrolled: 35, completion: "76%" },
              { title: "CRM Mastery", enrolled: 28, completion: "92%" },
            ].map((course, i) => (
              <div className="leaderboard-row" key={course.title}>
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

          <button type="button" className="panel-footer-btn">View All Courses</button>
        </div>
      </div>
    </div>
  );
}

