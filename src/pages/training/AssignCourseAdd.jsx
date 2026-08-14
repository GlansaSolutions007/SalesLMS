import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Icon from "../../components/Icon.jsx";
import FormField from "../../components/FormField.jsx";
import MultiSelectDropdown from "../../components/MultiSelectDropdown.jsx";
import Toast from "../../components/Toast.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { STATUS_OPTIONS } from "./assignCourseData.js";
import {
  getCompanies,
  getCompanyEmployees,
  getCompanyBatches,
  createCourseAssignment,
  assignCourseToBatch,
  ApiValidationError,
  ApiError,
} from "../../services/api/companyApi.js";
import { listAllCourses } from "../../services/courseService.js";
import { ROUTES } from "../../router/routePaths.js";
import "./AssignCourseAdd.css";

const TODAY = new Date().toISOString().slice(0, 10);

// Server field name -> local form field name, for mapping 422 validation
// errors back onto the right input. employee_id isn't here — with multiple
// employees selected, a per-employee failure (e.g. "already assigned") is
// surfaced in the summary toast instead of as a single field error.
const FIELD_MAP = {
  course_id: "courseId",
  batch_id: "batchId",
  assigned_date: "assignedDate",
  due_date: "dueDate",
};

function buildEmptyForm(lockedCompanyId) {
  return {
    companyId: lockedCompanyId ?? "",
    employeeIds: [],
    courseId: "",
    batchId: "",
    assignedDate: TODAY,
    dueDate: "",
    status: "Assigned",
  };
}

const ASSIGN_MODES = [
  { key: "employees", label: "Individual Employees" },
  { key: "batch", label: "Batch (all members)" },
];

