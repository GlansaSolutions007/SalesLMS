import { useRef, useState } from "react";
import Icon from "./Icon.jsx";
import { ACCEPTED_DOCUMENT_MIME, ACCEPTED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE_MB } from "../utils/fileUploadLimits.js";
import "./DocumentUploader.css";

export default function DocumentUploader({ fileName, onSelect, onRemove, error }) {
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(null);
  const [localError, setLocalError] = useState("");

  function acceptFile(file) {
    if (!file) return;
    const extOk = ACCEPTED_DOCUMENT_TYPES.some((ext) => file.name.toLowerCase().endsWith(ext));
    const typeOk = extOk || ACCEPTED_DOCUMENT_MIME.includes(file.type);
    if (!typeOk) {
      setLocalError("Unsupported file type.");
      return;
    }
    if (file.size > MAX_DOCUMENT_SIZE_MB * 1024 * 1024) {
      setLocalError(`Max file size is ${MAX_DOCUMENT_SIZE_MB}MB.`);
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
            onSelect?.(file);
          }, 120);
          return 100;
        }
        return next;
      });
    }, 80);
  }

  const showError = error || localError;

  if (progress !== null) {
    return (
      <div className="duploader-progress-wrap">
        <div className="duploader-progress-track">
          <div className="duploader-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span>{progress}%</span>
      </div>
    );
  }

  if (fileName) {
    return (
      <div className="duploader-chip">
        <Icon name="file" size={14} />
        <span title={fileName}>{fileName}</span>
        <button type="button" onClick={() => inputRef.current?.click()} title="Replace">
          <Icon name="refresh" size={13} />
        </button>
        <button type="button" onClick={onRemove} title="Remove" className="danger">
          <Icon name="close" size={13} />
        </button>
        <input
          ref={inputRef}
          type="file"
          hidden
          accept={ACCEPTED_DOCUMENT_TYPES.join(",")}
          onChange={(e) => {
            acceptFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
    );
  }

  return (
    <div className="duploader">
      <button type="button" className={`duploader-btn${showError ? " has-error" : ""}`} onClick={() => inputRef.current?.click()}>
        <Icon name="upload" size={14} />
        Upload File
      </button>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={ACCEPTED_DOCUMENT_TYPES.join(",")}
        onChange={(e) => {
          acceptFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {showError && <span className="duploader-error">{showError}</span>}
    </div>
  );
}
