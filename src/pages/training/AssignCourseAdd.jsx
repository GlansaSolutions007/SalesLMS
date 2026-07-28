import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Icon from "../../components/Icon.jsx";
import FormField from "../../components/FormField.jsx";
import Toast from "../../components/Toast.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import { EMPLOYEES, COURSES, BATCHES, STATUS_OPTIONS } from "./assignCourseData.js";
import { ROUTES } from "../../router/routePaths.js";
import "./AssignCourseAdd.css";

const TODAY = new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
  employeeId: "",
  courseId: "",
  batchId: "",
  assignedDate: TODAY,
  dueDate: "",
  status: "Assigned",
};

export default function AssignCourseAdd() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  function setField(key, value) {
    setDirty(true);
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validate() {
    const next = {};
    if (!form.employeeId) next.employeeId = "Select an employee to assign this course to.";
    if (!form.courseId) next.courseId = "Select a course to assign.";
    if (!form.assignedDate) next.assignedDate = "Assigned date is required.";
    if (form.dueDate && form.assignedDate && form.dueDate < form.assignedDate) {
      next.dueDate = "Due date can't be before the assigned date.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    // Design stage — no backend yet, so this simulates the save the same
    // way the rest of this app's not-yet-integrated modules do.
    setTimeout(() => {
      setSaving(false);
      setToast({ tone: "success", message: "Course assigned successfully." });
      setTimeout(() => navigate(ROUTES.TRAINING_ASSIGN_COURSES), 850);
    }, 500);
  }

  function handleCancel() {
    if (dirty) {
      setConfirmCancel(true);
    } else {
      navigate(ROUTES.TRAINING_ASSIGN_COURSES);
    }
  }

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body wizard-page-body">
        <div className="wizard-sticky-header">
          <div className="wizard-header-text">
            <button type="button" className="cl-btn wizard-back-btn" onClick={handleCancel}>
              <Icon name="back" size={15} />
              Back to Assign Courses
            </button>
            <h1>Assign Course</h1>
            <p className="cl-breadcrumb">
              <span>Dashboard</span>
              <Icon name="chevronRight" size={13} />
              <span>Training</span>
              <Icon name="chevronRight" size={13} />
              <span>Assign Courses</span>
              <Icon name="chevronRight" size={13} />
              <span className="is-current">Assign Course</span>
            </p>
          </div>
        </div>

        <div className="panel wizard-panel">
          <div className="wizard-panel-inner">
            <form id="assign-course-form" className="form-fields-stack" onSubmit={handleSubmit}>
              <div className="form-row">
                <FormField label="Employee *" error={errors.employeeId}>
                  <select value={form.employeeId} onChange={(e) => setField("employeeId", e.target.value)}>
                    <option value="">Select employee</option>
                    {EMPLOYEES.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.code})
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Course *" error={errors.courseId}>
                  <select value={form.courseId} onChange={(e) => setField("courseId", e.target.value)}>
                    <option value="">Select course</option>
                    {COURSES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField label="Batch" error={errors.batchId}>
                <select value={form.batchId} onChange={(e) => setField("batchId", e.target.value)}>
                  <option value="">No batch (self-paced)</option>
                  {BATCHES.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <div className="form-row">
                <FormField label="Assigned Date *" error={errors.assignedDate}>
                  <input type="date" value={form.assignedDate} onChange={(e) => setField("assignedDate", e.target.value)} />
                </FormField>
                <FormField label="Due Date" error={errors.dueDate}>
                  <input type="date" value={form.dueDate} onChange={(e) => setField("dueDate", e.target.value)} />
                </FormField>
              </div>

              <FormField label="Status">
                <div className="seg-group">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      className={`seg-chip${form.status === opt ? " is-active" : ""}`}
                      onClick={() => setField("status", opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </FormField>
            </form>

            <div className="wizard-step-footer">
              <div className="wizard-step-footer-left">
                <button type="button" className="cl-btn" onClick={handleCancel} disabled={saving}>
                  Cancel
                </button>
              </div>
              <div className="wizard-step-footer-right">
                <button type="submit" form="assign-course-form" className="dash-primary-btn" disabled={saving}>
                  {saving ? <span className="fa-spinner light" /> : <Icon name="check" size={15} />}
                  Assign Course
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />

      {confirmCancel && (
        <ConfirmDialog
          title="Discard changes?"
          message="You have unsaved changes. Leaving now will discard them."
          confirmLabel="Discard"
          onCancel={() => setConfirmCancel(false)}
          onConfirm={() => {
            setConfirmCancel(false);
            navigate(ROUTES.TRAINING_ASSIGN_COURSES);
          }}
        />
      )}
    </>
  );
}
