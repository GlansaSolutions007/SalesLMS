// Central registry for the Lesson Editor's block types — the single source
// of truth for what block types exist, their icon/label/grouping in the
// "Add Block" menu, and each type's default `content` shape. Keep in sync
// with the backend's LessonContentBlockController::BLOCK_TYPES whitelist.
//
// Block types that carry an uploaded file (image/video_upload/pdf/ppt/audio/
// file_download) store it server-side; their `content` always ends up with
// `file_path` / `file_name` / `file_size` merged in by the backend on save.

export const FILE_BLOCK_TYPES = ["image", "video_upload", "pdf", "ppt", "audio", "file_download"];

export const BLOCK_TYPES = [
  { type: "heading", label: "Heading", icon: "edit", group: "Text", defaultContent: () => ({ text: "", level: 2 }) },
  { type: "paragraph", label: "Paragraph (Rich Text)", icon: "edit", group: "Text", defaultContent: () => ({ html: "" }) },
  { type: "quote", label: "Quote", icon: "clipboard", group: "Text", defaultContent: () => ({ text: "", author: "" }) },
  { type: "bullet_list", label: "Bullet List", icon: "listView", group: "Text", defaultContent: () => ({ items: [""] }) },
  { type: "numbered_list", label: "Numbered List", icon: "sort", group: "Text", defaultContent: () => ({ items: [""] }) },
  { type: "table", label: "Table", icon: "gridView", group: "Text", defaultContent: () => ({ rows: [["", ""], ["", ""]], hasHeader: true }) },
  { type: "code", label: "Code Block", icon: "file", group: "Text", defaultContent: () => ({ code: "", language: "javascript" }) },
  { type: "callout", label: "Callout Box", icon: "warning", group: "Text", defaultContent: () => ({ text: "", tone: "info" }) },
  { type: "divider", label: "Divider", icon: "more", group: "Text", defaultContent: () => ({}) },

  { type: "image", label: "Image", icon: "image", group: "Media", defaultContent: () => ({ caption: "", alt: "" }) },
  { type: "video_upload", label: "Video Upload", icon: "video", group: "Media", defaultContent: () => ({ caption: "" }) },
  { type: "youtube", label: "YouTube Video", icon: "video", group: "Media", defaultContent: () => ({ url: "", caption: "" }) },
  { type: "vimeo", label: "Vimeo Video", icon: "video", group: "Media", defaultContent: () => ({ url: "", caption: "" }) },
  { type: "pdf", label: "PDF Viewer", icon: "file", group: "Media", defaultContent: () => ({ title: "" }) },
  { type: "ppt", label: "PPT", icon: "file", group: "Media", defaultContent: () => ({ title: "" }) },
  { type: "audio", label: "Audio", icon: "audio", group: "Media", defaultContent: () => ({ title: "" }) },
  { type: "file_download", label: "File Download", icon: "download", group: "Media", defaultContent: () => ({ label: "" }) },

  { type: "assignment", label: "Assignment", icon: "edit", group: "Learning", defaultContent: () => ({ title: "", instructions: "" }) },
  { type: "quiz", label: "Quiz", icon: "clipboard", group: "Learning", defaultContent: () => ({ title: "", note: "" }) },
];

export const BLOCK_GROUPS = ["Text", "Media", "Learning"];

const BLOCK_TYPE_MAP = Object.fromEntries(BLOCK_TYPES.map((b) => [b.type, b]));

export function getBlockDef(type) {
  return BLOCK_TYPE_MAP[type];
}

export function defaultContentFor(type) {
  return getBlockDef(type)?.defaultContent?.() ?? {};
}

export function isFileBlock(type) {
  return FILE_BLOCK_TYPES.includes(type);
}

// Short, human-readable summary shown on a collapsed/empty block card.
export function blockSummary(block) {
  const c = block.content ?? {};
  switch (block.block_type) {
    case "heading": return c.text || "Untitled heading";
    case "paragraph": return c.html ? c.html.replace(/<[^>]+>/g, "").slice(0, 80) : "Empty paragraph";
    case "quote": return c.text || "Empty quote";
    case "bullet_list":
    case "numbered_list": return (c.items ?? []).filter(Boolean).join(", ") || "Empty list";
    case "table": return `${(c.rows ?? []).length} row table`;
    case "code": return c.code ? c.code.slice(0, 60) : "Empty code block";
    case "callout": return c.text || "Empty callout";
    case "divider": return "—";
    case "image": return c.file_name || c.caption || "No image uploaded";
    case "video_upload": return c.file_name || "No video uploaded";
    case "youtube": return c.url || "No URL set";
    case "vimeo": return c.url || "No URL set";
    case "pdf": return c.file_name || c.title || "No PDF uploaded";
    case "ppt": return c.file_name || c.title || "No PPT uploaded";
    case "audio": return c.file_name || c.title || "No audio uploaded";
    case "file_download": return c.file_name || c.label || "No file uploaded";
    case "assignment": return c.title || "Untitled assignment";
    case "quiz": return c.title || "Untitled quiz";
    default: return "";
  }
}
