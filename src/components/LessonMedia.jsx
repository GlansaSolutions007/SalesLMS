import Icon from "./Icon.jsx";
import LessonBlockRenderer from "../pages/training/lesson-editor/LessonBlockRenderer.jsx";
import "./LessonMedia.css";

// Same regexes used by LessonTypeFields.jsx (the authoring side) — kept
// local rather than shared since this is a small, read-only rendering
// concern distinct from that component's editing/upload logic.
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

function PrimaryMedia({ lesson }) {
  if (lesson.lesson_type === "Video") {
    if (lesson.video_source === "upload") {
      return lesson.video_file_url ? (
        <div className="cv-media-card">
          <video className="cv-media-video" src={lesson.video_file_url} controls preload="metadata" />
        </div>
      ) : (
        <p className="ep-empty-note">This video hasn't finished uploading yet.</p>
      );
    }
    const embed = youtubeEmbedUrl(lesson.video_url) ?? vimeoEmbedUrl(lesson.video_url);
    if (embed) {
      return (
        <div className="cv-media-card cv-media-embed">
          <iframe src={embed} title={lesson.lesson_title} allowFullScreen loading="lazy" />
        </div>
      );
    }
    if (isDirectVideoUrl(lesson.video_url)) {
      return (
        <div className="cv-media-card">
          <video className="cv-media-video" src={lesson.video_url} controls preload="metadata" />
        </div>
      );
    }
    return <p className="ep-empty-note">No video has been added to this lesson yet.</p>;
  }

  if (lesson.lesson_type === "PDF") {
    return lesson.pdf_file_url ? (
      <div className="cv-media-card">
        <iframe className="cv-media-pdf" src={lesson.pdf_file_url} title={lesson.lesson_title} />
        <a href={lesson.pdf_file_url} target="_blank" rel="noreferrer" className="cl-btn cv-media-download-btn">
          <Icon name="download" size={14} /> Download PDF
        </a>
      </div>
    ) : (
      <p className="ep-empty-note">No PDF has been added to this lesson yet.</p>
    );
  }

  // Content (and any legacy-typed lesson — Audio/Document/PPT/Quiz, from
  // before Lesson Type drove the form): the block editor's content_blocks
  // if any were authored, else the plain lesson_description HTML, rendered
  // exactly as saved.
  if ((lesson.content_blocks ?? []).length > 0) {
    return <LessonBlockRenderer blocks={lesson.content_blocks} />;
  }
  if (lesson.lesson_description) {
    return <div className="lbr-paragraph rte-content" dangerouslySetInnerHTML={{ __html: lesson.lesson_description }} />;
  }
  return <p className="ep-empty-note">No description provided for this lesson.</p>;
}

// Renders a lesson's own content according to its Lesson Type — reused by
// both the employee-facing CoursePlayer (learning) and the admin-facing
// CourseDetails (course view) pages, so a fix here fixes both instead of
// drifting into two copies. Video/PDF additionally show the lesson's own
// description underneath the media, when one was entered.
export default function LessonMedia({ lesson }) {
  const showDescriptionBelow =
    (lesson.lesson_type === "Video" || lesson.lesson_type === "PDF") && lesson.lesson_description;

  return (
    <>
      <PrimaryMedia lesson={lesson} />
      {showDescriptionBelow && (
        <div className="lbr-paragraph rte-content cv-media-description" dangerouslySetInnerHTML={{ __html: lesson.lesson_description }} />
      )}
    </>
  );
}
