import { useRef, useState } from "react";
import Icon from "./Icon.jsx";
import FormField from "./FormField.jsx";
import RichTextEditor from "./RichTextEditor.jsx";
import { uploadEditorMedia } from "../services/courseService.js";
import { LESSON_TYPE_FORM_OPTIONS } from "../utils/lessonTypeFields.js";
import "./LessonTypeFields.css";

// Shared by the standalone Lessons page (Lessons.jsx) and the Course
// Wizard's lesson step (LessonCard.jsx) — both need the exact same
// Lesson Type-driven show/hide behavior, validation, and previews, and
// keeping one implementation means a fix here fixes both. Deliberately
// takes scalar value/onChange props rather than a single "values" object:
// the two callers store lesson fields under different key names (backend
// field names like lesson_type/lesson_description in Lessons.jsx vs. the
// wizard's shorter type/description), so this stays agnostic to either.
//
// LESSON_TYPE_FORM_OPTIONS and validateLessonTypeFields live in
// src/utils/lessonTypeFields.js, not here — courseWizardValidation.js needs
// the validation logic without pulling in this component (and, through it,
// the Tiptap-based RichTextEditor) just to validate a lesson.

// Same regexes LessonBlockRenderer.jsx uses for the block-based editor's
// YouTube/Vimeo blocks — small enough that duplicating rather than
// depending on that unrelated feature's internals is the simpler call.
function youtubeEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function vimeoEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? `https://player.vimeo.com/video/${match[1]}` : null;
}

function isDirectVideoUrl(url) {
  return !!url && /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url);
}

function LessonAssetUpload({ label, accept, hint, fileName, uploading, onFile, onClear }) {
  const inputRef = useRef(null);

  return (
    <div className="lesson-asset-upload">
      {fileName ? (
        <div className="lesson-asset-chip">
          <Icon name="file" size={15} />
          <span title={fileName}>{fileName}</span>
          <button type="button" onClick={() => inputRef.current?.click()} title="Replace">
            <Icon name="refresh" size={13} />
          </button>
          <button type="button" onClick={onClear} title="Remove">
            <Icon name="close" size={13} />
          </button>
        </div>
      ) : (
        <button type="button" className="lesson-asset-pick-btn" disabled={uploading} onClick={() => inputRef.current?.click()}>
          <Icon name="upload" size={15} />
          {uploading ? "Uploading…" : label}
        </button>
      )}
      {hint && <span className="lesson-asset-hint">{hint}</span>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function VideoPreview({ source, url, fileUrl }) {
  if (source === "upload") {
    return fileUrl ? <video className="lesson-preview-video" src={fileUrl} controls preload="metadata" /> : null;
  }
  const yt = youtubeEmbedUrl(url);
  if (yt) return <div className="lesson-preview-embed"><iframe src={yt} title="YouTube preview" allowFullScreen /></div>;
  const vm = vimeoEmbedUrl(url);
  if (vm) return <div className="lesson-preview-embed"><iframe src={vm} title="Vimeo preview" allowFullScreen /></div>;
  if (isDirectVideoUrl(url)) return <video className="lesson-preview-video" src={url} controls preload="metadata" />;
  return null;
}

export default function LessonTypeFields({
  lessonType,
  onLessonTypeChange,

  description,
  onDescriptionChange,
  descriptionError,

  videoSource,
  onVideoSourceChange,
  videoUrl,
  onVideoUrlChange,
  videoUrlError,
  videoFileName,
  videoFileUrl,
  videoFileError,
  onVideoFileUploaded, // ({ path, name, url }) => void
  onVideoFileCleared,

  pdfFileName,
  pdfFileUrl,
  pdfFileError,
  onPdfFileUploaded, // ({ path, name, url }) => void
  onPdfFileCleared,
}) {
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  async function handleVideoFile(file) {
    setUploadingVideo(true);
    try {
      const { path, url, name } = await uploadEditorMedia(file);
      onVideoFileUploaded({ path, name: name ?? file.name, url });
    } catch (err) {
      window.alert(err.message ?? "Could not upload video.");
    } finally {
      setUploadingVideo(false);
    }
  }

  async function handlePdfFile(file) {
    setUploadingPdf(true);
    try {
      const { path, url, name } = await uploadEditorMedia(file);
      onPdfFileUploaded({ path, name: name ?? file.name, url });
    } catch (err) {
      window.alert(err.message ?? "Could not upload PDF.");
    } finally {
      setUploadingPdf(false);
    }
  }

  return (
    <>
      <FormField label="Lesson Type">
        <select value={lessonType} onChange={(e) => onLessonTypeChange(e.target.value)}>
          {(LESSON_TYPE_FORM_OPTIONS.includes(lessonType) ? LESSON_TYPE_FORM_OPTIONS : [...LESSON_TYPE_FORM_OPTIONS, lessonType]).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </FormField>

      {lessonType === "Content" && (
        <FormField label="Description *" error={descriptionError}>
          <RichTextEditor
            value={description}
            onChange={onDescriptionChange}
            placeholder="Write the lesson content..."
            height={600}
            minHeight={500}
            maxHeight={1000}
            resizable
          />
        </FormField>
      )}

      {lessonType === "Video" && (
        <>
          <FormField label="Video Source">
            <select value={videoSource} onChange={(e) => onVideoSourceChange(e.target.value)}>
              <option value="upload">Upload Video</option>
              <option value="external">External Video URL</option>
            </select>
          </FormField>

          {videoSource === "upload" ? (
            <FormField label="Video Upload *" error={videoFileError}>
              <LessonAssetUpload
                label="Upload video"
                accept="video/mp4,video/webm,.mov"
                hint="MP4, WebM, or MOV up to 50MB"
                fileName={videoFileName}
                uploading={uploadingVideo}
                onFile={handleVideoFile}
                onClear={onVideoFileCleared}
              />
            </FormField>
          ) : (
            <FormField label="Video URL *" error={videoUrlError}>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => onVideoUrlChange(e.target.value)}
                placeholder="YouTube, Vimeo, or direct MP4 URL"
              />
            </FormField>
          )}

          <FormField label="Video Preview">
            <VideoPreview source={videoSource} url={videoUrl} fileUrl={videoFileUrl} />
            {videoSource === "upload" && !videoFileUrl && <p className="lesson-preview-empty">Upload a video to preview it here.</p>}
            {videoSource === "external" && !youtubeEmbedUrl(videoUrl) && !vimeoEmbedUrl(videoUrl) && !isDirectVideoUrl(videoUrl) && (
              <p className="lesson-preview-empty">Enter a YouTube, Vimeo, or direct MP4 URL to preview it here.</p>
            )}
          </FormField>
        </>
      )}

      {lessonType === "PDF" && (
        <>
          <FormField label="PDF Upload *" error={pdfFileError}>
            <LessonAssetUpload
              label="Upload PDF"
              accept=".pdf"
              hint="PDF up to 20MB"
              fileName={pdfFileName}
              uploading={uploadingPdf}
              onFile={handlePdfFile}
              onClear={onPdfFileCleared}
            />
          </FormField>
          <FormField label="PDF Preview">
            {pdfFileUrl ? (
              <iframe className="lesson-preview-pdf" src={pdfFileUrl} title="PDF preview" />
            ) : (
              <p className="lesson-preview-empty">Upload a PDF to preview it here.</p>
            )}
          </FormField>
        </>
      )}
    </>
  );
}
