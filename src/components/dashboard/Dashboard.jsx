import { useOutletContext } from "react-router-dom";
import Topbar from "../Topbar.jsx";
import DashboardRouter from "./DashboardRouter.jsx";

export default function Dashboard() {
  const { toggleCollapsed } = useOutletContext();

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <DashboardRouter />
    </>
  );
}

