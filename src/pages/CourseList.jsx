import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import Topbar from "../components/Topbar.jsx";
import Badge from "../components/Badge.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import StarRating from "../components/StarRating.jsx";
import Pagination from "../components/Pagination.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import "./CourseList.css";

const STATS = [
  { key: "total", label: "Total Courses", value: "128", change: "12.5%", icon: "book", tone: "blue" },
  { key: "published", label: "Published Courses", value: "96", change: "14.3%", icon: "play", tone: "green" },
  { key: "progress", label: "In Progress", value: "24", change: "8.9%", icon: "clock", tone: "purple" },
  { key: "completed", label: "Completed", value: "78", change: "15.7%", icon: "check", tone: "orange" },
];

const TABS = ["All Courses", "Published", "In Progress", "Draft", "Archived"];

const CATEGORY_TONE = {
  "Sales Skills": "blue",
  Communication: "purple",
  Negotiation: "green",
  Product: "orange",
};

const LEVEL_TONE = {
  Beginner: "green",
  Intermediate: "blue",
  Advanced: "orange",
};

const STATUS_TONE = {
  Published: "green",
  "In Progress": "blue",
  Draft: "gray",
};

const COURSES = [
  {
    id: 1,
    title: "Sales Fundamentals",
    description: "Learn the basic principles of selling and building customer relationships.",
    category: "Sales Skills",
    level: "Beginner",
    lessons: 12,
    enrolled: "1,245",
    progress: 75,
    rating: 4.5,
    status: "Published",
    thumbIcon: "barChart",
    thumbTone: "blue",
  },
  {
    id: 2,
    title: "Effective Communication",
    description: "Improve your communication skills to influence and persuade customers.",
    category: "Communication",
    level: "Intermediate",
    lessons: 15,
    enrolled: "987",
    progress: 40,
    rating: 4.7,
    status: "Published",
    thumbIcon: "mail",
    thumbTone: "purple",
  },
  {
    id: 3,
    title: "Negotiation Mastery",
    description: "Master negotiation techniques and close more deals successfully.",
    category: "Negotiation",
    level: "Advanced",
    lessons: 18,
    enrolled: "654",
    progress: 60,
    rating: 4.8,
    status: "Published",
    thumbIcon: "users",
    thumbTone: "green",
  },
  {
    id: 4,
    title: "Product Knowledge",
    description: "Deep dive into product features and benefits to sell with confidence.",
    category: "Product",
    level: "Beginner",
    lessons: 10,
    enrolled: "1,102",
    progress: 20,
    rating: 4.4,
    status: "In Progress",
    thumbIcon: "users",
    thumbTone: "orange",
  },
  {
    id: 5,
    title: "Objection Handling",
    description: "Learn how to handle objections and turn them into opportunities.",
    category: "Sales Skills",
    level: "Intermediate",
    lessons: 14,
    enrolled: "856",
    progress: 30,
    rating: 4.6,
    status: "In Progress",
    thumbIcon: "flag",
    thumbTone: "teal",
  },
  {
    id: 6,
    title: "Advanced Closing Techniques",
    description: "Advanced strategies to close larger deals and increase win rate.",
    category: "Sales Skills",
    level: "Advanced",
    lessons: 16,
    enrolled: "432",
    progress: 0,
    rating: 4.9,
    status: "Draft",
    thumbIcon: "barChart",
    thumbTone: "pink",
  },
];

const TOTAL_COURSES = 128;
const TOTAL_PAGES = Math.ceil(TOTAL_COURSES / COURSES.length);

