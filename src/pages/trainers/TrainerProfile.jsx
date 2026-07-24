import { useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import Icon from "../../components/Icon.jsx";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Badge from "../../components/Badge.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";
import StarRating from "../../components/StarRating.jsx";
import DataTable from "../../components/DataTable.jsx";
import SubNavTabs from "../../components/SubNavTabs.jsx";
import { TRAINERS } from "./trainerData.js";
import { ROUTES } from "../../router/routePaths.js";
import "../employees/EmployeeProfile.css";
import "./TrainerProfile.css";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "skills", label: "Skills" },
  { key: "courses", label: "Course Allocation" },
  { key: "schedule", label: "Schedule" },
  { key: "attendance", label: "Attendance" },
  { key: "performance", label: "Performance" },
  { key: "feedback", label: "Feedback" },
];

const STATUS_TONE = { Active: "green", "On Leave": "orange", Inactive: "gray" };

// Mock per-trainer detail (frontend-only stage — same shape for every
// trainer until a real backend can serve per-trainer records).
const SKILLS = [
  { name: "Sales Coaching", level: "Advanced" },
  { name: "Curriculum Design", level: "Advanced" },
  { name: "Public Speaking", level: "Advanced" },
  { name: "LMS Tools", level: "Intermediate" },
  { name: "Assessment Design", level: "Intermediate" },
];

const SKILL_TONE = { Advanced: "green", Intermediate: "blue", Beginner: "orange" };

const COURSES = [
  { id: 1, course: "Sales Fundamentals", category: "Sales Skills", learners: 42, status: "Ongoing" },
  { id: 2, course: "Negotiation Mastery", category: "Negotiation", learners: 28, status: "Scheduled" },
  { id: 3, course: "Objection Handling", category: "Sales Skills", learners: 35, status: "Completed" },
];

const COURSE_TONE = { Ongoing: "green", Scheduled: "blue", Completed: "gray" };

const SCHEDULE = [
  { id: 1, date: "2026-07-25", time: "10:00 AM", batch: "Batch A - Jul 2026", topic: "Handling Objections" },
  { id: 2, date: "2026-07-27", time: "02:00 PM", batch: "Batch A - Jul 2026", topic: "Closing Techniques" },
  { id: 3, date: "2026-08-03", time: "10:00 AM", batch: "Batch C - Aug 2026", topic: "Negotiation Foundations" },
];

const ATTENDANCE = [
  { id: 1, date: "2026-07-06", batch: "Batch A - Jul 2026", status: "Present" },
  { id: 2, date: "2026-07-08", batch: "Batch A - Jul 2026", status: "Present" },
  { id: 3, date: "2026-07-10", batch: "Batch A - Jul 2026", status: "Late" },
  { id: 4, date: "2026-07-13", batch: "Batch B - Jul 2026", status: "Absent" },
];

const ATTENDANCE_TONE = { Present: "green", Late: "orange", Absent: "gray" };

const PERFORMANCE = [
  { id: 1, label: "Jan", score: 88 },
  { id: 2, label: "Feb", score: 85 },
  { id: 3, label: "Mar", score: 90 },
  { id: 4, label: "Apr", score: 92 },
  { id: 5, label: "May", score: 87 },
  { id: 6, label: "Jun", score: 94 },
];

const FEEDBACK = [
  { id: 1, batch: "Batch A - Jul 2026", rating: 4.8, comment: "Very engaging sessions, clear explanations.", date: "2026-07-11" },
  { id: 2, batch: "Batch D - Jun 2026", rating: 4.5, comment: "Great real-world examples.", date: "2026-06-20" },
  { id: 3, batch: "Batch F - Jun 2026", rating: 4.6, comment: "Well paced, good Q&A handling.", date: "2026-07-04" },
];

const COURSE_COLUMNS = [
  { key: "course", header: "Course", render: (r) => <b>{r.course}</b> },
  { key: "category", header: "Category" },
  { key: "learners", header: "Learners" },
  { key: "status", header: "Status", render: (r) => <Badge tone={COURSE_TONE[r.status]}>{r.status}</Badge> },
];

const SCHEDULE_COLUMNS = [
  { key: "date", header: "Date" },
  { key: "time", header: "Time" },
  { key: "batch", header: "Batch" },
  { key: "topic", header: "Topic" },
];

