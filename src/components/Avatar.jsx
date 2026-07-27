import { useEffect, useState } from "react";
import "./Avatar.css";

function initials(name) {
  return String(name ?? "")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Avatar({ src, name, size = 44, shape = "circle", className = "" }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => setImgError(false), [src]);

  const showImage = src && !imgError;

  return (
    <span
      className={`avatar avatar-${shape} ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.36) }}
    >
      {showImage ? (
        <img src={src} alt={name ?? "Avatar"} onError={() => setImgError(true)} />
      ) : (
        initials(name)
      )}
    </span>
  );
}
