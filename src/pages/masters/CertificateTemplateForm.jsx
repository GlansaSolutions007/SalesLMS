import { useEffect, useState } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Icon from "../../components/Icon.jsx";
import FormField from "../../components/FormField.jsx";
import CertificateLivePreview from "../../components/CertificateLivePreview.jsx";
import { uploadEditorMedia } from "../../services/courseService.js";
import {
  getCertificateTemplate,
  createCertificateTemplate,
  updateCertificateTemplate,
} from "../../services/certificateTemplateService.js";
import { ROUTES } from "../../router/routePaths.js";
import "./SubscriptionPlanList.css";
import "./CertificateTemplateForm.css";

const ORIENTATIONS = ["Landscape", "Portrait"];
const PAPER_SIZES = ["A4", "Letter"];
const STATUSES = ["Active", "Inactive"];
const ALIGN_OPTIONS = ["left", "center", "right"];
const WEIGHT_OPTIONS = ["normal", "bold"];

// {{key}} tokens the free-text design fields (title/subtitle/footer) may
// contain — substituted server-side by CertificateTemplate::renderPlaceholders
// at generation time. company_logo/qr_code are deliberately excluded: those
// render as dedicated positioned images (Logo/QR Code Position), not text.
const PLACEHOLDER_TOKENS = [
  "employee_name", "employee_id", "course_name", "course_category",
  "completion_date", "issue_date", "certificate_number", "company_name",
];

function defaultTemplateConfig() {
  return {
    title: { text: "Certificate of Completion", x: 50, y: 15, font_size: 32, color: "#1a2b4c", align: "center", font_weight: "bold" },
    subtitle: { text: "This is to certify that", x: 50, y: 24, font_size: 14, color: "#555555", align: "center", font_weight: "normal" },
    logo: { x: 8, y: 6, width: 15 },
    employee_name: { x: 50, y: 40, font_size: 26, color: "#111111", align: "center", font_weight: "bold" },
    course_name: { x: 50, y: 50, font_size: 16, color: "#333333", align: "center", font_weight: "normal" },
    completion_date: { x: 22, y: 82, font_size: 11, color: "#333333", align: "left" },
    certificate_number: { x: 78, y: 82, font_size: 10, color: "#666666", align: "right" },
    qr_code: { x: 88, y: 86, width: 10 },
    signature: { x: 25, y: 90, width: 22, label: "Authorized Signatory" },
    seal: { x: 75, y: 68, width: 16, image: "" },
    footer: { text: "{{company_name}} · {{certificate_number}}", x: 50, y: 96, font_size: 10, color: "#888888", align: "center" },
  };
}

const EMPTY_FORM = {
  template_name: "",
  description: "",
  orientation: "Landscape",
  paper_size: "A4",
  status: "Active",
  is_default: false,
  background_image: "",
};

const DESIGN_ELEMENTS = [
  { key: "title", label: "Certificate Title", kind: "band", hasText: true },
  { key: "subtitle", label: "Subtitle", kind: "band", hasText: true },
  { key: "employee_name", label: "Employee Name Style", kind: "band" },
  { key: "course_name", label: "Course Name Style", kind: "band" },
  { key: "completion_date", label: "Completion Date Position", kind: "point" },
  { key: "certificate_number", label: "Certificate Number Position", kind: "point" },
  { key: "logo", label: "Logo Position", kind: "image" },
  { key: "qr_code", label: "QR Code Position", kind: "image" },
  { key: "seal", label: "Seal / Stamp Position", kind: "image", hasUpload: true },
  { key: "signature", label: "Signature Position", kind: "signature" },
  { key: "footer", label: "Footer", kind: "band", hasText: true },
];

function validateForm(form) {
  const errors = {};
  if (!form.template_name.trim()) errors.template_name = "Template name is required.";
  return errors;
}

