import Modal from "./Modal.jsx";

export default function ConfirmDialog({ title = "Are you sure?", message, confirmLabel = "Delete", onConfirm, onCancel }) {
  return (
    <Modal
      title={title}
      size="sm"
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="cl-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="dash-primary-btn confirm-danger-btn" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="confirm-message">{message}</p>
    </Modal>
  );
}