export default function CourseList() {
  const { toggleCollapsed } = useOutletContext();
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [view, setView] = useState("list");
  const [page, setPage] = useState(1);

  const filteredCourses = useMemo(() => {
    if (activeTab === "All Courses") return COURSES;
    return COURSES.filter((c) => c.status === activeTab);
  }, [activeTab]);

  return (
    <>
      <Topbar
        onMenuClick={toggleCollapsed}
        searchPlaceholder="Search courses, topics or skills..."
        notifications={3}
        messages={5}
        user={{ name: "John Smith", role: "Sales Manager", initials: "JS" }}
      />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>Course List</h1>
            <Breadcrumb current="Course List" />
          </div>

            <div className="cl-actions">
              <div className="cl-search">
                <Icon name="search" size={16} />
                <input type="text" placeholder="Search courses..." />
              </div>

              <button type="button" className="cl-btn">
                <Icon name="filter" size={16} />
                Filters
              </button>

              <button type="button" className="cl-btn">
                <Icon name="sort" size={16} />
                Sort By
                <Icon name="chevronDown" size={14} />
              </button>

              <button type="button" className="dash-primary-btn cl-add-btn">
                <Icon name="plus" size={16} />
                Add New Course
              </button>
            </div>
          </div>

          <div className="cl-stats">
            {STATS.map((stat) => (
              <div className="cl-stat-card" key={stat.key}>
                <div className={`cl-stat-icon tone-${stat.tone}`}>
                  <Icon name={stat.icon} size={20} filled={stat.icon === "play"} />
                </div>
                <div className="cl-stat-text">
                  <p className="cl-stat-label">{stat.label}</p>
                  <p className="cl-stat-value">{stat.value}</p>
                  <span className="cl-stat-change">
                    <Icon name="arrowUp" size={11} />
                    {stat.change}
                  </span>{" "}
                  <span className="cl-stat-period">this month</span>
                </div>
              </div>
            ))}

            <div className="cl-stat-card">
              <div className="cl-stat-icon tone-blue">
                <Icon name="star" size={20} filled />
              </div>
              <div className="cl-stat-text">
                <p className="cl-stat-label">Avg. Rating</p>
                <p className="cl-stat-value">4.6</p>
                <StarRating value={4.6} showValue={false} size={12} />
              </div>
            </div>
          </div>

          <div className="panel cl-panel">
            <div className="cl-tabs-row">
              <div className="cl-tabs">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`cl-tab${activeTab === tab ? " is-active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="cl-view-toggle">
                <button
                  type="button"
                  className={view === "grid" ? "is-active" : ""}
                  aria-label="Grid view"
                  onClick={() => setView("grid")}
                >
                  <Icon name="gridView" size={16} />
                </button>
                <button
                  type="button"
                  className={view === "list" ? "is-active" : ""}
                  aria-label="List view"
                  onClick={() => setView("list")}
                >
                  <Icon name="listView" size={16} />
                </button>
              </div>
            </div>

            <div className="cl-table-wrap">
              <table className="cl-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Category</th>
                    <th>Level</th>
                    <th>Lessons</th>
                    <th>Enrolled</th>
                    <th>Progress</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => (
                    <tr key={course.id}>
                      <td>
                        <div className="cl-course-cell">
                          <div className={`cl-thumb tone-${course.thumbTone}`}>
                            <Icon name={course.thumbIcon} size={22} />
                          </div>
                          <div>
                            <p className="cl-course-title">{course.title}</p>
                            <p className="cl-course-desc">{course.description}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge tone={CATEGORY_TONE[course.category]}>{course.category}</Badge>
                      </td>
                      <td>
                        <Badge tone={LEVEL_TONE[course.level]}>{course.level}</Badge>
                      </td>
                      <td className="cl-numeric">{course.lessons}</td>
                      <td className="cl-numeric">{course.enrolled}</td>
                      <td>
                        <ProgressBar value={course.progress} />
                      </td>
                      <td>
                        <StarRating value={course.rating} />
                      </td>
                      <td>
                        <Badge tone={STATUS_TONE[course.status]}>{course.status}</Badge>
                      </td>
                      <td>
                        <div className="cl-row-actions">
                          <button type="button" className="dash-icon-btn" aria-label="View course">
                            <Icon name="eye" size={16} />
                          </button>
                          <button type="button" className="dash-icon-btn" aria-label="More actions">
                            <Icon name="more" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="cl-footer">
              <p>
                Showing 1 to {filteredCourses.length} of {TOTAL_COURSES} courses
              </p>
              <Pagination page={page} totalPages={TOTAL_PAGES} onPageChange={setPage} />
            </div>
          </div>
        </div>
    </>
  );
}
