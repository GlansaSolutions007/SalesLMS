import Badge from "../../components/Badge.jsx";
import TrainingCrudPage from "./TrainingCrudPage.jsx";

const STATUS_TONE = { Active: "green", Inactive: "gray" };

const SEED = [
  { id: 1, name: "Sales Skills", slug: "sales-skills", coursesCount: 18, status: "Active" },
  { id: 2, name: "Communication", slug: "communication", coursesCount: 9, status: "Active" },
  { id: 3, name: "Negotiation", slug: "negotiation", coursesCount: 6, status: "Active" },
  { id: 4, name: "Product", slug: "product", coursesCount: 11, status: "Active" },
  { id: 5, name: "Leadership", slug: "leadership", coursesCount: 5, status: "Active" },
  { id: 6, name: "Customer Service", slug: "customer-service", coursesCount: 8, status: "Active" },
  { id: 7, name: "Digital Selling", slug: "digital-selling", coursesCount: 4, status: "Inactive" },
  { id: 8, name: "Compliance", slug: "compliance", coursesCount: 3, status: "Active" },
  { id: 9, name: "Onboarding", slug: "onboarding", coursesCount: 2, status: "Inactive" },
];

const COLUMNS = [
  { key: "name", header: "Category Name", render: (r) => <b>{r.name}</b> },
  { key: "slug", header: "Slug" },
  { key: "coursesCount", header: "Courses" },
  { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge> },
];

const FIELDS = [
  { key: "name", label: "Category Name", type: "text", required: true },
  { key: "slug", label: "Slug", type: "text", required: true },
  { key: "coursesCount", label: "Courses Count", type: "number" },
  { key: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
];

export default function CourseCategories() {
  return (
    <TrainingCrudPage
      title="Course Categories"
      breadcrumbLabel="Categories"
      entityLabel="Category"
      seed={SEED}
      columns={COLUMNS}
      searchFields={["name", "slug"]}
      statusOptions={["All", "Active", "Inactive"]}
      sortOptions={[
        { key: "name", label: "Name" },
        { key: "coursesCount", label: "Courses" },
      ]}
      fields={FIELDS}
    />
  );
}