export default function AssignCourseAdd() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { roleName, user, token } = useAuth();

  const isSuperAdmin = roleName === "Super Admin";
  const lockedCompanyId = !isSuperAdmin ? user?.company?.id ?? null : null;

  const [mode, setMode] = useState("employees"); // "employees" | "batch"
  const [form, setForm] = useState(() => buildEmptyForm(lockedCompanyId));
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(isSuperAdmin);
  const [companiesError, setCompaniesError] = useState("");

  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState("");

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState("");

  const [batches, setBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchesError, setBatchesError] = useState("");

  // Companies — Super Admin picks one; every other role is locked to their own.
  useEffect(() => {
    if (!isSuperAdmin) return undefined;
    let cancelled = false;
    setCompaniesLoading(true);
    setCompaniesError("");
    getCompanies({ per_page: 100, sort: "company_name", dir: "asc" }, token)
      .then((result) => {
        if (!cancelled) setCompanies(result.items);
      })
      .catch((error) => {
        if (!cancelled) setCompaniesError(error.message ?? "Could not load companies.");
      })
      .finally(() => {
        if (!cancelled) setCompaniesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin, token]);

  // Courses — global catalog, not company-scoped.
  useEffect(() => {
    let cancelled = false;
    setCoursesLoading(true);
    setCoursesError("");
    listAllCourses()
      .then((items) => {
        if (!cancelled) setCourses(items);
      })
      .catch((error) => {
        if (!cancelled) setCoursesError(error.message ?? "Could not load courses.");
      })
      .finally(() => {
        if (!cancelled) setCoursesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Employees for the selected company.
  useEffect(() => {
    if (!form.companyId) {
      setEmployees([]);
      return undefined;
    }
    let cancelled = false;
    setEmployeesLoading(true);
    setEmployeesError("");
    getCompanyEmployees(form.companyId, { per_page: 100, sort: "full_name", dir: "asc" }, token)
      .then((result) => {
        if (!cancelled) setEmployees(result.items);
      })
      .catch((error) => {
        if (!cancelled) setEmployeesError(error.message ?? "Could not load employees.");
      })
      .finally(() => {
        if (!cancelled) setEmployeesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.companyId, token]);

  // Batches for the selected company — a batch is an employee group, not
  // tied to any one course, so this list is independent of form.courseId.
  useEffect(() => {
    if (!form.companyId) {
      setBatches([]);
      return undefined;
    }
    let cancelled = false;
    setBatchesLoading(true);
    setBatchesError("");
    getCompanyBatches(form.companyId, { per_page: 100 }, token)
      .then((result) => {
        if (!cancelled) setBatches(result.items);
      })
      .catch((error) => {
        if (!cancelled) setBatchesError(error.message ?? "Could not load batches.");
      })
      .finally(() => {
        if (!cancelled) setBatchesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.companyId, token]);

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

  function handleCompanyChange(value) {
    setDirty(true);
    setForm((f) => ({ ...f, companyId: value, employeeIds: [], batchId: "" }));
  }

  function handleCourseChange(value) {
    setDirty(true);
    setForm((f) => ({ ...f, courseId: value }));
  }

  function validate() {
    const next = {};
    if (isSuperAdmin && !form.companyId) next.companyId = "Select a company.";
    if (mode === "employees" && form.employeeIds.length === 0) {
      next.employeeIds = "Select at least one employee to assign this course to.";
    }
    if (mode === "batch" && !form.batchId) {
      next.batchId = "Select a batch — every employee currently enrolled in it will receive the course.";
    }
    if (!form.courseId) next.courseId = "Select a course to assign.";
    if (!form.assignedDate) next.assignedDate = "Assigned date is required.";
    if (form.dueDate && form.assignedDate && form.dueDate < form.assignedDate) {
      next.dueDate = "Due date can't be before the assigned date.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmitToBatch() {
    const payload = {
      course_id: form.courseId,
      assigned_date: form.assignedDate,
      due_date: form.dueDate || null,
      status: form.status,
    };

    setSaving(true);
    try {
      const result = await assignCourseToBatch(form.companyId, form.batchId, payload, token);
      setSaving(false);
      setToast({
        tone: "success",
        message: `Course assigned to ${result?.assigned ?? 0} employee(s) in this batch.` + (result?.skipped ? ` ${result.skipped} already had it.` : ""),
      });
      setTimeout(() => navigate(ROUTES.TRAINING_ASSIGN_COURSES), 850);
    } catch (error) {
      setSaving(false);
      if (error instanceof ApiValidationError) {
        const fieldErrors = {};
        Object.entries(error.errors ?? {}).forEach(([field, messages]) => {
          const key = FIELD_MAP[field] ?? field;
          fieldErrors[key] = Array.isArray(messages) ? messages[0] : messages;
        });
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
        setToast({ tone: "error", message: error.message || "Please fix the highlighted fields below." });
      } else {
        const message = error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
        setToast({ tone: "error", message });
      }
    }
  }

  async function handleSubmitToEmployees() {
    const targetIds = form.employeeIds;
    const payload = {
      course_id: form.courseId,
      batch_id: form.batchId || null,
      assigned_date: form.assignedDate,
      due_date: form.dueDate || null,
      status: form.status,
    };

    setSaving(true);
    const results = await Promise.allSettled(
      targetIds.map((employeeId) => createCourseAssignment(form.companyId, { ...payload, employee_id: employeeId }, token))
    );
    setSaving(false);

    const failedIds = [];
    const failureMessages = [];
    const fieldErrors = {};
    results.forEach((result, i) => {
      if (result.status !== "rejected") return;
      const employeeId = targetIds[i];
      failedIds.push(employeeId);
      const error = result.reason;
      const employee = employees.find((emp) => String(emp.id) === String(employeeId));
      const label = employee?.full_name ?? `Employee #${employeeId}`;
      if (error instanceof ApiValidationError) {
        Object.entries(error.errors ?? {}).forEach(([field, messages]) => {
          if (field === "employee_id") return;
          const key = FIELD_MAP[field] ?? field;
          fieldErrors[key] = Array.isArray(messages) ? messages[0] : messages;
        });
      }
      const message = error instanceof ApiError ? error.message : "Something went wrong.";
      failureMessages.push(`${label}: ${message}`);
    });

    const successCount = targetIds.length - failedIds.length;
    if (Object.keys(fieldErrors).length > 0) setErrors((prev) => ({ ...prev, ...fieldErrors }));

    if (failedIds.length === 0) {
      setToast({
        tone: "success",
        message: successCount === 1 ? "Course assigned successfully." : `Course assigned to ${successCount} employees.`,
      });
      setTimeout(() => navigate(ROUTES.TRAINING_ASSIGN_COURSES), 850);
    } else if (successCount > 0) {
      setForm((f) => ({ ...f, employeeIds: failedIds }));
      setToast({
        tone: "error",
        message: `Assigned to ${successCount} employee${successCount === 1 ? "" : "s"}. ${failedIds.length} failed — ${failureMessages.join("; ")}`,
        duration: 6000,
      });
    } else {
      setToast({ tone: "error", message: failureMessages.join("; "), duration: 6000 });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      setToast({ tone: "error", message: "Please fix the highlighted fields before saving." });
      return;
    }

    if (mode === "batch") await handleSubmitToBatch();
    else await handleSubmitToEmployees();
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
              {isSuperAdmin && (
                <FormField label="Company *" error={errors.companyId}>
                  <select
                    value={form.companyId}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    disabled={companiesLoading || Boolean(companiesError)}
                  >
                    <option value="">
                      {companiesLoading ? "Loading companies..." : companiesError ? "Could not load companies" : "Select company"}
                    </option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}

              <FormField label="Assign To">
                <div className="seg-group">
                  {ASSIGN_MODES.map((m) => (
                    <button
                      type="button"
                      key={m.key}
                      className={`seg-chip${mode === m.key ? " is-active" : ""}`}
                      onClick={() => {
                        setDirty(true);
                        setMode(m.key);
                        setErrors({});
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </FormField>

              {mode === "employees" ? (
                <FormField label="Employees *" error={errors.employeeIds}>
                  <MultiSelectDropdown
                    options={employees}
                    getOptionValue={(emp) => emp.id}
                    getOptionLabel={(emp) => emp.full_name}
                    getOptionSubLabel={(emp) => emp.employee_code}
                    selectedValues={form.employeeIds}
                    onChange={(ids) => setField("employeeIds", ids)}
                    disabled={!form.companyId || employeesLoading || Boolean(employeesError)}
                    placeholder={
                      !form.companyId
                        ? "Select a company first"
                        : employeesLoading
                          ? "Loading employees..."
                          : employeesError
                            ? "Could not load employees"
                            : "Select employees"
                    }
                    searchPlaceholder="Search employees..."
                    emptyMessage="No employees found."
                  />
                </FormField>
              ) : (
                <FormField label="Batch *" error={errors.batchId}>
                  <select
                    value={form.batchId}
                    onChange={(e) => setField("batchId", e.target.value)}
                    disabled={!form.companyId || batchesLoading || Boolean(batchesError)}
                  >
                    <option value="">
                      {!form.companyId
                        ? "Select a company first"
                        : batchesLoading
                          ? "Loading batches..."
                          : batchesError
                            ? "Could not load batches"
                            : "Select a batch"}
                    </option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.batch_name}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}

              <div className="form-row">
                <FormField label="Course *" error={errors.courseId}>
                  <select
                    value={form.courseId}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    disabled={coursesLoading || Boolean(coursesError)}
                  >
                    <option value="">{coursesLoading ? "Loading courses..." : coursesError ? "Could not load courses" : "Select course"}</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.course_name}
                      </option>
                    ))}
                  </select>
                </FormField>
                {mode === "employees" && (
                  <FormField label="Batch (optional tag)" error={errors.batchId}>
                    <select
                      value={form.batchId}
                      onChange={(e) => setField("batchId", e.target.value)}
                      disabled={!form.companyId || batchesLoading || Boolean(batchesError)}
                    >
                      <option value="">
                        {!form.companyId
                          ? "Select a company first"
                          : batchesLoading
                            ? "Loading batches..."
                            : batchesError
                              ? "Could not load batches"
                              : "No batch (self-paced)"}
                      </option>
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.batch_name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                )}
              </div>

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
                  {mode === "batch" ? "Assign to Batch" : "Assign Course"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Toast tone={toast?.tone} message={toast?.message} duration={toast?.duration} onDismiss={() => setToast(null)} />

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
