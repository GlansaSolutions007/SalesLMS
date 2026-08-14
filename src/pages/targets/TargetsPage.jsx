import { useAuth } from "../../context/AuthContext.jsx";
import TargetList from "./TargetList.jsx";
import MyTarget from "./MyTarget.jsx";

export default function TargetsPage() {
  const { roleName } = useAuth();
  return roleName === "Employee" ? <MyTarget /> : <TargetList />;
}
