import Icon from "../../../components/Icon.jsx";
import RichTextEditor from "../../../components/RichTextEditor.jsx";
import BlockFileUpload from "./BlockFileUpload.jsx";

const HEADING_LEVELS = [1, 2, 3];
const CALLOUT_TONES = ["info", "success", "warning", "danger"];
const CODE_LANGUAGES = ["javascript", "python", "php", "html", "css", "sql", "json", "bash", "plaintext"];

// Every editor below shares the same contract:
//   content  — this block's current content object
//   onChange — (patch) => void, shallow-merges patch into content
//   onFile   — (file) => void, only used by file-carrying block types
function HeadingEditor({ content, onChange }) {
  return (
    <div className="lbe-field-row">
      <select className="lbe-select-sm" value={content.level ?? 2} onChange={(e) => onChange({ level: Number(e.target.value) })}>
        {HEADING_LEVELS.map((l) => <option key={l} value={l}>H{l}</option>)}
      </select>
      <input
        type="text"
        className="lbe-heading-input"
        value={content.text ?? ""}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="Heading text..."
      />
    </div>
  );
}

function ParagraphEditor({ content, onChange }) {
  return <RichTextEditor value={content.html ?? ""} onChange={(html) => onChange({ html })} placeholder="Write a paragraph..." minHeight={100} />;
}

function QuoteEditor({ content, onChange }) {
  return (
    <div className="lbe-field-stack">
      <textarea rows={2} value={content.text ?? ""} onChange={(e) => onChange({ text: e.target.value })} placeholder="Quote text..." />
      <input type="text" value={content.author ?? ""} onChange={(e) => onChange({ author: e.target.value })} placeholder="— Attribution (optional)" />
    </div>
  );
}

function ListEditor({ content, onChange, ordered }) {
  const items = content.items?.length ? content.items : [""];

  function setItem(i, value) {
    const next = [...items];
    next[i] = value;
    onChange({ items: next });
  }
  function addItem() {
    onChange({ items: [...items, ""] });
  }
  function removeItem(i) {
    onChange({ items: items.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="lbe-list-editor">
      {items.map((item, i) => (
        <div key={i} className="lbe-list-row">
          <span className="lbe-list-marker">{ordered ? `${i + 1}.` : "•"}</span>
          <input type="text" value={item} onChange={(e) => setItem(i, e.target.value)} placeholder="List item..." />
          <button type="button" onClick={() => removeItem(i)} aria-label="Remove item" disabled={items.length === 1}>
            <Icon name="close" size={13} />
          </button>
        </div>
      ))}
      <button type="button" className="lbe-add-row-btn" onClick={addItem}>
        <Icon name="plus" size={13} /> Add item
      </button>
    </div>
  );
}

function TableEditor({ content, onChange }) {
  const rows = content.rows?.length ? content.rows : [["", ""], ["", ""]];
  const cols = rows[0]?.length ?? 2;

  function setCell(r, c, value) {
    const next = rows.map((row) => [...row]);
    next[r][c] = value;
    onChange({ rows: next });
  }
  function addRow() {
    onChange({ rows: [...rows, Array(cols).fill("")] });
  }
  function addColumn() {
    onChange({ rows: rows.map((row) => [...row, ""]) });
  }
  function removeRow(r) {
    if (rows.length <= 1) return;
    onChange({ rows: rows.filter((_, idx) => idx !== r) });
  }

  return (
    <div className="lbe-table-editor">
      <label className="lbe-checkbox-row">
        <input type="checkbox" checked={content.hasHeader ?? true} onChange={(e) => onChange({ hasHeader: e.target.checked })} />
        First row is a header
      </label>
      <div className="lbe-table-grid-wrap">
        <table className="lbe-table-grid">
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c}>
                    <input type="text" value={cell} onChange={(e) => setCell(r, c, e.target.value)} />
                  </td>
                ))}
                <td className="lbe-table-row-actions">
                  <button type="button" onClick={() => removeRow(r)} aria-label="Remove row" disabled={rows.length === 1}>
                    <Icon name="close" size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="lbe-table-toolbar">
        <button type="button" className="lbe-add-row-btn" onClick={addRow}><Icon name="plus" size={13} /> Row</button>
        <button type="button" className="lbe-add-row-btn" onClick={addColumn}><Icon name="plus" size={13} /> Column</button>
      </div>
    </div>
  );
}

