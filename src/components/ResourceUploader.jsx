import { useRef, useState } from "react";
import Icon from "./Icon.jsx";
import { RESOURCE_TYPES, RESOURCE_ACCEPT, RESOURCE_MAX_SIZE_MB, RESOURCE_ICON } from "../pages/courses/wizard/courseWizardData.js";
import "./ResourceUploader.css";

export default function ResourceUploader({ resource, onChange, onRemove, error }) {
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(null);
  const [localError, setLocalError] = useState("");

  const isUrlType = resource.type === "External URL";

  function handleTypeChange(nextType) {
    onChange("type", nextType);
    if (nextType === "External URL") {
      onChange("file", null);
      onChange("fileName", "");
    } else {
      onChange("url", "");
    }
    setLocalError("");
  }

  function acceptFile(file) {
    if (!file) return;
    const maxMb = RESOURCE_MAX_SIZE_MB[resource.type] ?? 50;
    if (file.size > maxMb * 1024 * 1024) {
      setLocalError(`Max file size is ${maxMb}MB.`);
      return;
    }
    setLocalError("");
    setProgress(0);
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p === null) return null;
        const next = p + 25;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setProgress(null);
            onChange("file", file);
            onChange("fileName", file.name);
          }, 120);
          return 100;
        }
        return next;
      });
    }, 70);
  }

  const showError = error?.file || error?.url || localError;

  return (
    <div className={`resuploader${showError ? " has-error" : ""}`}>
      <select className="resuploader-type" value={resource.type} onChange={(e) => handleTypeChange(e.target.value)}>
        {RESOURCE_TYPES.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>

      <div className="resuploader-body">
        {isUrlType ? (
          <div className="resuploader-url">
            <Icon name="link" size={14} />
            <input
              type="text"
              placeholder="https://example.com/resource"
              value={resource.url}
              onChange={(e) => onChange("url", e.target.value)}
            />
          </div>
        ) : progress !== null ? (
          <div className="resuploader-progress">
            <div className="resuploader-progress-track">
              <div className="resuploader-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span>{progress}%</span>
          </div>
        ) : resource.fileName ? (
          <div className="resuploader-chip">
            <Icon name={RESOURCE_ICON[resource.type] ?? "file"} size={14} />
            <span title={resource.fileName}>{resource.fileName}</span>
            <button type="button" onClick={() => inputRef.current?.click()} title="Replace">
              <Icon name="refresh" size={13} />
            </button>
          </div>
        ) : (
          <button type="button" className="resuploader-pick-btn" onClick={() => inputRef.current?.click()}>
            <Icon name="upload" size={14} />
            {resource.type}
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          hidden
          accept={RESOURCE_ACCEPT[resource.type]}
          onChange={(e) => {
            acceptFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      <button type="button" className="resuploader-remove" aria-label="Remove resource" onClick={onRemove}>
        <Icon name="close" size={14} />
      </button>

      {showError && <span className="resuploader-error">{showError}</span>}
    </div>
  );
}
