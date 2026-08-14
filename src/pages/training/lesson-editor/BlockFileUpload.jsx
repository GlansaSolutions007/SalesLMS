import { useRef } from "react";
import Icon from "../../../components/Icon.jsx";
import { resolveApiAssetUrl } from "../../../utils/apiAssetUrl.js";

// Generic "upload or replace a file" control shared by every file-carrying
// block type (image/video/pdf/ppt/audio/file_download) — same chip/replace/
// remove visual language as ImageUploader.jsx and ResourceUploader.jsx
// elsewhere in this app, just generic enough to take any `accept` list.
// `previewKind` ("image" | "video") additionally renders a real thumbnail
// above the chip instead of leaving the trainer to guess from the filename.
export default function BlockFileUpload({ content, accept, icon = "upload", hint, onFile, previewKind }) {
  const inputRef = useRef(null);
  const fileName = content?.file_name;
  const fileUrl = content?.file_path ? resolveApiAssetUrl(content.file_path) : null;

  return (
    <div className="lbe-file-upload-wrap">
      {fileUrl && previewKind === "image" && <img src={fileUrl} alt="" className="lbe-file-thumb" />}
      {fileUrl && previewKind === "video" && (
        <video src={fileUrl} controls preload="metadata" className="lbe-file-thumb" />
      )}

      <div className="lbe-file-upload">
        {fileName ? (
          <div className="lbe-file-chip">
            <Icon name={icon} size={15} />
            <span title={fileName}>{fileName}</span>
            {content?.file_size && <em>{content.file_size}</em>}
            {fileUrl && (
              <a href={fileUrl} target="_blank" rel="noreferrer" aria-label="Open file">
                <Icon name="eye" size={13} />
              </a>
            )}
            <button type="button" onClick={() => inputRef.current?.click()} aria-label="Replace file" title="Replace">
              <Icon name="refresh" size={13} />
            </button>
          </div>
        ) : (
          <button type="button" className="lbe-file-pick-btn" onClick={() => inputRef.current?.click()}>
            <Icon name={icon} size={15} />
            Upload file
          </button>
        )}
        {hint && <span className="lbe-file-hint">{hint}</span>}
        <input
          ref={inputRef}
          type="file"
          hidden
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
