import Icon from "../../../components/Icon.jsx";
import { resolveApiAssetUrl } from "../../../utils/apiAssetUrl.js";
import "./lesson-editor.css";

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

function Block({ block }) {
  const c = block.content ?? {};
  const fileUrl = c.file_path ? resolveApiAssetUrl(c.file_path) : null;

  switch (block.block_type) {
    case "heading": {
      const Tag = `h${c.level ?? 2}`;
      return c.text ? <Tag className="lbr-heading">{c.text}</Tag> : null;
    }

    case "paragraph":
      return c.html ? <div className="lbr-paragraph" dangerouslySetInnerHTML={{ __html: c.html }} /> : null;

    case "quote":
      return c.text ? (
        <blockquote className="lbr-quote">
          <p>{c.text}</p>
          {c.author && <cite>— {c.author}</cite>}
        </blockquote>
      ) : null;

    case "bullet_list": {
      const items = (c.items ?? []).filter(Boolean);
      return items.length ? <ul className="lbr-list">{items.map((it, i) => <li key={i}>{it}</li>)}</ul> : null;
    }

    case "numbered_list": {
      const items = (c.items ?? []).filter(Boolean);
      return items.length ? <ol className="lbr-list">{items.map((it, i) => <li key={i}>{it}</li>)}</ol> : null;
    }

    case "table": {
      const rows = c.rows ?? [];
      if (!rows.length) return null;
      const [headerRow, ...bodyRows] = c.hasHeader ? rows : [null, ...rows];
      return (
        <div className="lbr-table-wrap">
          <table className="lbr-table">
            {headerRow && (
              <thead>
                <tr>{headerRow.map((cell, i) => <th key={i}>{cell}</th>)}</tr>
              </thead>
            )}
            <tbody>
              {bodyRows.map((row, r) => (
                <tr key={r}>{row.map((cell, i) => <td key={i}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case "code":
      return c.code ? (
        <pre className="lbr-code"><code>{c.code}</code></pre>
      ) : null;

    case "callout":
      return c.text ? (
        <div className={`lbr-callout lbr-callout--${c.tone ?? "info"}`}>
          <Icon name={c.tone === "success" ? "check" : c.tone === "warning" || c.tone === "danger" ? "warning" : "helpCircle"} size={17} />
          <p>{c.text}</p>
        </div>
      ) : null;

    case "divider":
      return <hr className="lbr-divider" />;

    case "image":
      return fileUrl ? (
        <figure className="lbr-figure">
          <img src={fileUrl} alt={c.alt || c.caption || ""} loading="lazy" />
          {c.caption && <figcaption>{c.caption}</figcaption>}
        </figure>
      ) : null;

    case "video_upload":
      return fileUrl ? (
        <figure className="lbr-figure">
          <video src={fileUrl} controls preload="metadata" />
          {c.caption && <figcaption>{c.caption}</figcaption>}
        </figure>
      ) : null;

    case "youtube": {
      const embed = youtubeEmbedUrl(c.url);
      return embed ? (
        <figure className="lbr-figure lbr-embed">
          <iframe src={embed} title="YouTube video" allowFullScreen loading="lazy" />
          {c.caption && <figcaption>{c.caption}</figcaption>}
        </figure>
      ) : null;
    }

    case "vimeo": {
      const embed = vimeoEmbedUrl(c.url);
      return embed ? (
        <figure className="lbr-figure lbr-embed">
          <iframe src={embed} title="Vimeo video" allowFullScreen loading="lazy" />
          {c.caption && <figcaption>{c.caption}</figcaption>}
        </figure>
      ) : null;
    }

    case "pdf":
      return fileUrl ? (
        <div className="lbr-file-block">
          <div className="lbr-embed lbr-embed--pdf"><iframe src={fileUrl} title={c.title || "PDF document"} loading="lazy" /></div>
          <a href={fileUrl} target="_blank" rel="noreferrer" className="lbr-file-link">
            <Icon name="file" size={15} /> {c.title || c.file_name || "Open PDF"}
          </a>
        </div>
      ) : null;

    case "ppt":
      return fileUrl ? (
        <a href={fileUrl} target="_blank" rel="noreferrer" className="lbr-file-card">
          <Icon name="file" size={22} />
          <div>
            <strong>{c.title || c.file_name || "Presentation"}</strong>
            <span>Click to open the slide deck</span>
          </div>
        </a>
      ) : null;

    case "audio":
      return fileUrl ? (
        <div className="lbr-file-block">
          {(c.title || c.file_name) && <p className="lbr-audio-title">{c.title || c.file_name}</p>}
          <audio src={fileUrl} controls preload="metadata" />
        </div>
      ) : null;

    case "file_download":
      return fileUrl ? (
        <a href={fileUrl} target="_blank" rel="noreferrer" className="lbr-file-card">
          <Icon name="download" size={22} />
          <div>
            <strong>{c.label || c.file_name || "Download file"}</strong>
            {c.file_size && <span>{c.file_size}</span>}
          </div>
        </a>
      ) : null;

    case "assignment":
      return (c.title || c.instructions) ? (
        <div className="lbr-callout lbr-callout--assignment">
          <Icon name="edit" size={17} />
          <div>
            {c.title && <strong>{c.title}</strong>}
            {c.instructions && <p>{c.instructions}</p>}
          </div>
        </div>
      ) : null;

    case "quiz":
      return (c.title || c.note) ? (
        <div className="lbr-callout lbr-callout--quiz">
          <Icon name="clipboard" size={17} />
          <div>
            {c.title && <strong>{c.title}</strong>}
            {c.note && <p>{c.note}</p>}
          </div>
        </div>
      ) : null;

    default:
      return null;
  }
}

export default function LessonBlockRenderer({ blocks }) {
  const list = blocks ?? [];
  if (!list.length) return null;

  return (
    <div className="lbr-article">
      {list.map((block) => <Block key={block.id ?? `${block.block_type}-${block.block_order}`} block={block} />)}
    </div>
  );
}
