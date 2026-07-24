import Icon from "../../../components/Icon.jsx";
import Badge from "../../../components/Badge.jsx";

const STATUS_TONE = { Draft: "gray", Published: "green", Archived: "orange" };

export default function PublishSummary({ details, modules, assessment }) {
  const lessonCount = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const durationLabel = `${details.durationHours || 0}h ${details.durationMinutes || 0}m`;

  const rows = [
    { label: "Category", value: details.category || "—" },
    { label: "Difficulty", value: details.difficulty },
    { label: "Duration", value: durationLabel },
    { label: "Modules", value: modules.length },
    { label: "Lessons", value: lessonCount },
    { label: "Assessment", value: assessment.enabled ? assessment.title || "Untitled assessment" : "Not included" },
    { label: "Question Count", value: assessment.enabled ? assessment.questions.length : 0 },
  ];

  return (
    <div className="publish-summary">
      <div className="publish-summary-head">
        <div className="publish-summary-thumb">
          {details.thumbnail ? <img src={details.thumbnail} alt={details.name} /> : <Icon name="book" size={26} />}
        </div>
        <div>
          <p className="publish-summary-name">{details.name || "Untitled Course"}</p>
          <p className="publish-summary-code">{details.code}</p>
        </div>
        <Badge tone={STATUS_TONE[details.status] ?? "gray"}>{details.status}</Badge>
      </div>

      <div className="publish-summary-grid">
        {rows.map((row) => (
          <div key={row.label}>
            <span>{row.label}</span>
            <p>{row.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
