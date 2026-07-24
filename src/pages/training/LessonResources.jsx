import Badge from "../../components/Badge.jsx";
import TrainingCrudPage from "./TrainingCrudPage.jsx";

const STATUS_TONE = { Active: "green", Archived: "gray" };
const TYPE_TONE = { PDF: "orange", Video: "blue", Link: "purple", Slides: "green" };

const SEED = [
  { id: 1, name: "Sales Funnel Worksheet.pdf", lesson: "The Sales Funnel", type: "PDF", size: "1.2 MB", uploadedAt: "2026-06-02", status: "Active" },
  { id: 2, name: "Why Customers Buy.mp4", lesson: "Why Customers Buy", type: "Video", size: "84 MB", uploadedAt: "2026-06-02", status: "Active" },
  { id: 3, name: "Rapport Checklist", lesson: "Building Trust Fast", type: "Link", size: "-", uploadedAt: "2026-06-05", status: "Active" },
  { id: 4, name: "Listening Techniques.pptx", lesson: "Listening Techniques", type: "Slides", size: "3.4 MB", uploadedAt: "2026-06-10", status: "Active" },
  { id: 5, name: "Objection Scripts.pdf", lesson: "Reframing Objections", type: "PDF", size: "0.8 MB", uploadedAt: "2026-06-14", status: "Active" },
  { id: 6, name: "Negotiation Tactics.mp4", lesson: "Negotiation Tactics", type: "Video", size: "112 MB", uploadedAt: "2026-06-18", status: "Archived" },
  { id: 7, name: "Closing Cheatsheet.pdf", lesson: "Closing Assessment", type: "PDF", size: "0.6 MB", uploadedAt: "2026-06-20", status: "Active" },
];

const COLUMNS = [
  { key: "name", header: "Resource", render: (r) => <b>{r.name}</b> },
  { key: "lesson", header: "Lesson" },
  { key: "type", header: "Type", render: (r) => <Badge tone={TYPE_TONE[r.type]}>{r.type}</Badge> },
  { key: "size", header: "Size" },
  { key: "uploadedAt", header: "Uploaded" },
  { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge> },
];

const FIELDS = [
  { key: "name", label: "Resource Name", type: "text", required: true },
  { key: "lesson", label: "Lesson", type: "text", required: true },
  { key: "type", label: "Type", type: "select", options: ["PDF", "Video", "Link", "Slides"] },
  { key: "size", label: "Size", type: "text" },
  { key: "uploadedAt", label: "Uploaded Date", type: "text" },
  { key: "status", label: "Status", type: "select", options: ["Active", "Archived"] },
];

export default function LessonResources() {
  return (
    <TrainingCrudPage
      title="Lesson Resources"
      breadcrumbLabel="Resources"
      entityLabel="Resource"
      seed={SEED}
      columns={COLUMNS}
      searchFields={["name", "lesson"]}
      statusOptions={["All", "Active", "Archived"]}
      sortOptions={[
        { key: "name", label: "Name" },
        { key: "uploadedAt", label: "Upload Date" },
      ]}
      fields={FIELDS}
    />
  );
}
