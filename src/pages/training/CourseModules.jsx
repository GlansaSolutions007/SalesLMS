import Badge from "../../components/Badge.jsx";
import TrainingCrudPage from "./TrainingCrudPage.jsx";

const STATUS_TONE = { Published: "green", Draft: "gray" };

const SEED = [
  { id: 1, title: "Introduction to Selling", course: "Sales Fundamentals", order: 1, lessonsCount: 4, duration: "1h 20m", status: "Published" },
  { id: 2, title: "Building Rapport", course: "Sales Fundamentals", order: 2, lessonsCount: 3, duration: "55m", status: "Published" },
  { id: 3, title: "Active Listening", course: "Effective Communication", order: 1, lessonsCount: 5, duration: "1h 40m", status: "Published" },
  { id: 4, title: "Persuasive Language", course: "Effective Communication", order: 2, lessonsCount: 4, duration: "1h 10m", status: "Draft" },
  { id: 5, title: "Negotiation Foundations", course: "Negotiation Mastery", order: 1, lessonsCount: 6, duration: "2h 05m", status: "Published" },
  { id: 6, title: "Closing Techniques", course: "Advanced Closing Techniques", order: 1, lessonsCount: 5, duration: "1h 50m", status: "Draft" },
  { id: 7, title: "Product Deep Dive", course: "Product Knowledge", order: 1, lessonsCount: 3, duration: "50m", status: "Published" },
  { id: 8, title: "Handling Pushback", course: "Objection Handling", order: 1, lessonsCount: 4, duration: "1h 05m", status: "Published" },
];

const COLUMNS = [
  { key: "title", header: "Module", render: (r) => <b>{r.title}</b> },
  { key: "course", header: "Course" },
  { key: "lessonsCount", header: "Lessons" },
  { key: "duration", header: "Duration" },
  { key: "order", header: "Order" },
  { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge> },
];

const FIELDS = [
  { key: "title", label: "Module Title", type: "text", required: true },
  { key: "course", label: "Course", type: "text", required: true },
  { key: "order", label: "Order", type: "number" },
  { key: "duration", label: "Duration (e.g. 1h 20m)", type: "text" },
  { key: "lessonsCount", label: "Lessons Count", type: "number" },
  { key: "status", label: "Status", type: "select", options: ["Published", "Draft"] },
];

export default function CourseModules() {
  return (
    <TrainingCrudPage
      title="Course Modules"
      breadcrumbLabel="Modules"
      entityLabel="Module"
      seed={SEED}
      columns={COLUMNS}
      searchFields={["title", "course"]}
      statusOptions={["All", "Published", "Draft"]}
      sortOptions={[
        { key: "title", label: "Title" },
        { key: "order", label: "Order" },
      ]}
      fields={FIELDS}
    />
  );
}
