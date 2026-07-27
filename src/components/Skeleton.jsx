import "./Skeleton.css";

export default function Skeleton({ width = "100%", height = 16, radius = 8, circle = false, className = "" }) {
  return (
    <span
      className={`skeleton-block ${className}`}
      style={{ width, height, borderRadius: circle ? "50%" : radius }}
      aria-hidden="true"
    />
  );
}
