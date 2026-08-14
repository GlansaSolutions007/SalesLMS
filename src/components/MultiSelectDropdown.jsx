import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import "./MultiSelectDropdown.css";

export default function MultiSelectDropdown({
  options,
  getOptionValue,
  getOptionLabel,
  getOptionSubLabel,
  selectedValues,
  onChange,
  disabled = false,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);

  const selectedKeys = useMemo(() => new Set(selectedValues.map(String)), [selectedValues]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => {
      const label = String(getOptionLabel(opt) ?? "").toLowerCase();
      const sub = String(getOptionSubLabel?.(opt) ?? "").toLowerCase();
      return label.includes(q) || sub.includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, query]);

  const selectedOptions = useMemo(
    () => options.filter((opt) => selectedKeys.has(String(getOptionValue(opt)))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options, selectedKeys]
  );

  useEffect(() => {
    if (!open) return undefined;
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function toggleValue(value) {
    const key = String(value);
    if (selectedKeys.has(key)) {
      onChange(selectedValues.filter((v) => String(v) !== key));
    } else {
      onChange([...selectedValues, value]);
    }
  }

  function removeValue(value) {
    const key = String(value);
    onChange(selectedValues.filter((v) => String(v) !== key));
  }

  function selectAllFiltered() {
    const filteredValues = filtered.map(getOptionValue);
    const merged = [...selectedValues];
    filteredValues.forEach((v) => {
      if (!merged.some((existing) => String(existing) === String(v))) merged.push(v);
    });
    onChange(merged);
  }

  function clearAll() {
    onChange([]);
  }

  return (
    <div className={`msd-root${disabled ? " is-disabled" : ""}`} ref={rootRef}>
      <button
        type="button"
        className={`msd-trigger${open ? " is-open" : ""}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
      >
        {selectedOptions.length === 0 ? (
          <span className="msd-placeholder">{placeholder}</span>
        ) : (
          <span className="msd-chips">
            {selectedOptions.map((opt) => (
              <span className="msd-chip" key={getOptionValue(opt)}>
                {getOptionLabel(opt)}
                <span
                  role="button"
                  tabIndex={0}
                  className="msd-chip-remove"
                  aria-label={`Remove ${getOptionLabel(opt)}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeValue(getOptionValue(opt));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      removeValue(getOptionValue(opt));
                    }
                  }}
                >
                  <Icon name="close" size={11} />
                </span>
              </span>
            ))}
          </span>
        )}
        <Icon name="chevronDown" size={14} className="msd-caret" />
      </button>

      {open && !disabled && (
        <div className="msd-panel">
          <div className="msd-search">
            <Icon name="search" size={14} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              autoFocus
            />
          </div>

          <div className="msd-actions">
            <button type="button" className="msd-action-btn" onClick={selectAllFiltered} disabled={filtered.length === 0}>
              Select all{query.trim() ? " (filtered)" : ""}
            </button>
            <button type="button" className="msd-action-btn" onClick={clearAll} disabled={selectedValues.length === 0}>
              Clear all
            </button>
          </div>

          <div className="msd-options">
            {filtered.length === 0 ? (
              <p className="msd-empty">{emptyMessage}</p>
            ) : (
              filtered.map((opt) => {
                const value = getOptionValue(opt);
                const checked = selectedKeys.has(String(value));
                return (
                  <label className="msd-option" key={value}>
                    <input type="checkbox" checked={checked} onChange={() => toggleValue(value)} />
                    <span>
                      <span className="msd-option-label">{getOptionLabel(opt)}</span>
                      {getOptionSubLabel && <span className="msd-option-sub">{getOptionSubLabel(opt)}</span>}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
