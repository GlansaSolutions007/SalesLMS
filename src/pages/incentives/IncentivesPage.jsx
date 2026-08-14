import { useAuth } from "../../context/AuthContext.jsx";
import IncentiveList from "./IncentiveList.jsx";
import MyIncentives from "./MyIncentives.jsx";

export default function IncentivesPage() {
  const { roleName } = useAuth();
  return roleName === "Employee" ? <MyIncentives /> : <IncentiveList />;
}