export default function CertificateTemplateForm() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [config, setConfig] = useState(defaultTemplateConfig());
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadingSeal, setUploadingSeal] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        const row = await getCertificateTemplate(id);
        if (cancelled) return;
        setForm({
          template_name: row.template_name ?? "",
          description: row.description ?? "",
          orientation: row.orientation ?? "Landscape",
          paper_size: row.paper_size ?? "A4",
          status: row.status ?? "Active",
          is_default: Boolean(row.is_default),
          background_image: row.background_image ?? "",
        });
        setConfig({ ...defaultTemplateConfig(), ...(row.template_config ?? {}) });
      } catch (err) {
        setApiError(err.message ?? "Could not load this template.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateEl(elKey, field, value) {
    setConfig((prev) => ({ ...prev, [elKey]: { ...prev[elKey], [field]: value } }));
  }

  function insertToken(elKey, token) {
    setConfig((prev) => ({
      ...prev,
      [elKey]: { ...prev[elKey], text: `${prev[elKey]?.text ?? ""}{{${token}}}` },
    }));
  }

  async function handleBackgroundUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingBg(true);
    setApiError("");
    try {
      const { path } = await uploadEditorMedia(file);
      setField("background_image", path);
    } catch (err) {
      setApiError(err.message ?? "Could not upload background image.");
    } finally {
      setUploadingBg(false);
    }
  }

  async function handleSealUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingSeal(true);
    setApiError("");
    try {
      const { path } = await uploadEditorMedia(file);
      updateEl("seal", "image", path);
    } catch (err) {
      setApiError(err.message ?? "Could not upload seal/stamp image.");
    } finally {
      setUploadingSeal(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validateForm(form);
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setApiError("");

    const payload = {
      template_name: form.template_name.trim(),
      description: form.description.trim() || null,
      orientation: form.orientation,
      paper_size: form.paper_size,
      status: form.status,
      is_default: form.is_default,
      background_image: form.background_image || null,
      template_config: config,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateCertificateTemplate(id, payload);
      } else {
        await createCertificateTemplate(payload);
      }
      navigate(ROUTES.MASTERS_CERTIFICATE_TEMPLATES);
    } catch (err) {
      setApiError(err.message ?? "Could not save this template.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." />
        <div className="cl-body">
          <p>Loading…</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <div className="cl-header">
          <div>
            <h1>{isEdit ? "Edit Certificate Template" : "Add Certificate Template"}</h1>
            <Breadcrumb current={isEdit ? "Edit Template" : "Add Template"} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="ctf-layout">
          <div className="ctf-form-col">
            {apiError && (
              <div className="cw-step-alert">
                <Icon name="warning" size={15} />
                {apiError}
              </div>
            )}

            <div className="panel ctf-section">
              <div className="sp-section-label">Template Details</div>
              <FormField label="Template Name *" error={formErrors.template_name}>
                <input type="text" value={form.template_name} onChange={(e) => setField("template_name", e.target.value)} placeholder="e.g. Standard Certificate of Completion" />
              </FormField>
              <FormField label="Description">
                <textarea rows={2} value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="Internal note about when to use this template..." />
              </FormField>
              <div className="form-row">
                <FormField label="Orientation">
                  <select value={form.orientation} onChange={(e) => setField("orientation", e.target.value)}>
                    {ORIENTATIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Paper Size">
                  <select value={form.paper_size} onChange={(e) => setField("paper_size", e.target.value)}>
                    {PAPER_SIZES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Status">
                  <select value={form.status} onChange={(e) => setField("status", e.target.value)}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Default Template">
                  <label className="sp-feature-item">
                    <input type="checkbox" checked={form.is_default} onChange={(e) => setField("is_default", e.target.checked)} />
                    {form.is_default ? "Yes — used for all certificate generation" : "No"}
                  </label>
                </FormField>
              </div>
            </div>

            <div className="panel ctf-section">
              <div className="sp-section-label">Background Image</div>
              <div className="ctf-bg-row">
                {form.background_image ? (
                  <div className="ctf-bg-chip">
                    <Icon name="image" size={15} />
                    <span>Background image set</span>
                    <button type="button" onClick={() => setField("background_image", "")} title="Remove">
                      <Icon name="close" size={13} />
                    </button>
                  </div>
                ) : (
                  <label className="cl-btn ctf-upload-btn">
                    <Icon name="upload" size={15} />
                    {uploadingBg ? "Uploading…" : "Upload Background Image"}
                    <input type="file" accept="image/*" hidden onChange={handleBackgroundUpload} disabled={uploadingBg} />
                  </label>
                )}
              </div>
            </div>

            <div className="panel ctf-section">
              <div className="sp-section-label">Design Settings</div>
              <div className="ctf-elements">
                {DESIGN_ELEMENTS.map((def) => (
                  <DesignElementCard
                    key={def.key}
                    def={def}
                    value={config[def.key] ?? {}}
                    onChange={(field, value) => updateEl(def.key, field, value)}
                    onInsertToken={(token) => insertToken(def.key, token)}
                    onUpload={def.hasUpload ? handleSealUpload : undefined}
                    uploading={uploadingSeal}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="ctf-preview-col">
            <div className="panel ctf-section ctf-preview-sticky">
              <div className="sp-section-label">Live Preview</div>
              <CertificateLivePreview
                orientation={form.orientation}
                paperSize={form.paper_size}
                backgroundImage={form.background_image}
                config={config}
              />
              <p className="cw-step-hint" style={{ marginTop: 10 }}>Rendered with sample data — the actual PDF uses the employee/course being certified.</p>
            </div>

            <div className="ctf-actions">
              <button type="button" className="cl-btn" onClick={() => navigate(ROUTES.MASTERS_CERTIFICATE_TEMPLATES)} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="dash-primary-btn" disabled={saving}>
                {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Template"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

function DesignElementCard({ def, value, onChange, onInsertToken, onUpload, uploading }) {
  return (
    <div className="ctf-element-card">
      <div className="ctf-element-title">{def.label}</div>

      {def.hasText && (
        <>
          <textarea
            rows={2}
            className="ctf-element-text"
            value={value.text ?? ""}
            onChange={(e) => onChange("text", e.target.value)}
            placeholder={`e.g. ${def.key === "footer" ? "{{company_name}} · {{certificate_number}}" : "Certificate of Completion"}`}
          />
          <div className="ctf-token-row">
            {PLACEHOLDER_TOKENS.map((t) => (
              <button type="button" key={t} className="ctf-token-chip" onClick={() => onInsertToken(t)}>
                {"{{" + t + "}}"}
              </button>
            ))}
          </div>
        </>
      )}

      {def.hasUpload && (
        <div className="ctf-bg-row" style={{ marginBottom: 8 }}>
          {value.image ? (
            <div className="ctf-bg-chip">
              <Icon name="image" size={14} />
              <span>Image set</span>
              <button type="button" onClick={() => onChange("image", "")} title="Remove">
                <Icon name="close" size={12} />
              </button>
            </div>
          ) : (
            <label className="cl-btn ctf-upload-btn">
              <Icon name="upload" size={14} />
              {uploading ? "Uploading…" : "Upload Image"}
              <input type="file" accept="image/*" hidden onChange={onUpload} disabled={uploading} />
            </label>
          )}
        </div>
      )}

      <div className="ctf-element-fields">
        {(def.kind === "point" || def.kind === "image" || def.kind === "signature") && (
          <label className="ctf-field-inline">
            X %
            <input type="number" min="0" max="100" value={value.x ?? 0} onChange={(e) => onChange("x", Number(e.target.value))} />
          </label>
        )}
        <label className="ctf-field-inline">
          Y %
          <input type="number" min="0" max="100" value={value.y ?? 0} onChange={(e) => onChange("y", Number(e.target.value))} />
        </label>
        {(def.kind === "image" || def.kind === "signature") && (
          <label className="ctf-field-inline">
            Width %
            <input type="number" min="1" max="100" value={value.width ?? 15} onChange={(e) => onChange("width", Number(e.target.value))} />
          </label>
        )}
        {(def.kind === "band" || def.kind === "point") && (
          <>
            <label className="ctf-field-inline">
              Font Size
              <input type="number" min="6" max="72" value={value.font_size ?? 14} onChange={(e) => onChange("font_size", Number(e.target.value))} />
            </label>
            <label className="ctf-field-inline">
              Color
              <input type="color" value={value.color ?? "#333333"} onChange={(e) => onChange("color", e.target.value)} />
            </label>
            <label className="ctf-field-inline">
              Align
              <select value={value.align ?? "center"} onChange={(e) => onChange("align", e.target.value)}>
                {ALIGN_OPTIONS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </label>
          </>
        )}
        {def.kind === "band" && (
          <label className="ctf-field-inline">
            Weight
            <select value={value.font_weight ?? "normal"} onChange={(e) => onChange("font_weight", e.target.value)}>
              {WEIGHT_OPTIONS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </label>
        )}
        {def.kind === "signature" && (
          <label className="ctf-field-inline ctf-field-wide">
            Label
            <input type="text" value={value.label ?? ""} onChange={(e) => onChange("label", e.target.value)} placeholder="Authorized Signatory" />
          </label>
        )}
      </div>
    </div>
  );
}
