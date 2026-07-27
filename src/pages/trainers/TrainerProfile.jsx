import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "../../components/Icon.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Badge from "../../components/Badge.jsx";
import SubNavTabs from "../../components/SubNavTabs.jsx";
import Toast from "../../components/Toast.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getTrainerById,
  getTrainerSkills,
  addTrainerSkill,
  updateTrainerSkill,
  deleteTrainerSkill,
  updateTrainerStatus,
  ApiValidationError,
} from "../../services/api/trainersApi.js";
import { SKILL_LEVELS } from "../employees/employeeFormData.js";
import { ROUTES } from "../../router/routePaths.js";
import "../employees/EmployeeProfile.css";
import "./TrainerProfile.css";

const TABS = [
  { key: "overview",  label: "Overview"         },
  { key: "skills",    label: "Skills"            },
  { key: "courses",   label: "Course Allocation" },
  { key: "schedule",  label: "Schedule"          },
  { key: "attendance",label: "Attendance"        },
];

const STATUS_TONE = { Active: "green", Inactive: "gray" };
const SKILL_TONE  = { Expert: "green", Advanced: "green", Intermediate: "blue", Beginner: "orange" };

function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function emptyDraft() {
  return { skill_name: "", skill_level: "Beginner", experience_years: "", certification: "" };
}

/* ─── Loading skeleton ──────────────────────────────────────────────────── */
function ProfileSkeleton() {
  return (
    <div className="cl-body tp-skeleton">
      <div className="tp-skeleton-header panel" />
      <div className="tp-skeleton-tabs panel" />
      <div className="panel tp-skeleton-body">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="tp-skeleton-field" />
        ))}
      </div>
    </div>
  );
}

/* ─── Stat chip ─────────────────────────────────────────────────────────── */
function StatChip({ icon, label, value }) {
  return (
    <div className="tp-stat-chip">
      <Icon name={icon} size={14} />
      <div>
        <span className="tp-stat-value">{value}</span>
        <span className="tp-stat-label">{label}</span>
      </div>
    </div>
  );
}

