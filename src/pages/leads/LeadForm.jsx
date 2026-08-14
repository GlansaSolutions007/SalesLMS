import { useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Icon from "../../components/Icon.jsx";
import FormField from "../../components/FormField.jsx";
import { createLead } from "../../services/api/leadsApi.js";
import { validateLeadDetails, hasErrors } from "./leadFormValidation.js";
import { ROUTES } from "../../router/routePaths.js";
import useCompanyEmployeeOptions from "../employees/useCompanyEmployeeOptions.js";
import "./LeadForm.css";

const PRIORITIES = ["Low", "Medium", "High"];
const PRIORITY_TONE = { Low: "", Medium: "tone-warning", High: "tone-danger" };

export default function LeadForm() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const companyId = location.state?.companyId;

  const { options: employees } = useCompanyEmployeeOptions(companyId);

  const [data, setData] = useState({
    fullName: "",
    companyName: "",
    mobile: "",
    alternateMobile: "",
    email: "",
    address: "",
    city: "",
    state: "",
    customerType: "",
    productService: "",
    priority: "Medium",
    assignedEmployeeId: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  function onChange(field, value) {
    setData((d) => ({ ...d, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validation = validateLeadDetails(data);
    setErrors(validation);
    if (hasErrors(validation)) return;

    setIsSubmitting(true);
    setApiError("");
    try {
      await createLead(companyId, {
        full_name: data.fullName,
        company_name: data.companyName || undefined,
        mobile: data.mobile,
        alternate_mobile: data.alternateMobile || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        customer_type: data.customerType || undefined,
        product_service: data.productService || undefined,
        priority: data.priority || undefined,
        assigned_employee_id: data.assignedEmployeeId,
        remarks: data.notes || undefined,
      });
      navigate(ROUTES.LEADS);
    } catch (err) {
      setApiError(err.message ?? "Could not create this lead.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedEmployee = employees.find((emp) => String(emp.id) === String(data.assignedEmployeeId));

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." />

      <div className="cl-body wizard-page-body lead-form-page">
        <div className="wizard-sticky-header">
          <div className="wizard-header-text">
            <button type="button" className="cl-btn wizard-back-btn" onClick={() => navigate(ROUTES.LEADS)}>
              <Icon name="back" size={15} />
              Back to Leads
            </button>
            <h1>Add Lead</h1>
            <Breadcrumb current="Add Lead" />
          </div>

          {!companyId && (
            <div className="lead-form-warning">
              <Icon name="warning" size={15} />
              No company selected — open this page from the Leads list.
            </div>
          )}
        </div>

        <form className="panel wizard-panel lead-form-panel" onSubmit={handleSubmit}>
          <div className="wizard-panel-inner">
            <div className="form-fields-stack">
              <div className="form-section-divider lead-form-section-divider">
                <span className="lead-form-section-icon">
                  <Icon name="users" size={16} />
                </span>
                <span className="form-section-title">Customer Information</span>
              </div>

              <div className="form-row">
                <FormField label="Customer Name *" error={errors.fullName}>
                  <input
                    type="text"
                    placeholder="e.g. Ravi Kumar"
                    value={data.fullName}
                    onChange={(e) => onChange("fullName", e.target.value)}
                  />
                </FormField>
                <FormField label="Company Name">
                  <input
                    type="text"
                    placeholder="e.g. Kumar Textiles"
                    value={data.companyName}
                    onChange={(e) => onChange("companyName", e.target.value)}
                  />
                </FormField>
              </div>

              <div className="form-row">
                <FormField label="Mobile *" error={errors.mobile}>
                  <input type="text" placeholder="10-digit mobile number" value={data.mobile} onChange={(e) => onChange("mobile", e.target.value)} />
                </FormField>
                <FormField label="Alternate Mobile">
                  <input type="text" value={data.alternateMobile} onChange={(e) => onChange("alternateMobile", e.target.value)} />
                </FormField>
              </div>

              <FormField label="Email" error={errors.email}>
                <input type="email" placeholder="name@example.com" value={data.email} onChange={(e) => onChange("email", e.target.value)} />
              </FormField>

              <div className="form-section-divider lead-form-section-divider">
                <span className="lead-form-section-icon">
                  <Icon name="mapPin" size={16} />
                </span>
                <span className="form-section-title">Address</span>
              </div>

              <FormField label="Address">
                <textarea rows={2} value={data.address} onChange={(e) => onChange("address", e.target.value)} />
              </FormField>

              <div className="form-row">
                <FormField label="City">
                  <input type="text" value={data.city} onChange={(e) => onChange("city", e.target.value)} />
                </FormField>
                <FormField label="State">
                  <input type="text" value={data.state} onChange={(e) => onChange("state", e.target.value)} />
                </FormField>
              </div>

              <div className="form-section-divider lead-form-section-divider">
                <span className="lead-form-section-icon">
                  <Icon name="clipboard" size={16} />
                </span>
                <span className="form-section-title">Lead Details</span>
              </div>

              <div className="form-row">
                <FormField label="Product / Service">
                  <input type="text" value={data.productService} onChange={(e) => onChange("productService", e.target.value)} />
                </FormField>
                <FormField label="Customer Type">
                  <div className="seg-group">
                    {["B2B", "B2C"].map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        className={`seg-chip${data.customerType === opt ? " is-active" : ""}`}
                        onClick={() => onChange("customerType", opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </FormField>
              </div>

              <FormField label="Priority">
                <div className="seg-group">
                  {PRIORITIES.map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      className={["seg-chip", PRIORITY_TONE[opt], data.priority === opt ? "is-active" : ""].filter(Boolean).join(" ")}
                      onClick={() => onChange("priority", opt)}
                    >
                      <Icon name="flag" size={12} />
                      {opt}
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField label="Assigned Employee *" error={errors.assignedEmployeeId}>
                <select value={data.assignedEmployeeId} onChange={(e) => onChange("assignedEmployeeId", e.target.value)}>
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </option>
                  ))}
                </select>
              </FormField>

              {selectedEmployee && (
                <div className="lead-form-assignee-preview">
                  <span className="lead-form-avatar">{selectedEmployee.full_name?.charAt(0)?.toUpperCase() ?? "?"}</span>
                  <div>
                    <strong>{selectedEmployee.full_name}</strong>
                    <p>Will be notified and this lead will move to "Assigned" status.</p>
                  </div>
                </div>
              )}

              <div className="form-section-divider lead-form-section-divider">
                <span className="lead-form-section-icon">
                  <Icon name="edit" size={16} />
                </span>
                <span className="form-section-title">Notes</span>
              </div>

              <FormField label="Notes">
                <textarea rows={3} placeholder="Any additional context for the assigned employee…" value={data.notes} onChange={(e) => onChange("notes", e.target.value)} />
              </FormField>

              {apiError && <p className="form-field-error">{apiError}</p>}
            </div>

            <div className="wizard-step-footer">
              <div className="wizard-step-footer-left">
                <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.LEADS)}>
                  Cancel
                </button>
              </div>

              <button type="submit" className="dash-primary-btn" disabled={isSubmitting || !companyId}>
                {isSubmitting ? <span className="fa-spinner light" /> : <Icon name="check" size={15} />}
                {isSubmitting ? "Saving…" : "Save Lead"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
