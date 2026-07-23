import { useState } from "react";
import Login from "./pages/login.jsx";
import Dashboard from "./pages/dashboard.jsx";

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  return authenticated ? (
    <Dashboard onLogout={() => setAuthenticated(false)} />
  ) : (
    <Login onLogin={() => setAuthenticated(true)} />
  );
}
