import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import Youtube from "@tiptap/extension-youtube";
import Icon from "./Icon.jsx";
import Modal from "./Modal.jsx";
import { ResizableImage, VideoEmbed, VimeoEmbed, FileAttachment, extractVimeoId } from "./richTextEditorExtensions.jsx";
import { uploadEditorMedia } from "../services/courseService.js";
import "./RichTextEditor.css";

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${bytes} B`;
}

function detectFileKind(name) {
  const ext = name?.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (["ppt", "pptx"].includes(ext)) return "ppt";
  if (["doc", "docx"].includes(ext)) return "doc";
  return "file";
}

// MediaUploadController builds `url` server-side via Storage::url(), which
// resolves against config('filesystems.disks.public.url') — itself built
// from APP_URL (see saleslms-backend/.env). That's the single source of
// truth for this app's origin across every environment, so the frontend
// trusts it as-is rather than re-deriving an origin of its own.
async function uploadAndResolve(file) {
  const { url } = await uploadEditorMedia(file);
  return { url };
}

async function insertImageAtPos(view, file) {
  try {
    const { url } = await uploadAndResolve(file);
    const pos = Math.min(view.state.selection.from, view.state.doc.content.size);
    const node = view.state.schema.nodes.image.create({ src: url });
    view.dispatch(view.state.tr.insert(pos, node));
  } catch (err) {
    window.alert(err.message ?? "Could not upload image.");
  }
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something...",
  error,
  minHeight = 140,
  height,
  maxHeight,
  resizable = false,
}) {
  const [uploading, setUploading] = useState(false);
  const [videoMenuOpen, setVideoMenuOpen] = useState(false);
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceHtml, setSourceHtml] = useState("");
  const [fullscreen, setFullscreen] = useState(false);

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoMenuRef = useRef(null);

  const handleDrop = useCallback((view, event, _slice, moved) => {
    if (moved) return false;
    const file = event.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith("image/")) return false;
    event.preventDefault();
    insertImageAtPos(view, file);
    return true;
  }, []);

  const handlePaste = useCallback((view, event) => {
    const items = Array.from(event.clipboardData?.items ?? []);
    const imageItem = items.find((it) => it.type.startsWith("image/"));
    if (!imageItem) return false;
    const file = imageItem.getAsFile();
    if (!file) return false;
    insertImageAtPos(view, file);
    return true;
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true, HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" } },
        // Removed from the toolbar (clean LMS toolbar) and disabled here too
        // — otherwise paste/markdown shortcuts (```, > ) could still produce
        // a block quote or a black-background code block during normal
        // lesson editing, which is exactly the confusing result this was
        // meant to avoid. Raw markup is handled by the HTML Source toggle.
        blockquote: false,
        codeBlock: false,
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder }),
      Youtube.configure({ nocookie: true, width: 640, height: 360, HTMLAttributes: { class: "rte-embed-frame" } }),
      ResizableImage.configure({ uploadFile: uploadAndResolve }),
      VideoEmbed,
      VimeoEmbed,
      FileAttachment,
    ],
    content: value || "",
    // Client-only SPA (no SSR) — forcing this avoids a race where
    // editor.view isn't attached yet when the value-sync effect below
    // calls editor.getHTML() right after creation.
    immediatelyRender: true,
    editorProps: {
      attributes: { class: "rte-editor rte-content" },
      handleDrop,
      handlePaste,
    },
    onUpdate: ({ editor: ed }) => onChange?.(ed.getHTML()),
  }, []);

  useEffect(() => {
    if (!editor) return;
    if (editor.isFocused) return;
    const current = editor.getHTML();
    const next = value || "";
    if (next !== current && !(next === "" && current === "<p></p>")) {
      // Tiptap v3's setContent takes an options object, not a boolean —
      // { emitUpdate: false } is what actually suppresses onUpdate here;
      // passing `false` positionally silently no-ops (destructures against
      // the default {}) and re-fires onChange on every external sync.
      editor.commands.setContent(next, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  useEffect(() => {
    if (!videoMenuOpen) return;
    function onDocMouseDown(e) {
      if (!videoMenuRef.current?.contains(e.target)) setVideoMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [videoMenuOpen]);

  useEffect(() => {
    if (!fullscreen) return;
    function onKey(e) {
      if (e.key === "Escape") setFullscreen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  async function withUpload(fn) {
    setUploading(true);
    try {
      await fn();
    } catch (err) {
      window.alert(err.message ?? "Something went wrong.");
    } finally {
      setUploading(false);
    }
  }

  function handleImageFile(file) {
    if (!file) return;
    withUpload(async () => {
      const { url } = await uploadAndResolve(file);
      editor.chain().focus().setImage({ src: url }).run();
    });
  }

  function handleVideoFile(file) {
    if (!file) return;
    withUpload(async () => {
      const { url } = await uploadAndResolve(file);
      editor.chain().focus().insertContent({ type: "videoEmbed", attrs: { src: url } }).run();
    });
  }

  function handleAttachmentFile(file) {
    if (!file) return;
    withUpload(async () => {
      const { url, size } = await uploadEditorMedia(file);
      editor
        .chain()
        .focus()
        .insertContent({
          type: "fileAttachment",
          attrs: { href: url, fileName: file.name, fileSize: formatBytes(size), kind: detectFileKind(file.name) },
        })
        .run();
    });
  }

  function handleLink() {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter a URL", previousUrl || "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function handleYoutube() {
    const url = window.prompt("Enter a YouTube video URL");
    if (!url) return;
    if (!editor.commands.setYoutubeVideo({ src: url })) {
      window.alert("That doesn't look like a valid YouTube URL.");
    }
  }

  function handleVimeo() {
    const url = window.prompt("Enter a Vimeo video URL");
    if (!url) return;
    const videoId = extractVimeoId(url);
    if (!videoId) {
      window.alert("That doesn't look like a valid Vimeo URL.");
      return;
    }
    editor.chain().focus().insertContent({ type: "vimeoEmbed", attrs: { videoId } }).run();
  }

  function toggleSourceMode() {
    if (!sourceMode) {
      setSourceHtml(editor.getHTML());
      setSourceMode(true);
    } else {
      editor.chain().focus().setContent(sourceHtml || "").run();
      setSourceMode(false);
    }
  }

  if (!editor) return null;

  const inTable = !sourceMode && editor.isActive("table");

  const editorWrapStyle = fullscreen
    ? { flex: 1, minHeight: 0, height: "100%" }
    : resizable
    ? { height: height ?? minHeight, minHeight, maxHeight, resize: "vertical", overflow: "auto" }
    : { minHeight: height ?? minHeight };

  const body = (
    <>
      <div className="rte-toolbar">
        <button type="button" className="rte-btn" title="Undo" disabled={sourceMode} onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().undo().run()}>
          <Icon name="undo" size={14} />
        </button>
        <button type="button" className="rte-btn" title="Redo" disabled={sourceMode} onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().redo().run()}>
          <Icon name="redo" size={14} />
        </button>

        <span className="rte-divider" />

        <button type="button" disabled={sourceMode} className={`rte-btn rte-btn-bold${editor.isActive("bold") ? " is-active" : ""}`} title="Bold" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
        <button type="button" disabled={sourceMode} className={`rte-btn rte-btn-italic${editor.isActive("italic") ? " is-active" : ""}`} title="Italic" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
        <button type="button" disabled={sourceMode} className={`rte-btn rte-btn-underline${editor.isActive("underline") ? " is-active" : ""}`} title="Underline" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleUnderline().run()}>U</button>

        <span className="rte-divider" />

        <button type="button" disabled={sourceMode} className={`rte-btn${editor.isActive({ textAlign: "left" }) ? " is-active" : ""}`} title="Align left" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <Icon name="alignLeft" size={14} />
        </button>
        <button type="button" disabled={sourceMode} className={`rte-btn${editor.isActive({ textAlign: "center" }) ? " is-active" : ""}`} title="Align center" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <Icon name="alignCenter" size={14} />
        </button>
        <button type="button" disabled={sourceMode} className={`rte-btn${editor.isActive({ textAlign: "right" }) ? " is-active" : ""}`} title="Align right" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <Icon name="alignRight" size={14} />
        </button>

        <span className="rte-divider" />

        <button type="button" disabled={sourceMode} className={`rte-btn${editor.isActive("bulletList") ? " is-active" : ""}`} title="Bullet list" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <Icon name="listView" size={14} />
        </button>
        <button type="button" disabled={sourceMode} className={`rte-btn${editor.isActive("orderedList") ? " is-active" : ""}`} title="Numbered list" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <Icon name="sort" size={14} />
        </button>

        <span className="rte-divider" />

        <button type="button" disabled={sourceMode} className={`rte-btn${editor.isActive("link") ? " is-active" : ""}`} title="Insert link" onMouseDown={(e) => e.preventDefault()} onClick={handleLink}>
          <Icon name="link" size={14} />
        </button>
        <button type="button" disabled={sourceMode} className="rte-btn" title="Insert table" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          <Icon name="table" size={14} />
        </button>

        <span className="rte-divider" />

        <button type="button" disabled={sourceMode} className="rte-btn" title="Insert image" onMouseDown={(e) => e.preventDefault()} onClick={() => imageInputRef.current?.click()}>
          <Icon name="image" size={14} />
        </button>

        <div className="rte-video-menu-wrap" ref={videoMenuRef}>
          <button type="button" disabled={sourceMode} className="rte-btn" title="Video" onMouseDown={(e) => e.preventDefault()} onClick={() => setVideoMenuOpen((v) => !v)}>
            <Icon name="video" size={14} />
          </button>
          {videoMenuOpen && (
            <div className="rte-video-menu">
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setVideoMenuOpen(false); videoInputRef.current?.click(); }}>
                Upload MP4
              </button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setVideoMenuOpen(false); handleYoutube(); }}>
                YouTube URL
              </button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setVideoMenuOpen(false); handleVimeo(); }}>
                Vimeo URL
              </button>
            </div>
          )}
        </div>

        <button type="button" disabled={sourceMode} className="rte-btn" title="Attach file (PDF, PPT, DOC)" onMouseDown={(e) => e.preventDefault()} onClick={() => fileInputRef.current?.click()}>
          <Icon name="file" size={14} />
        </button>

        <span className="rte-divider" />

        <button type="button" className={`rte-btn${sourceMode ? " is-active" : ""}`} title="HTML Source" onMouseDown={(e) => e.preventDefault()} onClick={toggleSourceMode}>
          <Icon name="code" size={14} />
        </button>
        <button type="button" className={`rte-btn${fullscreen ? " is-active" : ""}`} title="Full screen" onMouseDown={(e) => e.preventDefault()} onClick={() => setFullscreen((v) => !v)}>
          <Icon name="expand" size={14} />
        </button>

        {uploading && <span className="rte-uploading">Uploading…</span>}
      </div>

      {inTable && (
        <div className="rte-toolbar rte-toolbar-table">
          <button type="button" className="rte-btn" title="Add row" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().addRowAfter().run()}>+ Row</button>
          <button type="button" className="rte-btn" title="Add column" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().addColumnAfter().run()}>+ Col</button>
          <button type="button" className="rte-btn" title="Delete row" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteRow().run()}>− Row</button>
          <button type="button" className="rte-btn" title="Delete column" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteColumn().run()}>− Col</button>
          <button type="button" className="rte-btn" title="Delete table" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteTable().run()}>
            <Icon name="trash" size={13} />
          </button>
        </div>
      )}

      {sourceMode ? (
        <textarea
          className="rte-source-textarea"
          style={editorWrapStyle}
          value={sourceHtml}
          onChange={(e) => setSourceHtml(e.target.value)}
          spellCheck={false}
        />
      ) : (
        <div className="rte-editor-wrap" style={editorWrapStyle}>
          <EditorContent editor={editor} />
        </div>
      )}

      <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={(e) => { handleImageFile(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={videoInputRef} type="file" accept="video/mp4,video/webm" hidden onChange={(e) => { handleVideoFile(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={fileInputRef} type="file" accept=".pdf,.ppt,.pptx,.doc,.docx" hidden onChange={(e) => { handleAttachmentFile(e.target.files?.[0]); e.target.value = ""; }} />
    </>
  );

  if (fullscreen) {
    return (
      <Modal
        size="full"
        title="Edit Description"
        onClose={() => setFullscreen(false)}
        footer={
          <>
            <button type="button" className="cl-btn" onClick={() => setFullscreen(false)}>Cancel</button>
            <button type="button" className="dash-primary-btn" onClick={() => setFullscreen(false)}>Save &amp; Close</button>
          </>
        }
      >
        <div className={`rte rte-fullscreen-body${error ? " has-error" : ""}`}>{body}</div>
      </Modal>
    );
  }

  return (
    <div className={`rte${error ? " has-error" : ""}`}>
      {body}
      {error && <span className="rte-error">{error}</span>}
    </div>
  );
}
