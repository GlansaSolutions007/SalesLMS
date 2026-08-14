import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import Topbar from "../../components/Topbar.jsx";
import Icon from "../../components/Icon.jsx";
import Badge from "../../components/Badge.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getMyCertificate } from "../../services/certificateService.js";
import { resolveApiAssetUrl } from "../../utils/apiAssetUrl.js";
import { ROUTES } from "../../router/routePaths.js";
import "../../components/LessonMedia.css";
import "./CertificateView.css";

const STATUS_TONE = { Valid: "green", Expired: "orange", Revoked: "red" };

function formatDate(value) {
  if (!value) return "—";
  return String(value).slice(0, 10);
}

export default function CertificateView() {
  const { toggleCollapsed } = useOutletContext();
  const navigate = useNavigate();
  const { certificateId } = useParams();
  const { user } = useAuth();
  const companyId = user?.company?.id;

  const [certificate, setCertificate] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!companyId) return;
    getMyCertificate(companyId, certificateId)
      .then((data) => {
        setCertificate(data);
        setStatus("success");
      })
      .catch((err) => {
        setErrorMessage(err.message ?? "Could not load this certificate.");
        setStatus("error");
      });
  }, [companyId, certificateId]);

  return (
    <>
      <Topbar onMenuClick={toggleCollapsed} searchPlaceholder="Search..." notifications={3} messages={5} />

      <div className="cl-body">
        <div className="cl-header cert-no-print">
          <div>
            <button type="button" className="cl-btn ep-back-btn" onClick={() => navigate(ROUTES.MY_CERTIFICATES)}>
              <Icon name="back" size={15} />
              Back to My Certificates
            </button>
            <h1>Certificate</h1>
          </div>
          {status === "success" && certificate && (
            certificate.certificate_file ? (
              <a className="dash-primary-btn" href={resolveApiAssetUrl(certificate.certificate_file)} target="_blank" rel="noreferrer">
                <Icon name="download" size={15} />
                Download PDF
              </a>
            ) : (
              <button type="button" className="dash-primary-btn" onClick={() => window.print()}>
                <Icon name="download" size={15} />
                Print / Save as PDF
              </button>
            )
          )}
        </div>

        {status === "loading" && <Skeleton height={400} />}

        {status === "error" && (
          <div className="panel cv-state-panel cert-no-print">
            <Icon name="warning" size={28} />
            <h3>Couldn't load this certificate</h3>
            <p>{errorMessage}</p>
          </div>
        )}

        {status === "success" && certificate && (
          <div className="cert-frame panel">
            <div className="cert-info-block">
              <h2 className="cert-name">{certificate.course?.course_name}</h2>
              <p className="cert-body-text">
                Awarded to {certificate.employee?.full_name}
                {certificate.batch && ` · Batch: ${certificate.batch.batch_name}`}
              </p>

              <div className="cert-meta-row">
                <div>
                  <span>Certificate No.</span>
                  <p>{certificate.certificate_no}</p>
                </div>
                <div>
                  <span>Employee ID</span>
                  <p>{certificate.employee?.employee_code ?? "—"}</p>
                </div>
                <div>
                  <span>Company</span>
                  <p>{certificate.employee?.company?.company_name ?? "—"}</p>
                </div>
                <div>
                  <span>Course Category</span>
                  <p>{certificate.course?.category?.category_name ?? "—"}</p>
                </div>
                <div>
                  <span>Completion Date</span>
                  <p>{formatDate(certificate.completion_date)}</p>
                </div>
                <div>
                  <span>Issue Date</span>
                  <p>{formatDate(certificate.issue_date)}</p>
                </div>
                {certificate.expiry_date && (
                  <div>
                    <span>Valid Until</span>
                    <p>{formatDate(certificate.expiry_date)}</p>
                  </div>
                )}
                <div>
                  <span>Status</span>
                  <p><Badge tone={STATUS_TONE[certificate.verification_status] ?? "gray"}>{certificate.verification_status}</Badge></p>
                </div>
              </div>

              <p className="cert-verify">
                Verify this certificate any time using code <b>{certificate.qr_code}</b>
              </p>
            </div>

            {/* The actual certificate — the real PDF generated by
                CertificateGenerator from the Super Admin's Default
                Certificate Template (background, layout, placeholders, and
                the real embedded QR code). This is the only certificate
                visual on this page — no separate hardcoded replica, so it
                always matches whatever template is actually configured. */}
            <div className="cert-no-print" style={{ marginTop: 24 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-heading)", marginBottom: 10 }}>Certificate Preview</p>
              {certificate.certificate_file ? (
                <iframe className="cv-media-pdf" src={resolveApiAssetUrl(certificate.certificate_file)} title="Certificate PDF" />
              ) : (
                <p style={{ color: "var(--color-muted)", fontSize: 13 }}>Your certificate PDF is still being generated — check back shortly.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
