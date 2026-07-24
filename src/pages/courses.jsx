import React, { useState } from "react";
import "./Courses.css";

const course = {
  title: "Advanced Sales Strategies",
  category: "Sales Training",
  description:
    "Master advanced sales techniques, objection handling, and closing strategies to improve your conversion rate and drive revenue growth.",
  image:
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
  level: "Intermediate",
  duration: "5h 20m",
  language: "English",
  certificate: "Yes",
  modules: 4,
  lessons: 18,
};

const learningPoints = [
  "Advanced prospecting techniques",
  "Identify high-value opportunities",
  "Master objection handling",
  "Build strong customer relationships",
  "Value-based selling strategies",
  "Negotiation and closing tactics",
  "Sales forecasting and planning",
  "Drive long-term customer loyalty",
];

const modules = [
  {
    id: 1,
    title: "Foundations of Advanced Sales",
    lessons: "4 Lessons",
    duration: "1h 20m",
    open: true,
    items: [
      {
        number: "1.1",
        title: "The Modern Sales Landscape",
        type: "Video",
        duration: "15m",
        completed: true,
      },
      {
        number: "1.2",
        title: "Advanced Sales Mindset",
        type: "Video",
        duration: "18m",
        completed: true,
      },
      {
        number: "1.3",
        title: "Identifying High-Value Opportunities",
        type: "PDF",
        duration: "20m",
        completed: false,
      },
      {
        number: "1.4",
        title: "Sales Process Framework",
        type: "Video",
        duration: "27m",
        completed: false,
      },
    ],
  },
  {
    id: 2,
    title: "Advanced Prospecting Techniques",
    lessons: "5 Lessons",
    duration: "1h 25m",
    open: false,
    items: [],
  },
  {
    id: 3,
    title: "Closing Strategies That Work",
    lessons: "5 Lessons",
    duration: "1h 30m",
    open: false,
    items: [],
  },
  {
    id: 4,
    title: "Sales Leadership & Growth",
    lessons: "4 Lessons",
    duration: "1h 05m",
    open: false,
    items: [],
  },
];

const skills = [
  "Prospecting",
  "Negotiation",
  "Closing",
  "Objection Handling",
  "Communication",
  "Relationship Building",
];

const requirements = [
  "Basic understanding of sales principles",
  "Access to a computer or mobile device",
  "Willingness to learn and implement",
];

const audience = [
  "Sales Representatives",
  "Account Managers",
  "Business Development Professionals",
  "Entrepreneurs and Business Owners",
];

function CourseHeader() {
  return (
    <section className="course-detail-header">
      <div className="course-cover">
        <img src={course.image} alt={course.title} />

        <div className="course-cover-overlay">
          <span>ADVANCED</span>
          <span>SALES</span>
          <span>STRATEGIES</span>
        </div>
      </div>

      <div className="course-header-content">
        <span className="course-category-badge">
          {course.category}
        </span>

        <h1>{course.title}</h1>

        <p className="course-description">
          {course.description}
        </p>

        <div className="course-meta">
          <div className="meta-item">
            <span className="meta-icon">▥</span>

            <div>
              <small>Level</small>
              <strong>{course.level}</strong>
            </div>
          </div>

          <div className="meta-item">
            <span className="meta-icon">◷</span>

            <div>
              <small>Duration</small>
              <strong>{course.duration}</strong>
            </div>
          </div>

          <div className="meta-item">
            <span className="meta-icon">◎</span>

            <div>
              <small>Language</small>
              <strong>{course.language}</strong>
            </div>
          </div>

          <div className="meta-item">
            <span className="meta-icon">♧</span>

            <div>
              <small>Certificate</small>
              <strong>{course.certificate}</strong>
            </div>
          </div>
        </div>

        <div className="course-actions">
          <button className="preview-button">
            ▷ Preview Course
          </button>

          <button className="wishlist-button">
            ♡ Add to Wishlist
          </button>

          <button className="share-button">♧</button>
        </div>
      </div>
    </section>
  );
}

function CourseTabs() {
  return (
    <div className="course-detail-tabs">
      <button className="active">Overview</button>
      <button>Curriculum</button>
      <button>Reviews (128)</button>
      <button>Q&A</button>
      <button>Resources</button>
      <button>Announcements</button>
    </div>
  );
}

