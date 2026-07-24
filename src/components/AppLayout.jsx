import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import useDocumentTitle from "../hooks/useDocumentTitle.js";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  useDocumentTitle();

  return (
    <div className="dash-shell">
      <Sidebar collapsed={collapsed} onToggleCollapsed={setCollapsed} />
      <main className="dash-main">
        <Outlet context={{ collapsed, toggleCollapsed: () => setCollapsed((c) => !c) }} />
      </main>
    </div>
  );
}