function CodeEditor({ content, onChange }) {
  return (
    <div className="lbe-field-stack">
      <select className="lbe-select-sm" value={content.language ?? "javascript"} onChange={(e) => onChange({ language: e.target.value })}>
        {CODE_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
      </select>
      <textarea
        rows={6}
        className="lbe-code-textarea"
        value={content.code ?? ""}
        onChange={(e) => onChange({ code: e.target.value })}
        placeholder="Paste or write code..."
        spellCheck={false}
      />
    </div>
  );
}

function CalloutEditor({ content, onChange }) {
  return (
    <div className="lbe-field-stack">
      <div className="seg-group">
        {CALLOUT_TONES.map((tone) => (
          <button
            key={tone}
            type="button"
            className={`seg-chip${(content.tone ?? "info") === tone ? " is-active" : ""}`}
            onClick={() => onChange({ tone })}
          >
            {tone}
          </button>
        ))}
      </div>
      <textarea rows={2} value={content.text ?? ""} onChange={(e) => onChange({ text: e.target.value })} placeholder="Callout text..." />
    </div>
  );
}

function DividerEditor() {
  return <p className="lbe-divider-note">A horizontal divider — no content needed.</p>;
}

function ImageEditor({ content, onChange, onFile }) {
  return (
    <div className="lbe-field-stack">
      <BlockFileUpload content={content} accept="image/*" icon="image" hint="PNG, JPG, GIF up to 5MB" onFile={onFile} previewKind="image" />
      <input type="text" value={content.caption ?? ""} onChange={(e) => onChange({ caption: e.target.value })} placeholder="Caption (optional)" />
      <input type="text" value={content.alt ?? ""} onChange={(e) => onChange({ alt: e.target.value })} placeholder="Alt text (accessibility)" />
    </div>
  );
}

function VideoUploadEditor({ content, onChange, onFile }) {
  return (
    <div className="lbe-field-stack">
      <BlockFileUpload content={content} accept="video/*" icon="video" hint="MP4, WebM up to 50MB" onFile={onFile} previewKind="video" />
      <input type="text" value={content.caption ?? ""} onChange={(e) => onChange({ caption: e.target.value })} placeholder="Caption (optional)" />
    </div>
  );
}

function UrlEmbedEditor({ content, onChange, placeholder }) {
  return (
    <div className="lbe-field-stack">
      <div className="lbe-url-row">
        <Icon name="link" size={14} />
        <input type="text" value={content.url ?? ""} onChange={(e) => onChange({ url: e.target.value })} placeholder={placeholder} />
      </div>
      <input type="text" value={content.caption ?? ""} onChange={(e) => onChange({ caption: e.target.value })} placeholder="Caption (optional)" />
    </div>
  );
}

function PdfEditor({ content, onChange, onFile }) {
  return (
    <div className="lbe-field-stack">
      <BlockFileUpload content={content} accept=".pdf" icon="file" hint="PDF up to 20MB" onFile={onFile} />
      <input type="text" value={content.title ?? ""} onChange={(e) => onChange({ title: e.target.value })} placeholder="Title (optional)" />
    </div>
  );
}

function PptEditor({ content, onChange, onFile }) {
  return (
    <div className="lbe-field-stack">
      <BlockFileUpload content={content} accept=".ppt,.pptx" icon="file" hint="PPT or PPTX up to 20MB" onFile={onFile} />
      <input type="text" value={content.title ?? ""} onChange={(e) => onChange({ title: e.target.value })} placeholder="Title (optional)" />
    </div>
  );
}

function AudioEditor({ content, onChange, onFile }) {
  return (
    <div className="lbe-field-stack">
      <BlockFileUpload content={content} accept="audio/*" icon="audio" hint="MP3, WAV up to 20MB" onFile={onFile} />
      <input type="text" value={content.title ?? ""} onChange={(e) => onChange({ title: e.target.value })} placeholder="Title (optional)" />
    </div>
  );
}

function FileDownloadEditor({ content, onChange, onFile }) {
  return (
    <div className="lbe-field-stack">
      <BlockFileUpload content={content} accept="*" icon="download" hint="Any file up to 20MB" onFile={onFile} />
      <input type="text" value={content.label ?? ""} onChange={(e) => onChange({ label: e.target.value })} placeholder="Download button label (optional)" />
    </div>
  );
}

function AssignmentEditor({ content, onChange }) {
  return (
    <div className="lbe-field-stack">
      <input type="text" value={content.title ?? ""} onChange={(e) => onChange({ title: e.target.value })} placeholder="Assignment title" />
      <textarea rows={3} value={content.instructions ?? ""} onChange={(e) => onChange({ instructions: e.target.value })} placeholder="Instructions for the learner..." />
      <p className="lbe-field-note">
        This is an in-article prompt only — for a gradeable, submittable assignment with trainer review, use the
        course's <b>Assignments</b> tab instead.
      </p>
    </div>
  );
}

function QuizEditor({ content, onChange }) {
  return (
    <div className="lbe-field-stack">
      <input type="text" value={content.title ?? ""} onChange={(e) => onChange({ title: e.target.value })} placeholder="Quiz title" />
      <textarea rows={2} value={content.note ?? ""} onChange={(e) => onChange({ note: e.target.value })} placeholder="Short note or instructions (optional)" />
      <p className="lbe-field-note">
        A pointer block only — build the actual graded quiz under the course's <b>Assessments</b> flow (question
        bank, attempts, Pass/Fail).
      </p>
    </div>
  );
}

const EDITORS = {
  heading: HeadingEditor,
  paragraph: ParagraphEditor,
  quote: QuoteEditor,
  bullet_list: (props) => <ListEditor {...props} ordered={false} />,
  numbered_list: (props) => <ListEditor {...props} ordered />,
  table: TableEditor,
  code: CodeEditor,
  callout: CalloutEditor,
  divider: DividerEditor,
  image: ImageEditor,
  video_upload: VideoUploadEditor,
  youtube: (props) => <UrlEmbedEditor {...props} placeholder="https://youtube.com/watch?v=..." />,
  vimeo: (props) => <UrlEmbedEditor {...props} placeholder="https://vimeo.com/..." />,
  pdf: PdfEditor,
  ppt: PptEditor,
  audio: AudioEditor,
  file_download: FileDownloadEditor,
  assignment: AssignmentEditor,
  quiz: QuizEditor,
};

export default function BlockContentEditor({ blockType, content, onChange, onFile }) {
  const Editor = EDITORS[blockType];
  if (!Editor) return <p className="lbe-field-note">Unknown block type "{blockType}".</p>;
  return <Editor content={content ?? {}} onChange={onChange} onFile={onFile} />;
}
