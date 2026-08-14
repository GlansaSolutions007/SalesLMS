import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "../../../components/Icon.jsx";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";
import Toast from "../../../components/Toast.jsx";
import Skeleton from "../../../components/Skeleton.jsx";
import {
  listContentBlocks,
  createContentBlock,
  updateContentBlock,
  reorderContentBlocks,
  duplicateContentBlock,
  deleteContentBlock,
} from "../../../services/lessonContentService.js";
import { BLOCK_TYPES, BLOCK_GROUPS, getBlockDef, defaultContentFor, blockSummary } from "./lessonBlockTypes.js";
import BlockContentEditor from "./BlockContentEditor.jsx";
import LessonBlockRenderer from "./LessonBlockRenderer.jsx";
import "./lesson-editor.css";

const SAVE_DELAY_MS = 700;

export default function LessonBlockEditor({ courseId, moduleId, lessonId, lessonTitle }) {
  const [blocks, setBlocks] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [toast, setToast] = useState(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const [savingIds, setSavingIds] = useState({});
  const [deletingBlock, setDeletingBlock] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);

  const saveTimers = useRef({});

  const load = useCallback(() => {
    setStatus("loading");
    listContentBlocks(courseId, moduleId, lessonId)
      .then((data) => {
        setBlocks(data);
        setStatus("success");
      })
      .catch((err) => {
        setErrorMessage(err.message ?? "Could not load lesson content.");
        setStatus("error");
      });
  }, [courseId, moduleId, lessonId]);

  useEffect(() => {
    load();
    const timers = saveTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, [load]);

  function markSaving(id, saving) {
    setSavingIds((prev) => ({ ...prev, [id]: saving }));
  }

  function persistBlock(id, content) {
    markSaving(id, true);
    updateContentBlock(courseId, moduleId, lessonId, id, content, null)
      .then((updated) => {
        setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...updated } : b)));
      })
      .catch((err) => setToast({ tone: "error", message: err.message ?? "Could not save this block." }))
      .finally(() => markSaving(id, false));
  }

  function scheduleSave(id, content) {
    if (saveTimers.current[id]) clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(() => persistBlock(id, content), SAVE_DELAY_MS);
  }

  function handleContentChange(id, patch) {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const nextContent = { ...(b.content ?? {}), ...patch };
        scheduleSave(id, nextContent);
        return { ...b, content: nextContent };
      })
    );
  }

  async function handleFile(id, file) {
    const block = blocks.find((b) => b.id === id);
    if (!block) return;
    markSaving(id, true);
    try {
      const updated = await updateContentBlock(courseId, moduleId, lessonId, id, block.content ?? {}, file);
      setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...updated } : b)));
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not upload this file." });
    } finally {
      markSaving(id, false);
    }
  }

  async function handleAddBlock(type) {
    setAddMenuOpen(false);
    try {
      const created = await createContentBlock(courseId, moduleId, lessonId, type, defaultContentFor(type), null);
      setBlocks((prev) => [...prev, created]);
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not add this block." });
    }
  }

  async function handleDuplicate(block) {
    try {
      const created = await duplicateContentBlock(courseId, moduleId, lessonId, block.id);
      setBlocks((prev) => {
        const idx = prev.findIndex((b) => b.id === block.id);
        const next = [...prev];
        next.splice(idx + 1, 0, created);
        return next;
      });
      setToast({ tone: "success", message: "Block duplicated." });
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not duplicate this block." });
    }
  }

  async function handleConfirmDelete() {
    if (!deletingBlock) return;
    try {
      await deleteContentBlock(courseId, moduleId, lessonId, deletingBlock.id);
      setBlocks((prev) => prev.filter((b) => b.id !== deletingBlock.id));
      setToast({ tone: "success", message: "Block deleted." });
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not delete this block." });
    } finally {
      setDeletingBlock(null);
    }
  }

  function persistOrder(nextBlocks) {
    reorderContentBlocks(courseId, moduleId, lessonId, nextBlocks.map((b) => b.id)).catch((err) =>
      setToast({ tone: "error", message: err.message ?? "Could not save the new block order." })
    );
  }

  function moveBlock(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    setBlocks(next);
    persistOrder(next);
  }

  function handleDrop(index) {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      return;
    }
    const next = [...blocks];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setBlocks(next);
    persistOrder(next);
    setDragIndex(null);
  }

  function toggleCollapsed(id) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  if (status === "loading") return <Skeleton height={180} />;

  if (status === "error") {
    return (
      <div className="panel cv-state-panel">
        <Icon name="warning" size={26} />
        <h3>Couldn't load lesson content</h3>
        <p>{errorMessage}</p>
        <button type="button" className="cl-btn" onClick={load}>Retry</button>
      </div>
    );
  }

  return (
    <div className="lbe-root">
      <div className="lbe-toolbar">
        <div className="lbe-toolbar-left">
          <h3 className="cv-section-title" style={{ margin: 0 }}>Lesson Content</h3>
          <span className="lbe-block-count">{blocks.length} block{blocks.length === 1 ? "" : "s"}</span>
        </div>
        <div className="lbe-toolbar-right">
          <button type="button" className="cl-btn" onClick={() => setPreviewMode((v) => !v)}>
            <Icon name="eye" size={14} />
            {previewMode ? "Back to Editing" : "Preview Lesson"}
          </button>
        </div>
      </div>

      {previewMode ? (
        <div className="panel lbe-preview-panel">
          {blocks.length === 0 ? (
            <p className="ep-empty-note">No content blocks yet — add one to see the preview.</p>
          ) : (
            <>
              {lessonTitle && <h1 className="lbr-title">{lessonTitle}</h1>}
              <LessonBlockRenderer blocks={blocks} />
            </>
          )}
        </div>
      ) : (
        <>
          {blocks.length === 0 && (
            <div className="panel cv-empty-inline" style={{ marginBottom: 14 }}>
              <Icon name="layers" size={22} />
              <p>No content blocks yet. Add your first block to start building this lesson like an article.</p>
            </div>
          )}

          <div className="lbe-block-list">
            {blocks.map((block, index) => {
              const def = getBlockDef(block.block_type);
              const isCollapsed = collapsed[block.id];
              const saving = savingIds[block.id];
              return (
                <div
                  key={block.id}
                  className={`lbe-block-card${dragIndex === index ? " is-dragging" : ""}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(index)}
                >
                  <div className="lbe-block-head">
                    <span
                      className="lbe-drag-handle"
                      draggable
                      onDragStart={() => setDragIndex(index)}
                      onDragEnd={() => setDragIndex(null)}
                      title="Drag to reorder"
                    >
                      <Icon name="more" size={15} />
                    </span>
                    <button type="button" className="lbe-block-title-btn" onClick={() => toggleCollapsed(block.id)}>
                      <Icon name={def?.icon ?? "file"} size={15} />
                      <span className="lbe-block-type">{def?.label ?? block.block_type}</span>
                      {isCollapsed && <span className="lbe-block-summary">{blockSummary(block)}</span>}
                    </button>

                    <div className="lbe-block-actions">
                      {saving && <span className="lbe-saving-indicator">Saving…</span>}
                      <button type="button" className="dash-icon-btn" title="Move up" disabled={index === 0} onClick={() => moveBlock(index, -1)}>
                        <Icon name="arrowUp" size={14} />
                      </button>
                      <button type="button" className="dash-icon-btn lbe-icon-rotate" title="Move down" disabled={index === blocks.length - 1} onClick={() => moveBlock(index, 1)}>
                        <Icon name="arrowUp" size={14} />
                      </button>
                      <button type="button" className="dash-icon-btn" title="Duplicate block" onClick={() => handleDuplicate(block)}>
                        <Icon name="clipboard" size={14} />
                      </button>
                      <button type="button" className="dash-icon-btn" title="Delete block" onClick={() => setDeletingBlock(block)}>
                        <Icon name="trash" size={14} />
                      </button>
                      <button type="button" className="dash-icon-btn" title={isCollapsed ? "Expand" : "Collapse"} onClick={() => toggleCollapsed(block.id)}>
                        <Icon name="chevronDown" size={14} className={isCollapsed ? "" : "lbe-icon-rotate"} />
                      </button>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="lbe-block-body">
                      <BlockContentEditor
                        blockType={block.block_type}
                        content={block.content}
                        onChange={(patch) => handleContentChange(block.id, patch)}
                        onFile={(file) => handleFile(block.id, file)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="lbe-add-block-wrap">
            <button type="button" className="dash-primary-btn cl-add-btn" onClick={() => setAddMenuOpen((v) => !v)}>
              <Icon name="plus" size={15} />
              Add Block
            </button>
            {addMenuOpen && (
              <>
                <div className="lbe-add-menu-backdrop" onClick={() => setAddMenuOpen(false)} />
                <div className="lbe-add-menu">
                  {BLOCK_GROUPS.map((group) => (
                    <div key={group} className="lbe-add-menu-group">
                      <p className="lbe-add-menu-group-title">{group}</p>
                      {BLOCK_TYPES.filter((b) => b.group === group).map((b) => (
                        <button key={b.type} type="button" className="lbe-add-menu-item" onClick={() => handleAddBlock(b.type)}>
                          <Icon name={b.icon} size={15} />
                          {b.label}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {deletingBlock && (
        <ConfirmDialog
          title="Delete Block"
          message={`This "${getBlockDef(deletingBlock.block_type)?.label ?? deletingBlock.block_type}" block will be permanently removed.`}
          confirmLabel="Delete"
          onCancel={() => setDeletingBlock(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />
    </div>
  );
}
