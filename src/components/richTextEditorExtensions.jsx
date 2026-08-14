import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import TiptapImage from "@tiptap/extension-image";
import { useRef } from "react";
import Icon from "./Icon.jsx";

// ── Resizable / alignable image ──────────────────────────────────────────
// Extends the base Image extension with `width`/`height` (px) and `align`
// attrs that serialize to plain inline style / data-attr + class on the
// <img> tag — the NodeView below only changes how it looks *while editing*;
// getHTML() always serializes through addAttributes()/renderHTML(), so the
// stored HTML is a plain <img>, safe to dangerouslySetInnerHTML anywhere.
function ResizableImageView({ node, updateAttributes, selected, deleteNode, extension }) {
  const wrapRef = useRef(null);
  const replaceInputRef = useRef(null);

  function startResize(e) {
    e.preventDefault();
    e.stopPropagation();
    const img = wrapRef.current?.querySelector("img");
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = img?.getBoundingClientRect().width ?? 300;
    const startHeight = img?.getBoundingClientRect().height ?? 200;

    function onMove(ev) {
      const nextWidth = Math.max(60, Math.round(startWidth + (ev.clientX - startX)));
      const nextHeight = Math.max(40, Math.round(startHeight + (ev.clientY - startY)));
      updateAttributes({ width: nextWidth, height: nextHeight });
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  async function handleReplace(file) {
    if (!file) return;
    try {
      const { url } = await extension.options.uploadFile(file);
      updateAttributes({ src: url, width: null, height: null });
    } catch (err) {
      window.alert(err.message ?? "Could not upload image.");
    }
  }

  const align = node.attrs.align || "none";

  return (
    <NodeViewWrapper
      ref={wrapRef}
      as="span"
      className={`rte-img-view rte-img-${align}${selected ? " is-selected" : ""}`}
      style={{
        width: node.attrs.width ? `${node.attrs.width}px` : undefined,
        height: node.attrs.height ? `${node.attrs.height}px` : undefined,
      }}
    >
      <img src={node.attrs.src} alt={node.attrs.alt || ""} title={node.attrs.title || ""} />
      {selected && (
        <span className="rte-img-toolbar" contentEditable={false}>
          <button type="button" title="Align left" className={align === "left" ? "is-active" : ""} onMouseDown={(e) => { e.preventDefault(); updateAttributes({ align: "left" }); }}>
            <Icon name="alignLeft" size={13} />
          </button>
          <button type="button" title="Align center" className={align === "center" ? "is-active" : ""} onMouseDown={(e) => { e.preventDefault(); updateAttributes({ align: "center" }); }}>
            <Icon name="alignCenter" size={13} />
          </button>
          <button type="button" title="Align right" className={align === "right" ? "is-active" : ""} onMouseDown={(e) => { e.preventDefault(); updateAttributes({ align: "right" }); }}>
            <Icon name="alignRight" size={13} />
          </button>
          <button type="button" title="Replace image" onMouseDown={(e) => { e.preventDefault(); replaceInputRef.current?.click(); }}>
            <Icon name="refresh" size={13} />
          </button>
          <button type="button" title="Remove image" onMouseDown={(e) => { e.preventDefault(); deleteNode(); }}>
            <Icon name="close" size={13} />
          </button>
        </span>
      )}
      <span className="rte-img-resize-handle" contentEditable={false} onMouseDown={startResize} />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => { handleReplace(e.target.files?.[0]); e.target.value = ""; }}
      />
    </NodeViewWrapper>
  );
}

export const ResizableImage = TiptapImage.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      // Injected by RichTextEditor.jsx so the NodeView's "Replace image"
      // control can reuse the same upload+resolve logic as the toolbar,
      // without this extension importing the API service directly.
      uploadFile: async () => {
        throw new Error("uploadFile was not provided to the ResizableImage extension.");
      },
    };
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: (attrs) => (attrs.width ? { style: `width:${attrs.width}px` } : {}),
        parseHTML: (el) => {
          const w = el.style.width || el.getAttribute("width");
          const n = w ? parseInt(w, 10) : null;
          return Number.isFinite(n) ? n : null;
        },
      },
      height: {
        default: null,
        renderHTML: (attrs) => (attrs.height ? { style: `height:${attrs.height}px` } : {}),
        parseHTML: (el) => {
          const h = el.style.height || el.getAttribute("height");
          const n = h ? parseInt(h, 10) : null;
          return Number.isFinite(n) ? n : null;
        },
      },
      align: {
        default: "none",
        renderHTML: (attrs) => ({ "data-align": attrs.align, class: `rte-img rte-img-${attrs.align}` }),
        parseHTML: (el) => el.getAttribute("data-align") || "none",
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

// ── Uploaded MP4/WebM video ───────────────────────────────────────────────
export const VideoEmbed = Node.create({
  name: "videoEmbed",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return { src: { default: null } };
  },
  parseHTML() {
    return [{ tag: "video[data-video-embed]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["video", mergeAttributes(HTMLAttributes, { controls: "", preload: "metadata", "data-video-embed": "" })];
  },
});

// ── Vimeo embed ────────────────────────────────────────────────────────────
const VIMEO_REGEX = /vimeo\.com\/(?:video\/)?(\d+)/;

export function extractVimeoId(url) {
  const match = url?.match(VIMEO_REGEX);
  return match ? match[1] : null;
}

export const VimeoEmbed = Node.create({
  name: "vimeoEmbed",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      videoId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-vimeo-id"),
        renderHTML: () => ({}),
      },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-vimeo-id]" }];
  },
  renderHTML({ node }) {
    const id = node.attrs.videoId;
    return [
      "div",
      { class: "rte-embed", "data-vimeo-id": id },
      [
        "iframe",
        {
          src: `https://player.vimeo.com/video/${id}`,
          frameborder: "0",
          allow: "autoplay; fullscreen; picture-in-picture",
          allowfullscreen: "true",
          title: "Vimeo video",
        },
      ],
    ];
  },
});

// ── File attachment (PDF / PPT / DOC download card) ───────────────────────
export const FileAttachment = Node.create({
  name: "fileAttachment",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      href: { default: null },
      fileName: { default: "", parseHTML: (el) => el.getAttribute("data-file-name") || "", renderHTML: () => ({}) },
      fileSize: { default: "", parseHTML: (el) => el.getAttribute("data-file-size") || "", renderHTML: () => ({}) },
      kind: { default: "file", parseHTML: (el) => el.getAttribute("data-kind") || "file", renderHTML: () => ({}) },
    };
  },
  parseHTML() {
    return [{ tag: "a[data-file-card]" }];
  },
  renderHTML({ node }) {
    const { href, fileName, fileSize, kind } = node.attrs;
    return [
      "a",
      {
        href,
        target: "_blank",
        rel: "noopener noreferrer",
        class: "rte-file-card",
        "data-file-card": "",
        "data-kind": kind,
        "data-file-name": fileName,
        "data-file-size": fileSize,
      },
      ["span", { class: "rte-file-card-icon" }],
      [
        "span",
        { class: "rte-file-card-meta" },
        ["strong", {}, fileName || "Download file"],
        ["span", {}, fileSize || ""],
      ],
    ];
  },
});
