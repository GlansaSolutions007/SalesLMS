import { useEffect, useRef } from "react";
import Icon from "./Icon.jsx";
import "./RichTextEditor.css";

const TOOLBAR = [
  { command: "bold", icon: "edit", label: "Bold" },
  { command: "italic", icon: "edit", label: "Italic" },
  { command: "underline", icon: "edit", label: "Underline" },
  { command: "insertUnorderedList", icon: "listView", label: "Bullet list" },
  { command: "insertOrderedList", icon: "sort", label: "Numbered list" },
  { command: "link", icon: "link", label: "Insert link" },
];

export default function RichTextEditor({ value, onChange, placeholder = "Write something...", error, minHeight = 140 }) {
  const editorRef = useRef(null);
  const focusedRef = useRef(false);

  useEffect(() => {
    const el = editorRef.current;
    if (!el || focusedRef.current) return;
    if (el.innerHTML !== (value || "")) el.innerHTML = value || "";
  }, [value]);

  function runCommand(command) {
    editorRef.current?.focus();
    if (command === "link") {
      const url = window.prompt("Enter a URL");
      if (!url) return;
      document.execCommand("createLink", false, url);
    } else {
      document.execCommand(command, false, null);
    }
    onChange?.(editorRef.current?.innerHTML ?? "");
  }

  const isEmpty = !value || value === "<br>";

  return (
    <div className={`rte${error ? " has-error" : ""}`}>
      <div className="rte-toolbar">
        {TOOLBAR.map((btn) => (
          <button
            key={btn.command}
            type="button"
            className={`rte-btn rte-btn-${btn.command}`}
            title={btn.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand(btn.command)}
          >
            {btn.command === "bold" ? "B" : btn.command === "italic" ? "I" : btn.command === "underline" ? "U" : <Icon name={btn.icon} size={14} />}
          </button>
        ))}
      </div>

      <div className="rte-editor-wrap" style={{ minHeight }}>
        {isEmpty && <span className="rte-placeholder">{placeholder}</span>}
        <div
          ref={editorRef}
          className="rte-editor"
          contentEditable
          suppressContentEditableWarning
          onFocus={() => {
            focusedRef.current = true;
          }}
          onBlur={() => {
            focusedRef.current = false;
          }}
          onInput={(e) => onChange?.(e.currentTarget.innerHTML)}
        />
      </div>

      {error && <span className="rte-error">{error}</span>}
    </div>
  );
}