const ATTENDANCE_COLUMNS = [
  { key: "date", header: "Date" },
  { key: "batch", header: "Batch" },
  { key: "status", header: "Status", render: (r) => <Badge tone={ATTENDANCE_TONE[r.status]}>{r.status}</Badge> },
];

function initials(name) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function TrainerProfile() {
  const { toggleCollapsed } = useOutletContext();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");

  // No trainer id in the URL by design (see /trainers/profile) — the row is
  // passed via router state from TrainerList; direct URL access falls back
  // to the first trainer so the route still renders something real.
  const trainer = state?.trainer ?? TRAINERS[0];

  return (
    <>
      <Topbar
        onMenuClick={toggleCollapsed}
        searchPlaceholder="Search..."
        notifications={3}
        messages={5}
        user={{ name: "John Smith", role: "Sales Manager", initials: "JS" }}
      />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <button type="button" className="cl-btn ep-back-btn" onClick={() => navigate(ROUTES.TRAINERS)}>
              <Icon name="back" size={15} />
              Back to Trainers
            </button>
            <h1>{trainer.name}</h1>
            <Breadcrumb current={trainer.name} />
          </div>
        </div>

          <div className="panel ep-header-card">
            <span className="emp-avatar ep-avatar">{initials(trainer.name)}</span>
            <div className="ep-header-info">
              <h2>{trainer.name}</h2>
              <p>{trainer.expertise}</p>
              <div className="ep-header-meta">
                <span>
                  <Icon name="star" size={14} filled />
                  {trainer.rating} rating
                </span>
                <span>
                  <Icon name="book" size={14} />
                  {trainer.coursesAssigned} courses · {trainer.batchesAssigned} batches
                </span>
              </div>
            </div>
            <Badge tone={STATUS_TONE[trainer.status]}>{trainer.status}</Badge>
          </div>

          <SubNavTabs tabs={TABS} active={tab} onNavigate={setTab} />

          <div className="panel ep-tab-panel">
            {tab === "overview" && (
              <div className="ep-overview-grid">
                <div>
                  <span>Trainer Code</span>
                  <p>{trainer.trainerCode}</p>
                </div>
                <div>
                  <span>Expertise</span>
                  <p>{trainer.expertise}</p>
                </div>
                <div>
                  <span>Courses Assigned</span>
                  <p>{trainer.coursesAssigned}</p>
                </div>
                <div>
                  <span>Batches Assigned</span>
                  <p>{trainer.batchesAssigned}</p>
                </div>
                <div>
                  <span>Rating</span>
                  <p>{trainer.rating} / 5</p>
                </div>
                <div>
                  <span>Status</span>
                  <p>{trainer.status}</p>
                </div>
              </div>
            )}

            {tab === "skills" && (
              <div className="ep-skills">
                {SKILLS.map((skill) => (
                  <div className="ep-skill-row" key={skill.name}>
                    <span>{skill.name}</span>
                    <Badge tone={SKILL_TONE[skill.level]}>{skill.level}</Badge>
                  </div>
                ))}
              </div>
            )}

            {tab === "courses" && <DataTable columns={COURSE_COLUMNS} rows={COURSES} emptyMessage="No courses allocated." />}

            {tab === "schedule" && <DataTable columns={SCHEDULE_COLUMNS} rows={SCHEDULE} emptyMessage="No upcoming sessions." />}

            {tab === "attendance" && <DataTable columns={ATTENDANCE_COLUMNS} rows={ATTENDANCE} emptyMessage="No attendance records." />}

            {tab === "performance" && (
              <div className="ep-targets">
                {PERFORMANCE.map((p) => (
                  <div className="ep-target-row" key={p.id}>
                    <div className="ep-target-head">
                      <span>{p.label}</span>
                      <span className="ep-target-value">{p.score}/100</span>
                    </div>
                    <ProgressBar value={p.score} />
                  </div>
                ))}
              </div>
            )}

            {tab === "feedback" && (
              <div className="ep-contacts">
                {FEEDBACK.map((f) => (
                  <div className="ep-contact-card tp-feedback-card" key={f.id}>
                    <div className="tp-feedback-head">
                      <b>{f.batch}</b>
                      <StarRating value={f.rating} size={13} />
                    </div>
                    <p className="tp-feedback-comment">{f.comment}</p>
                    <span className="tp-feedback-date">{f.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
    </>
  );
}