function AboutCourse() {
  return (
    <section className="course-section about-section">
      <h2>About This Course</h2>

      <p className="about-description">
        This comprehensive course is designed for sales professionals
        who want to take their skills to the next level. You'll learn
        proven frameworks, advanced negotiation tactics, and how to
        close bigger deals consistently.
      </p>

      <h3>What You'll Learn</h3>

      <div className="learning-grid">
        {learningPoints.map((point) => (
          <div className="learning-item" key={point}>
            <span>✓</span>
            <p>{point}</p>
          </div>
        ))}
      </div>

      <div className="course-stats">
        <div>
          <span>☷</span>
          <strong>4</strong>
          <small>Modules</small>
        </div>

        <div>
          <span>☷</span>
          <strong>18</strong>
          <small>Lessons</small>
        </div>

        <div>
          <span>◷</span>
          <strong>5h 20m</strong>
          <small>Total Duration</small>
        </div>

        <div>
          <span>▥</span>
          <strong>Intermediate</strong>
          <small>Level</small>
        </div>
      </div>
    </section>
  );
}

function Curriculum() {
  const [openModule, setOpenModule] = useState(1);

  return (
    <section className="course-section curriculum-section">
      <div className="section-heading">
        <h2>Curriculum</h2>

        <span>4 Modules • 18 Lessons • 5h 20m Total</span>
      </div>

      <div className="curriculum-list">
        {modules.map((module) => {
          const isOpen = openModule === module.id;

          return (
            <div
              className={`curriculum-module ${
                isOpen ? "opened" : ""
              }`}
              key={module.id}
            >
              <button
                className="module-header"
                onClick={() =>
                  setOpenModule(isOpen ? null : module.id)
                }
              >
                <div>
                  <span>Module {module.id}</span>

                  <strong>{module.title}</strong>
                </div>

                <div>
                  <span>
                    {module.lessons} • {module.duration}
                  </span>

                  <b>{isOpen ? "⌃" : "⌄"}</b>
                </div>
              </button>

              {isOpen && module.items.length > 0 && (
                <div className="lesson-list">
                  {module.items.map((item) => (
                    <div className="lesson-item" key={item.number}>
                      <div className="lesson-left">
                        <span className="lesson-type">
                          {item.type === "PDF" ? "▤" : "▣"}
                        </span>

                        <span className="lesson-number">
                          {item.number}
                        </span>

                        <strong>{item.title}</strong>
                      </div>

                      <div className="lesson-right">
                        <span>{item.type}</span>

                        <span>•</span>

                        <span>{item.duration}</span>

                        <span
                          className={
                            item.completed
                              ? "lesson-completed"
                              : "lesson-pending"
                          }
                        >
                          {item.completed ? "✓" : "○"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button className="full-curriculum-button">
        ▣ &nbsp; View Full Curriculum
      </button>
    </section>
  );
}

function SkillsAndAudience() {
  return (
    <section className="course-section skills-section">
      <h2>Skills You'll Gain</h2>

      <div className="skills-list">
        {skills.map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>

      <div className="requirements-grid">
        <div className="requirements-column">
          <h3>Requirements</h3>

          {requirements.map((item) => (
            <div className="requirement-item" key={item}>
              <span>✓</span>
              <p>{item}</p>
            </div>
          ))}
        </div>

        <div className="audience-column">
          <h3>Who This Course Is For</h3>

          {audience.map((item) => (
            <div className="audience-item" key={item}>
              <span>♙</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StartLearning() {
  return (
    <section className="start-learning">
      <div className="start-learning-icon">♜</div>

      <div>
        <h2>Ready to start your learning journey?</h2>

        <p>
          Join thousands of sales professionals who are advancing
          their careers.
        </p>
      </div>

      <button>Start Learning</button>
    </section>
  );
}

function Courses() {
  return (
    <div className="courses-page">
      <div className="courses-breadcrumb">
        <span>Training</span>
        <b>›</b>
        <span>Courses</span>
        <b>›</b>
        <strong>{course.title}</strong>
      </div>

      <CourseHeader />

      <CourseTabs />

      <AboutCourse />

      <Curriculum />

      <SkillsAndAudience />

      <StartLearning />
    </div>
  );
}

export default Courses;