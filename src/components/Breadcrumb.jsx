import { useLocation } from "react-router-dom";
import Icon from "./Icon.jsx";
import { findMenuRoot } from "../config/menuConfig.js";

export default function Breadcrumb({ current }) {
  const { pathname } = useLocation();
  const root = findMenuRoot(pathname);
  const rootLabel = root?.title ?? "";
  const leafLabel = current ?? rootLabel;

  return (
    <p className="cl-breadcrumb">
      <span>{rootLabel}</span>
      <Icon name="chevronRight" size={13} />
      <span className="is-current">{leafLabel}</span>
    </p>
  );
}
