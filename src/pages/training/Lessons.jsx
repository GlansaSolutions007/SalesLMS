import Badge from "../../components/Badge.jsx";
import TrainingCrudPage from "./TrainingCrudPage.jsx";

const STATUS_TONE = { Published: "green", Draft: "gray" };
const TYPE_TONE = { Video: "blue", Document: "purple", Quiz: "orange" };

const SEED = [
  { id: 1, title: "Why Customers Buy", module: "Introduction to Selling", type: "Video", duration: "12m", order: 1, status: "Published" },
  { id: 2, title: "The Sales Funnel", module: "Introduction to Selling", type: "Document", duration: "8m", order: 2, status: "Published" },
  { id: 3, title: "Building Trust Fast", module: "Building Rapport", type: "Video", duration: "15m", order: 1, status: "Published" },
  { id: 4, title: "Rapport Quiz", module: "Building Rapport", type: "Quiz", duration: "5m", order: 2, status: "Draft" },
  { id: 5, title: "Listening Techniques", module: "Active Listening", type: "Video", duration: "18m", order: 1, status: "Published" },
  { id: 6, title: "Reframing Objections", module: "Handling Pushback", type: "Video", duration: "14m", order: 1, status: "Published" },
  { id: 7, title: "Negotiation Tactics", module: "Negotiation Foundations", type: "Document", duration: "10m", order: 1, status: "Published" },
  { id: 8, title: "Closing Assessment", module: "Closing Techniques", type: "Quiz", duration: "7m", order: 1, status: "Draft" },
];

const COLUMNS = [
  { key: "title", header: "Lesson", render: (r) => <b>{r.title}</b> },
  { key: "module", header: "Module" },
  { key: "type", header: "Type", render: (r) => <Badge tone={TYPE_TONE[r.type]}>{r.type}</Badge> },
  { key: "duration", header: "Duration" },
  { key: "order", header: "Order" },
  { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge> },
];

const FIELDS = [
  { key: "title", label: "Lesson Title", type: "text", required: true },
  { key: "module", label: "Module", type: "text", required: true },
  { key: "type", label: "Type", type: "select", options: ["Video", "Document", "Quiz"] },
  { key: "duration", label: "Duration (e.g. 12m)", type: "text" },
  { key: "order", label: "Order", type: "number" },
  { key: "status", label: "Status", type: "select", options: ["Published", "Draft"] },
];

export default function Lessons() {
  return (
    <TrainingCrudPage
      title="Lessons"
      breadcrumbLabel="Lessons"
      entityLabel="Lesson"
      seed={SEED}
      columns={COLUMNS}
      searchFields={["title", "module"]}
      statusOptions={["All", "Published", "Draft"]}
      sortOptions={[
        { key: "title", label: "Title" },
        { key: "order", label: "Order" },
      ]}
      fields={FIELDS}
    />
  );
}
