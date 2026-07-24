import Icon from "../Icon.jsx";

const stats = [
  { label: "My Courses", value: "8", change: "+2", trend: "up", icon: "book" },
  { label: "Today's Sessions", value: "4", change: "", trend: "up", icon: "presentation" },
  { label: "Attendance", value: "92%", change: "+5%", trend: "up", icon: "users" },
  { label: "Assessments", value: "24", change: "+3", trend: "up", icon: "clipboard" },
];

const todaySessions = [
  { time: "09:00 AM", course: "Objection Handling 101", batch: "Sales Batch A", room: "Room 4B", attendees: 12 },
  { time: "10:30 AM", course: "Product Knowledge - Level 2", batch: "Sales Batch B", room: "Room 4C", attendees: 8 },
  { time: "02:00 PM", course: "CRM Mastery Workshop", batch: "Sales Batch A", room: "Training Hall", attendees: 15 },
  { time: "04:00 PM", course: "Sales Pitch Practice", batch: "Sales Batch C", room: "Room 4A", attendees: 10 },
];

const pendingAssessments = [
  { title: "Objection Handling Quiz", submissions: 18, pending: 8, due: "Today" },
  { title: "Product Knowledge Test", submissions: 22, pending: 5, due: "Tomorrow" },
  { title: "CRM Practical Exam", submissions: 15, pending: 12, due: "Oct 20" },
];

export default function TrainerDashboard() {
  return (
    <div className="dash-body">
      <div className="dash-welcome">
        <div>
          <h1>
            Trainer Dashboard <Icon name="cap" size={26} />
          </h1>
          <p>Manage your courses, sessions, and track student progress.</p>
        </div>
        <div className="dash-welcome-actions">
          <button type="button" className="dash-ghost-btn">
            <Icon name="calendar" size={16} />
            Today
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
              <h3>Attendance Overview</h3>
              <p>Average attendance rate across courses</p>
            </div>
            <select>
              <option>Last 6 Months</option>
              <option>Year to Date</option>
            </select>
          </div>

          <div className="line-chart">
            <svg viewBox="0 0 800 250" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartFillTr" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary-600)" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="var(--color-primary-600)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,200 Q100,150 200,180 T400,100 T600,120 T800,50 L800,250 L0,250 Z" fill="url(#chartFillTr)" />
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
              <h3>Assessment Completion</h3>
              <p>Submissions received vs pending</p>
            </div>
          </div>
          <div className="bar-chart">
            {pendingAssessments.map((assess) => (
              <div className="bar-track" style={{ height: `${(assess.submissions / 30) * 100}%` }} key={assess.title}>
                <div className="bar-fill" style={{ height: `${((assess.submissions - assess.pending) / 30) * 100}%` }} />
                <span>{assess.title.split(" ")[0]}</span>
              </div>
            ))}
          </div>
          <div className="bar-legend">
            <span><i className="dot target" />Submitted</span>
            <span><i className="dot actual" />Pending</span>
          </div>
        </div>
      </div>

      <div className="dash-lower">
        <div className="panel leads-panel">
          <div className="panel-head with-border">
            <h3>Today's Sessions</h3>
            <span className="today-pill">{todaySessions.length} Today</span>
          </div>

          <table className="leads-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Course</th>
                <th>Batch</th>
                <th>Room</th>
                <th>Attendees</th>
              </tr>
            </thead>
            <tbody>
              {todaySessions.map((session, i) => (
                <tr key={i}>
                  <td className="muted">{session.time}</td>
                  <td>
                    <div className="lead-name">
                      {session.course}
                    </div>
                  </td>
                  <td className="muted">{session.batch}</td>
                  <td className="muted">{session.room}</td>
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
              <h3>Pending Assessments</h3>
              <p>Assessments awaiting your evaluation</p>
            </div>
          </div>

          <div className="leaderboard-list">
            {pendingAssessments.map((assess, i) => (
              <div className="leaderboard-row" key={assess.title}>
                <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                <div className="avatar-chip" style={{ width: 36, height: 36 }}>
                  <Icon name="clipboard" size={16} />
                </div>
                <div className="leaderboard-text">
                  <p>{assess.title}</p>
                  <span>{assess.pending} pending of {assess.submissions} submitted</span>
                </div>
                <span className={`status-pill ${assess.due === "Today" ? "warning" : "info"}`} style={{ fontSize: 10 }}>
                  {assess.due}
                </span>
              </div>
            ))}
          </div>

          <button type="button" className="panel-footer-btn">View All Assessments</button>
        </div>
      </div>
    </div>
  );
}

