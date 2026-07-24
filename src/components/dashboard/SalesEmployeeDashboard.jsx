import Icon from "../Icon.jsx";

const stats = [
  { label: "My Courses", value: "6", change: "+2", trend: "up", icon: "book" },
  { label: "My Leads", value: "28", change: "+5", trend: "up", icon: "users" },
  { label: "Tasks", value: "12", change: "-3", trend: "down", icon: "clipboard" },
  { label: "Certificates", value: "4", change: "+1", trend: "up", icon: "trophy" },
];

const myLeads = [
  { initials: "SM", name: "Sarah Miller", company: "TechGlobal Inc.", probability: 85, status: "Meeting Set", tone: "info" },
  { initials: "DC", name: "David Chen", company: "CloudNet Solutions", probability: 60, status: "Negotiation", tone: "warning" },
  { initials: "RJ", name: "Robert Jackson", company: "Peak Performance", probability: 95, status: "Proposal Sent", tone: "success" },
];

const tasks = [
  { title: "Follow-up with TechGlobal", due: "Today, 5:00 PM", priority: "High", tone: "danger" },
  { title: "Complete Objection Handling Module", due: "Tomorrow, 12:00 PM", priority: "Medium", tone: "warning" },
  { title: "Submit Weekly Report", due: "Oct 20, 2023", priority: "Low", tone: "info" },
  { title: "Prepare for Sales Demo", due: "Oct 22, 2023", priority: "Medium", tone: "warning" },
];

const courses = [
  { title: "Objection Handling 101", progress: 75, instructor: "Elena Rodriguez" },
  { title: "Advanced Negotiation Skills", progress: 45, instructor: "Marcus Thorne" },
  { title: "CRM Mastery", progress: 90, instructor: "Jessica Wang" },
];

export default function SalesEmployeeDashboard() {
  return (
    <div className="dash-body">
      <div className="dash-welcome">
        <div>
          <h1>
            My Dashboard <Icon name="star" size={26} filled />
          </h1>
          <p>Track your courses, leads, and daily tasks.</p>
        </div>
        <div className="dash-welcome-actions">
          <button type="button" className="dash-ghost-btn">
            <Icon name="calendar" size={16} />
            This Week
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

      <div className="dash-lower">
        <div className="panel leads-panel">
          <div className="panel-head with-border">
            <h3>My Leads</h3>
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
              {myLeads.map((lead) => (
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
              <h3>My Courses</h3>
              <p>Continue your learning journey</p>
            </div>
          </div>
          <div className="leaderboard-list">
            {courses.map((course) => (
              <div className="leaderboard-row" key={course.title}>
                <div className="avatar-chip" style={{ width: 36, height: 36 }}>
                  <Icon name="book" size={16} />
                </div>
                <div className="leaderboard-text">
                  <p>{course.title}</p>
                  <span>{course.instructor}</span>
                </div>
                <span className="muted-change">{course.progress}%</span>
              </div>
            ))}
          </div>
          <button type="button" className="panel-footer-btn">View All Courses</button>
        </div>
      </div>

      <div className="dash-lower">
        <div className="panel meetings-panel">
          <div className="panel-head with-border">
            <h3>Tasks</h3>
            <span className="today-pill">{tasks.filter((t) => t.priority === "High").length} High</span>
          </div>

          <div className="meetings-list">
            {tasks.map((task, i) => (
              <div className={`meeting-row${task.priority === "High" ? " is-next" : ""}`} key={i}>
                <div className="meeting-date" style={{ background: "transparent", width: 36, height: 36 }}>
                  <span className={`status-pill ${task.tone}`} style={{ fontSize: 8 }}>{task.priority}</span>
                </div>
                <div>
                  <p>{task.title}</p>
                  <span>{task.due}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel activity-panel">
          <div className="panel-head with-border">
            <h3>My Certificates</h3>
            <button type="button" className="filter-btn">View All</button>
          </div>

          <div className="activity-grid">
            {[
              { icon: "trophy", tone: "success", title: "Sales Fundamentals", text: "Completed with 92% score.", time: "Issued Oct 2023" },
              { icon: "trophy", tone: "info", title: "Product Knowledge", text: "Completed with 88% score.", time: "Issued Sep 2023" },
              { icon: "trophy", tone: "success", title: "CRM Essentials", text: "Completed with 95% score.", time: "Issued Aug 2023" },
              { icon: "trophy", tone: "info", title: "Communication Skills", text: "Completed with 85% score.", time: "Issued Jul 2023" },
            ].map((item, i) => (
              <div className="activity-row" key={i}>
                <span className={`activity-icon ${item.tone}`}>
                  <Icon name={item.icon} size={14} filled />
                </span>
                <div>
                  <p><b>{item.title}</b></p>
                  <p style={{ fontSize: 11, color: "var(--color-muted)" }}>{item.text}</p>
                  <span>{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

