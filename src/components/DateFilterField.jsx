import Icon from "./Icon.jsx";
import "./DateFilterField.css";

// A styled date-picker filter to match .cl-search's look (icon + boxed
// field) instead of a bare native <input type="date">, with an inline
// clear button once a date is chosen.
export default function DateFilterField({ value, onChange, title = "Filter by date" }) {
  return (
    <div className="dt-date">
      <Icon name="calendar" size={15} />
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} title={title} />
      {value && (
        <button type="button" className="dt-date-clear" onClick={() => onChange("")} aria-label="Clear date filter">
          <Icon name="close" size={11} />
        </button>
      )}
    </div>
  );
}
