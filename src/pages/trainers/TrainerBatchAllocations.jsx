import Badge from "../../components/Badge.jsx";
import CrudPage from "../../components/CrudPage.jsx";
import TrainerTabs from "./TrainerTabs.jsx";

const STATUS_TONE = { Scheduled: "blue", Ongoing: "green", Completed: "gray" };

const SEED = [
  { id: 1, trainerName: "Robert Jackson", batchName: "Batch A - Jul 2026", course: "Sales Fundamentals", startDate: "2026-07-06", endDate: "2026-07-24", status: "Ongoing" },
  { id: 2, trainerName: "Elena Rodriguez", batchName: "Batch B - Jul 2026", course: "Effective Communication", startDate: "2026-07-13", endDate: "2026-07-31", status: "Ongoing" },
  { id: 3, trainerName: "Carlos Mendez", batchName: "Batch C - Aug 2026", course: "Negotiation Mastery", startDate: "2026-08-03", endDate: "2026-08-21", status: "Scheduled" },
  { id: 4, trainerName: "Michael Osei", batchName: "Batch D - Jun 2026", course: "Product Knowledge", startDate: "2026-06-01", endDate: "2026-06-19", status: "Completed" },
  { id: 5, trainerName: "Hannah Kim", batchName: "Batch E - Aug 2026", course: "Objection Handling", startDate: "2026-08-10", endDate: "2026-08-28", status: "Scheduled" },
  { id: 6, trainerName: "Daniel Brooks", batchName: "Batch F - Jun 2026", course: "Customer Service Essentials", startDate: "2026-06-15", endDate: "2026-07-03", status: "Completed" },
];

const COLUMNS = [
  { key: "trainerName", header: "Trainer", render: (r) => <b>{r.trainerName}</b> },
  { key: "batchName", header: "Batch" },
  { key: "course", header: "Course" },
  { key: "startDate", header: "Start Date" },
  { key: "endDate", header: "End Date" },
  { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge> },
];

const FIELDS = [
  { key: "trainerName", label: "Trainer Name", type: "text", required: true },
  { key: "batchName", label: "Batch Name", type: "text", required: true },
  { key: "course", label: "Course", type: "text" },
  { key: "startDate", label: "Start Date", type: "text" },
  { key: "endDate", label: "End Date", type: "text" },
  { key: "status", label: "Status", type: "select", options: ["Scheduled", "Ongoing", "Completed"] },
];

export default function TrainerBatchAllocations() {
  return (
    <CrudPage
      title="Batch Allocation"
      breadcrumbLabel="Batch Allocation"
      entityLabel="Allocation"
      seed={SEED}
      columns={COLUMNS}
      searchFields={["trainerName", "batchName", "course"]}
      statusOptions={["All", "Scheduled", "Ongoing", "Completed"]}
      sortOptions={[
        { key: "trainerName", label: "Trainer" },
        { key: "startDate", label: "Start Date" },
      ]}
      fields={FIELDS}
      subNav={<TrainerTabs />}
    />
  );
}
