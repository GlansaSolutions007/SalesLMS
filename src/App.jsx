import { useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Login from "./pages/login.jsx";
import Dashboard from "./pages/dashboard.jsx";
import Placeholder from "./pages/Placeholder.jsx";
import CourseList from "./pages/courseList.jsx";
import Courses from "./pages/courses.jsx";
import Sidebar from "./components/Sidebar.jsx";
import "./pages/dashboard.css";

const PAGE_PATHS = {
  dashboard: "/dashboard",
  "course-list": "/course-list",
  courses: "/courses",
  pipeline: "/pipeline",
  leads: "/leads",
  leaderboard: "/leaderboard",
};

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const page = location.pathname.slice(1) || "dashboard";

  function handleNavigate(nextPage) {
    navigate(PAGE_PATHS[nextPage] ?? "/dashboard");
  }

  function handleLogout() {
    setAuthenticated(false);
    navigate("/dashboard");
  }

  if (!authenticated) {
    return <Login onLogin={() => {
      setAuthenticated(true);
      navigate("/dashboard");
    }} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={<Dashboard page="dashboard" onNavigate={handleNavigate} onLogout={handleLogout} />}
      />
      <Route
        path="/course-list"
        element={
          <div className="dash-shell">
            <Sidebar active="course-list" onNavigate={handleNavigate} onLogout={handleLogout} />
            <main className="dash-main">
              <CourseList />
            </main>
          </div>
        }
      />
      <Route
        path="/courses"
        element={
          <div className="dash-shell">
            <Sidebar active="courses" onNavigate={handleNavigate} onLogout={handleLogout} />
            <main className="dash-main">
              <Courses />
            </main>
          </div>
        }
      />
      <Route
        path="/:page"
        element={<Placeholder page={page} onNavigate={handleNavigate} onLogout={handleLogout} />}
      />
    </Routes>
  );
}
