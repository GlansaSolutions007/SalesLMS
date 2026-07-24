import React from "react";
import "./CourseList.css";

const courses = [
  {
    id: 1,
    title: "Sales Fundamentals",
    description: "Learn the basic principles of selling and building customer relationships.",
    category: "Sales Skills",
    level: "Beginner",
    lessons: 12,
    enrolled: "1,245",
    progress: 75,
    rating: "4.5",
    status: "Published",
    statusType: "published",
    image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=300",
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
    rating: "4.7",
    status: "Published",
    statusType: "published",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=300",
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
    rating: "4.8",
    status: "Published",
    statusType: "published",
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=300",
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
    rating: "4.4",
    status: "In Progress",
    statusType: "progress",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=300",
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
    rating: "4.6",
    status: "In Progress",
    statusType: "progress",
    image: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=300",
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
    rating: "4.9",
    status: "Draft",
    statusType: "draft",
    image: "https://images.unsplash.com/photo-1556761175-129418cb2dfe?w=300",
  },
];

const stats = [
  {
    title: "Total Courses",
    value: "128",
    change: "12.5%",
    icon: "▣",
    type: "blue",
  },
  {
    title: "Published Courses",
    value: "96",
    change: "14.3%",
    icon: "▶",
    type: "green",
  },
  {
    title: "In Progress",
    value: "24",
    change: "8.9%",
    icon: "◷",
    type: "purple",
  },
  {
    title: "Completed",
    value: "78",
    change: "15.7%",
    icon: "◉",
    type: "orange",
  },
  {
    title: "Avg. Rating",
    value: "4.6",
    change: "★★★★★",
    icon: "☆",
    type: "blue",
  },
];

function StatCard({ stat }) {
  return (
    <div className="course-stat-card">
      <div className={`course-stat-icon ${stat.type}`}>
        {stat.icon}
      </div>

      <div className="course-stat-info">
        <span>{stat.title}</span>

        <strong>{stat.value}</strong>

        <small
          className={
            stat.title === "Avg. Rating" ? "course-stars" : ""
          }
        >
          {stat.title === "Avg. Rating" ? (
            stat.change
          ) : (
            <>
              <b>↑ {stat.change}</b> this month
            </>
          )}
        </small>
      </div>
    </div>
  );
}

function CourseList() {
  return (
    <div className="course-list-page">
      {/* Page Header */}
      <div className="course-page-header">
        <div>
          <h1>Course List</h1>

          <div className="course-breadcrumb">
            <span>Training</span>
            <b>›</b>
            <strong>Courses</strong>
          </div>
        </div>

        <div className="course-header-actions">
          <div className="course-search">
            <span>⌕</span>

            <input placeholder="Search courses..." />
          </div>

          <button className="course-filter-button">
            ⌁ Filters
          </button>

          <button className="course-filter-button">
            ↕ Sort By⌄
          </button>

          <button className="course-add-button">
            + Add New Course
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="course-stats-grid">
        {stats.map((stat) => (
          <StatCard key={stat.title} stat={stat} />
        ))}
      </div>

      {/* Tabs */}
      <div className="course-tabs">
        <button className="active">All Courses</button>
        <button>Published</button>
        <button>In Progress</button>
        <button>Draft</button>
        <button>Archived</button>

        <div className="course-view-toggle">
          <button>▦</button>
          <button className="active">☷</button>
        </div>
      </div>

      {/* Table */}
      <div className="course-table-card">
        <div className="course-table-wrapper">
          <table className="course-table">
            <thead>
              <tr>
                <th>COURSE</th>
                <th>CATEGORY</th>
                <th>LEVEL</th>
                <th>LESSONS</th>
                <th>ENROLLED</th>
                <th>PROGRESS</th>
                <th>RATING</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <div className="course-info">
                      <img
                        src={course.image}
                        alt={course.title}
                      />

                      <div>
                        <strong>{course.title}</strong>

                        <p>{course.description}</p>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="course-category">
                      {course.category}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`course-level ${course.level.toLowerCase()}`}
                    >
                      {course.level}
                    </span>
                  </td>

                  <td>{course.lessons}</td>

                  <td>{course.enrolled}</td>

                  <td>
                    <div className="course-progress">
                      <div className="course-progress-bar">
                        <span
                          style={{
                            width: `${course.progress}%`,
                          }}
                        />
                      </div>

                      <small>{course.progress}%</small>
                    </div>
                  </td>

                  <td>
                    <div className="course-rating">
                      <span>★★★★★</span>
                      <b>{course.rating}</b>
                    </div>
                  </td>

                  <td>
                    <span
                      className={`course-status ${course.statusType}`}
                    >
                      {course.status}
                    </span>
                  </td>

                  <td>
                    <div className="course-actions">
                      <button title="View">◉</button>
                      <button title="More">•••</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="course-table-footer">
          <span>Showing 1 to 6 of 128 courses</span>

          <div className="course-pagination">
            <button>‹</button>

            <button className="active">1</button>

            <button>2</button>

            <button>3</button>

            <span>...</span>

            <button>22</button>

            <button>›</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseList;