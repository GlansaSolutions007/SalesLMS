import { resolveApiAssetUrl } from "../utils/apiAssetUrl.js";
import "./CertificateLivePreview.css";

// Sample data for previewing a template before it's ever used to generate
// a real certificate — same idea as any other "preview with sample data"
// screen. Keys match the Supported Placeholders list exactly.
const SAMPLE_DATA = {
  employee_name: "John Doe",
  employee_id: "EMP-0001",
  course_name: "Fundamentals of B2B Sales",
  course_category: "Sales Skills",
  completion_date: "06 Aug 2026",
  issue_date: "06 Aug 2026",
  certificate_number: "CERT-2026-SAMPLE1",
  company_name: "Your Company Pvt Ltd",
};

// Physical paper ratios (width/height) — landscape is the reciprocal of
// portrait for the same paper size.
const ASPECT = {
  "A4-Landscape": 297 / 210,
  "A4-Portrait": 210 / 297,
  "Letter-Landscape": 11 / 8.5,
  "Letter-Portrait": 8.5 / 11,
};

// Same {{key}} substitution CertificateTemplate::renderPlaceholders() does
// server-side — kept in sync manually since one is PHP and one is JS.
function renderPlaceholders(text, data) {
  if (!text) return "";
  return Object.entries(data).reduce((out, [key, value]) => out.split(`{{${key}}}`).join(value), text);
}

// "Band" elements span the full width and are only positioned vertically
// (top %) — title/subtitle/employee name/course name/footer. Font sizes
// are scaled down since the preview renders at a fraction of the PDF's
// real point size.
function Band({ el, defaults, text, scale = 0.55 }) {
  const value = text ?? el?.text;
  if (!value) return null;
  return (
    <div
      className="cert-preview-el"
      style={{
        top: `${el?.y ?? defaults.y}%`,
        textAlign: el?.align ?? defaults.align ?? "center",
        fontSize: `${(el?.font_size ?? defaults.font_size) * scale}px`,
        color: el?.color ?? defaults.color,
        fontWeight: el?.font_weight ?? defaults.font_weight ?? "normal",
      }}
    >
      {value}
    </div>
  );
}

// "Point" elements are anchored at a single x/y — completion date and
// certificate number, which sit at a specific corner rather than spanning
// the page width.
function Point({ el, defaults, text, scale = 0.6 }) {
  return (
    <div
      className="cert-preview-el cert-preview-point"
      style={{
        left: `${el?.x ?? defaults.x}%`,
        top: `${el?.y ?? defaults.y}%`,
        textAlign: el?.align ?? defaults.align,
        fontSize: `${(el?.font_size ?? defaults.font_size) * scale}px`,
        color: el?.color ?? defaults.color,
      }}
    >
      {text}
    </div>
  );
}

export default function CertificateLivePreview({ orientation = "Landscape", paperSize = "A4", backgroundImage, config, sampleData }) {
  const data = { ...SAMPLE_DATA, ...sampleData };
  const cfg = config || {};
  const aspect = ASPECT[`${paperSize}-${orientation}`] ?? ASPECT["A4-Landscape"];
  const bgUrl = backgroundImage ? resolveApiAssetUrl(backgroundImage) : null;

  return (
    <div className="cert-preview-wrap">
      <div
        className={`cert-preview-page${bgUrl ? "" : " cert-preview-page-plain"}`}
        style={{ aspectRatio: aspect, backgroundImage: bgUrl ? `url(${bgUrl})` : undefined }}
      >
        {cfg.logo && (
          <div className="cert-preview-placeholder-box" style={{ left: `${cfg.logo.x ?? 8}%`, top: `${cfg.logo.y ?? 6}%`, width: `${cfg.logo.width ?? 15}%` }}>
            LOGO
          </div>
        )}

        <Band
          el={cfg.title}
          defaults={{ y: 15, font_size: 32, color: "#1a2b4c", font_weight: "bold" }}
          text={cfg.title?.text ? renderPlaceholders(cfg.title.text, data) : undefined}
        />
        <Band
          el={cfg.subtitle}
          defaults={{ y: 24, font_size: 14, color: "#555555" }}
          text={cfg.subtitle?.text ? renderPlaceholders(cfg.subtitle.text, data) : undefined}
        />
        <Band el={cfg.employee_name} defaults={{ y: 40, font_size: 26, color: "#111111", font_weight: "bold" }} text={data.employee_name} />
        <Band el={cfg.course_name} defaults={{ y: 50, font_size: 16, color: "#333333" }} text={data.course_name} />

        <Point el={cfg.completion_date} defaults={{ x: 22, y: 82, align: "left", font_size: 11, color: "#333333" }} text={data.completion_date} />
        <Point el={cfg.certificate_number} defaults={{ x: 78, y: 82, align: "right", font_size: 10, color: "#666666" }} text={data.certificate_number} />

        {cfg.seal?.image && (
          <img
            className="cert-preview-img"
            src={resolveApiAssetUrl(cfg.seal.image)}
            alt=""
            style={{ left: `${cfg.seal.x ?? 75}%`, top: `${cfg.seal.y ?? 68}%`, width: `${cfg.seal.width ?? 16}%` }}
          />
        )}

        {cfg.qr_code && (
          <div
            className="cert-preview-placeholder-box cert-preview-qr"
            style={{ left: `${cfg.qr_code.x ?? 88}%`, top: `${cfg.qr_code.y ?? 86}%`, width: `${cfg.qr_code.width ?? 10}%` }}
          >
            QR
          </div>
        )}

        {cfg.signature && (
          <div className="cert-preview-signature" style={{ left: `${cfg.signature.x ?? 25}%`, top: `${cfg.signature.y ?? 90}%`, width: `${cfg.signature.width ?? 22}%` }}>
            <div className="cert-preview-signature-line" />
            <div className="cert-preview-signature-label">{cfg.signature.label || "Authorized Signatory"}</div>
          </div>
        )}

        <Band el={cfg.footer} defaults={{ y: 96, font_size: 10, color: "#888888" }} text={cfg.footer?.text ? renderPlaceholders(cfg.footer.text, data) : undefined} />
      </div>
    </div>
  );
}