/* ─── Inline skill row (add / edit mode) ─────────────────────────────────── */
function SkillEditor({ draft, onChange, onSave, onCancel, saving, saveLabel = "Save" }) {
  return (
    <div className="tp-skill-editor">
      <div className="tp-skill-editor-fields">
        <input
          type="text"
          className="tp-skill-input"
          placeholder="Skill name *"
          value={draft.skill_name}
          onChange={(e) => onChange("skill_name", e.target.value)}
          autoFocus
        />
        <select
          className="tp-skill-select"
          value={draft.skill_level}
          onChange={(e) => onChange("skill_level", e.target.value)}
        >
          {SKILL_LEVELS.map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
        </select>
        <input
          type="number"
          min="0"
          className="tp-skill-input tp-skill-input--sm"
          placeholder="Exp (yrs)"
          value={draft.experience_years}
          onChange={(e) => onChange("experience_years", e.target.value)}
        />
        <input
          type="text"
          className="tp-skill-input"
          placeholder="Certification (optional)"
          value={draft.certification}
          onChange={(e) => onChange("certification", e.target.value)}
        />
      </div>
      <div className="tp-skill-editor-actions">
        <button
          type="button"
          className="dash-primary-btn"
          onClick={onSave}
          disabled={saving || !draft.skill_name.trim()}
        >
          {saving ? <span className="fa-spinner light" /> : <Icon name="check" size={13} />}
          {saveLabel}
        </button>
        <button type="button" className="cl-btn tp-skill-cancel-btn" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────────────── */
export default function TrainerProfile() {
  const { state }  = useLocation();
  const navigate   = useNavigate();
  const { token }  = useAuth();
  const trainerId  = state?.trainerId;

  const [trainer,        setTrainer       ] = useState(null);
  const [skills,         setSkills        ] = useState([]);
  const [loading,        setLoading       ] = useState(true);
  const [pageError,      setPageError     ] = useState("");
  const [tab,            setTab           ] = useState("overview");

  const [addDraft,       setAddDraft      ] = useState(null);
  const [editId,         setEditId        ] = useState(null);
  const [editDraft,      setEditDraft     ] = useState(null);
  const [skillSaving,    setSkillSaving   ] = useState(false);
  const [deleteSkillId,  setDeleteSkillId ] = useState(null);
  const [statusChanging, setStatusChanging] = useState(false);
  const [toast,          setToast         ] = useState(null);

  /* ── fetch ── */
  useEffect(() => {
    if (!trainerId) { setPageError("No trainer selected."); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);

    Promise.all([getTrainerById(trainerId, token), getTrainerSkills(trainerId, token)])
      .then(([t, s]) => {
        if (cancelled) return;
        setTrainer(t);
        setSkills(Array.isArray(s) ? s : []);
      })
      .catch((err) => { if (!cancelled) setPageError(err.message ?? "Could not load trainer."); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [trainerId, token]);

  /* ── skills ── */
  async function handleAddSkill() {
    if (!addDraft?.skill_name?.trim()) return;
    setSkillSaving(true);
    try {
      const payload = { skill_name: addDraft.skill_name, skill_level: addDraft.skill_level };
      if (addDraft.experience_years !== "") payload.experience_years = addDraft.experience_years;
      if (addDraft.certification.trim()) payload.certification = addDraft.certification;
      const added = await addTrainerSkill(trainerId, payload, token);
      setSkills((p) => [...p, added]);
      setAddDraft(null);
      setToast({ tone: "success", message: "Skill added." });
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not add skill." });
    } finally { setSkillSaving(false); }
  }

  async function handleSaveEdit(skillId) {
    if (!editDraft?.skill_name?.trim()) return;
    setSkillSaving(true);
    try {
      const payload = { skill_name: editDraft.skill_name, skill_level: editDraft.skill_level };
      if (editDraft.experience_years !== "") payload.experience_years = editDraft.experience_years;
      if (editDraft.certification?.trim()) payload.certification = editDraft.certification;
      const updated = await updateTrainerSkill(trainerId, skillId, payload, token);
      setSkills((p) => p.map((s) => (s.id === skillId ? updated : s)));
      setEditId(null); setEditDraft(null);
      setToast({ tone: "success", message: "Skill updated." });
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not update skill." });
    } finally { setSkillSaving(false); }
  }

  async function handleDeleteSkill(skillId) {
    setSkillSaving(true);
    try {
      await deleteTrainerSkill(trainerId, skillId, token);
      setSkills((p) => p.filter((s) => s.id !== skillId));
      setToast({ tone: "success", message: "Skill removed." });
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not remove skill." });
    } finally { setSkillSaving(false); setDeleteSkillId(null); }
  }

  /* ── status toggle ── */
  async function handleToggleStatus() {
    const next = trainer.status === "Active" ? "Inactive" : "Active";
    setStatusChanging(true);
    try {
      await updateTrainerStatus(trainer.id, next, token);
      setTrainer((p) => ({ ...p, status: next }));
      setToast({ tone: "success", message: `Trainer marked as ${next}.` });
    } catch (err) {
      setToast({ tone: "error", message: err.message ?? "Could not update status." });
    } finally { setStatusChanging(false); }
  }

  /* ── guards ── */
  if (loading) return <ProfileSkeleton />;

  if (pageError || !trainer) {
    return (
      <div className="cl-body">
        <button type="button" className="cl-btn ep-back-btn" onClick={() => navigate(ROUTES.TRAINERS)}>
          <Icon name="back" size={15} /> Back to Trainers
        </button>
        <div className="tp-error-state panel">
          <Icon name="warning" size={28} />
          <p>{pageError || "Trainer not found."}</p>
          <button type="button" className="dash-primary-btn" onClick={() => navigate(ROUTES.TRAINERS)}>
            Back to list
          </button>
        </div>
      </div>
    );
  }

  const isActive = trainer.status === "Active";

  return (
    <>
      <div className="cl-body">
        {/* ── Page header ── */}
        <div className="cl-header">
          <div>
            <button type="button" className="cl-btn ep-back-btn" onClick={() => navigate(ROUTES.TRAINERS)}>
              <Icon name="back" size={15} /> Back to Trainers
            </button>
            <h1>{trainer.full_name}</h1>
            <Breadcrumb current={trainer.full_name} />
          </div>
          <div className="tp-header-actions">
            <button
              type="button"
              className={isActive ? "cl-btn tp-deactivate-btn" : "dash-primary-btn"}
              onClick={handleToggleStatus}
              disabled={statusChanging}
            >
              {statusChanging
                ? <span className="fa-spinner" />
                : <Icon name={isActive ? "close" : "check"} size={14} />}
              {isActive ? "Deactivate" : "Activate"}
            </button>
          </div>
        </div>

        {/* ── Profile hero card ── */}
        <div className="panel tp-hero">
          <div className="tp-hero-left">
            <span className="emp-avatar tp-avatar">{initials(trainer.full_name)}</span>
            <div className="tp-hero-info">
              <h2 className="tp-hero-name">{trainer.full_name}</h2>
              <p className="tp-hero-sub">
                {[trainer.specialization, trainer.qualification].filter(Boolean).join(" · ") || "Trainer"}
              </p>
              <div className="tp-hero-meta">
                {trainer.email  && <span><Icon name="mail"  size={13} />{trainer.email}</span>}
                {trainer.mobile && <span><Icon name="phone" size={13} />{trainer.mobile}</span>}
                {trainer.joining_date && (
                  <span><Icon name="calendar" size={13} />Joined {trainer.joining_date}</span>
                )}
              </div>
            </div>
          </div>
          <div className="tp-hero-right">
            <Badge tone={STATUS_TONE[trainer.status] ?? "gray"}>{trainer.status}</Badge>
            <div className="tp-stats-row">
              <StatChip icon="book"  label="Experience" value={`${trainer.experience_years ?? 0} yrs`} />
              {trainer.batches_count !== undefined && (
                <StatChip icon="users"   label="Batches"    value={trainer.batches_count} />
              )}
              {trainer.courses_count !== undefined && (
                <StatChip icon="layers"  label="Courses"    value={trainer.courses_count} />
              )}
            </div>
          </div>
        </div>

        {/* ── Sub navigation ── */}
        <SubNavTabs tabs={TABS} active={tab} onNavigate={setTab} />

        {/* ── Tab panels ── */}
        <div className="panel ep-tab-panel">

          {/* Overview */}
          {tab === "overview" && (
            <>
              <div className="tp-section-label">Personal Information</div>
              <div className="detail-grid">
                <div><span>Trainer Code</span>    <p>{trainer.trainer_code}</p></div>
                <div><span>First Name</span>       <p>{trainer.first_name}</p></div>
                <div><span>Last Name</span>        <p>{trainer.last_name        || "—"}</p></div>
                <div><span>Gender</span>           <p>{trainer.gender           || "—"}</p></div>
                <div><span>Date of Birth</span>    <p>{trainer.date_of_birth    || "—"}</p></div>
                <div><span>Joining Date</span>     <p>{trainer.joining_date     || "—"}</p></div>
              </div>

              <div className="tp-section-label tp-section-label--gap">Contact</div>
              <div className="detail-grid">
                <div><span>Email</span>  <p>{trainer.email}</p></div>
                <div><span>Mobile</span> <p>{trainer.mobile || "—"}</p></div>
              </div>

              <div className="tp-section-label tp-section-label--gap">Professional</div>
              <div className="detail-grid">
                <div><span>Qualification</span>    <p>{trainer.qualification    || "—"}</p></div>
                <div><span>Specialization</span>   <p>{trainer.specialization   || "—"}</p></div>
                <div><span>Experience (Yrs)</span> <p>{trainer.experience_years ?? "—"}</p></div>
              </div>

              {trainer.bio && (
                <>
                  <div className="tp-section-label tp-section-label--gap">Bio</div>
                  <p className="tp-bio">{trainer.bio}</p>
                </>
              )}
            </>
          )}

          {/* Skills */}
          {tab === "skills" && (
            <div>
              <div className="tp-skills-toolbar">
                <div>
                  <p className="tp-skills-title">Skills &amp; Expertise</p>
                  <p className="tp-skills-sub">{skills.length} skill{skills.length !== 1 ? "s" : ""} on record</p>
                </div>
                {!addDraft && (
                  <button
                    type="button"
                    className="fa-outline-btn form-doc-add-btn"
                    onClick={() => setAddDraft(emptyDraft())}
                    disabled={skillSaving}
                  >
                    <Icon name="plus" size={14} /> Add Skill
                  </button>
                )}
              </div>

              {addDraft && (
                <SkillEditor
                  draft={addDraft}
                  onChange={(f, v) => setAddDraft((d) => ({ ...d, [f]: v }))}
                  onSave={handleAddSkill}
                  onCancel={() => setAddDraft(null)}
                  saving={skillSaving}
                  saveLabel="Add Skill"
                />
              )}

              {skills.length === 0 && !addDraft ? (
                <div className="tp-empty-state">
                  <div className="tp-empty-icon"><Icon name="star" size={22} /></div>
                  <p>No skills added yet.</p>
                  <button type="button" className="fa-outline-btn" onClick={() => setAddDraft(emptyDraft())}>
                    <Icon name="plus" size={14} /> Add First Skill
                  </button>
                </div>
              ) : (
                <div className="tp-skills-list">
                  {skills.map((skill) =>
                    editId === skill.id ? (
                      <SkillEditor
                        key={skill.id}
                        draft={editDraft}
                        onChange={(f, v) => setEditDraft((d) => ({ ...d, [f]: v }))}
                        onSave={() => handleSaveEdit(skill.id)}
                        onCancel={() => { setEditId(null); setEditDraft(null); }}
                        saving={skillSaving}
                        saveLabel="Update"
                      />
                    ) : (
                      <div key={skill.id} className="tp-skill-row">
                        <div className="tp-skill-info">
                          <span className="tp-skill-name">{skill.skill_name}</span>
                          {skill.certification && (
                            <span className="tp-skill-cert">{skill.certification}</span>
                          )}
                        </div>
                        <div className="tp-skill-right">
                          {skill.experience_years != null && skill.experience_years !== "" && (
                            <span className="tp-skill-exp">{skill.experience_years} yrs</span>
                          )}
                          <Badge tone={SKILL_TONE[skill.skill_level] ?? "gray"}>{skill.skill_level}</Badge>
                          <button
                            type="button"
                            className="dash-icon-btn"
                            aria-label="Edit"
                            onClick={() => {
                              setEditId(skill.id);
                              setEditDraft({
                                skill_name: skill.skill_name,
                                skill_level: skill.skill_level,
                                experience_years: skill.experience_years ?? "",
                                certification: skill.certification ?? "",
                              });
                            }}
                          >
                            <Icon name="edit" size={14} />
                          </button>
                          <button
                            type="button"
                            className="dash-icon-btn tp-delete-btn"
                            aria-label="Delete"
                            onClick={() => setDeleteSkillId(skill.id)}
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {/* Placeholder tabs */}
          {(tab === "courses" || tab === "schedule" || tab === "attendance") && (
            <div className="tp-empty-state">
              <div className="tp-empty-icon">
                <Icon name={tab === "courses" ? "book" : tab === "schedule" ? "calendar" : "check"} size={22} />
              </div>
              <p className="tp-empty-title">
                {tab === "courses" ? "Course Allocation" : tab === "schedule" ? "Training Schedule" : "Attendance Records"}
              </p>
              <p className="tp-empty-sub">
                This section will be available once the{" "}
                {tab === "courses" ? "courses" : tab === "schedule" ? "training sessions" : "attendance"} module is connected.
              </p>
            </div>
          )}

        </div>
      </div>

      <Toast tone={toast?.tone} message={toast?.message} onDismiss={() => setToast(null)} />

      {deleteSkillId && (
        <ConfirmDialog
          title="Remove Skill?"
          message="This skill will be permanently removed from the trainer's profile."
          confirmLabel="Remove"
          onCancel={() => setDeleteSkillId(null)}
          onConfirm={() => handleDeleteSkill(deleteSkillId)}
        />
      )}
    </>
  );
}
