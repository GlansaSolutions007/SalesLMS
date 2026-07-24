import { useRef, useState } from "react";
import Icon from "./Icon.jsx";
import ProgressBar from "./ProgressBar.jsx";
import "./ImageUploader.css";

export default function ImageUploader({
  label,
  hint = "PNG or JPG, up to 2MB",
  value,
  shape = "square",
  maxSizeMB = 2,
  onChange,
  onRemove,
  error,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(null);
  const [localError, setLocalError] = useState("");

  function acceptFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLocalError("Please select an image file.");
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setLocalError(`Image must be under ${maxSizeMB}MB.`);
      return;
    }
    setLocalError("");

    const reader = new FileReader();
    reader.onload = () => {
      setProgress(0);
      const dataUrl = String(reader.result);
      const timer = setInterval(() => {
        setProgress((p) => {
          if (p === null) return null;
          const next = p + 20;
          if (next >= 100) {
            clearInterval(timer);
            setTimeout(() => {
              setProgress(null);
              onChange?.(dataUrl, file);
            }, 150);
            return 100;
          }
          return next;
        });
      }, 90);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    acceptFile(e.dataTransfer.files?.[0]);
  }

  const showError = error || localError;

  return (
    <div className="iuploader">
      {label && <span className="iuploader-label">{label}</span>}

      <div
        className={`iuploader-zone iuploader-${shape}${dragOver ? " is-drag" : ""}${value ? " has-value" : ""}${showError ? " has-error" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !value && progress === null && inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        {progress !== null ? (
          <div className="iuploader-progress">
            <ProgressBar value={progress} tone="primary" />
          </div>
        ) : value ? (
          <>
            <img src={value} alt={label ?? "Uploaded preview"} className="iuploader-preview" />
            <div className="iuploader-overlay">
              <button type="button" className="iuploader-overlay-btn" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
                <Icon name="refresh" size={14} />
                Replace
              </button>
              <button
                type="button"
                className="iuploader-overlay-btn danger"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove?.();
                }}
              >
                <Icon name="trash" size={14} />
                Delete
              </button>
            </div>
          </>
        ) : (
          <div className="iuploader-empty">
            <Icon name="upload" size={20} />
            <p>Drag & drop or click to upload</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          acceptFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {showError ? <span className="iuploader-error">{showError}</span> : hint && <span className="iuploader-hint">{hint}</span>}
    </div>
  );
}
