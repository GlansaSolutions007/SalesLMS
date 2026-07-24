import { useEffect } from "react";
import Icon from "./Icon.jsx";
import "./Toast.css";

export default function Toast({ tone = "success", message, onDismiss, duration = 3200 }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => onDismiss?.(), duration);
    return () => clearTimeout(timer);
  }, [message, duration, onDismiss]);

  if (!message) return null;

  return (
    <div className={`toast toast-${tone}`} role="status">
      <span className="toast-icon">
        <Icon name={tone === "success" ? "check" : "warning"} size={16} />
      </span>
      <p>{message}</p>
      <button type="button" className="toast-close" onClick={onDismiss} aria-label="Dismiss">
        <Icon name="close" size={14} />
      </button>
    </div>
  );
}
