import Icon from "./Icon.jsx";
import "./Modal.css";

export default function Modal({ title, onClose, children, footer, size = "md" }) {
  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className={`modal-card modal-${size}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="dash-icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
