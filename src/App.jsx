import { useState } from "react";
import Login from "./pages/login.jsx";
import Dashboard from "./pages/dashboard.jsx";
import Placeholder from "./pages/Placeholder.jsx";

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [page, setPage] = useState("dashboard");

  function handleLogout() {
    setAuthenticated(false);
    setPage("dashboard");
  }

  if (!authenticated) {
    return <Login onLogin={() => setAuthenticated(true)} />;
  }

  if (page === "dashboard") {
    return <Dashboard page={page} onNavigate={setPage} onLogout={handleLogout} />;
  }

  return <Placeholder page={page} onNavigate={setPage} onLogout={handleLogout} />;
}