import { useNavigate } from "react-router-dom";
import Badge from "../../components/Badge.jsx";
import Icon from "../../components/Icon.jsx";
import StarRating from "../../components/StarRating.jsx";
import CrudPage from "../../components/CrudPage.jsx";
import TrainerTabs from "./TrainerTabs.jsx";
import { TRAINERS, EXPERTISE_AREAS } from "./trainerData.js";
import { ROUTES } from "../../router/routePaths.js";

const STATUS_TONE = { Active: "green", "On Leave": "orange", Inactive: "gray" };

function initials(name) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const COLUMNS = [
  {
    key: "name",
    header: "Trainer",
    render: (r) => (
      <div className="emp-cell">
        <span className="emp-avatar">{initials(r.name)}</span>
        <div>
          <p className="emp-name">{r.name}</p>
          <p className="emp-code">{r.trainerCode}</p>
        </div>
      </div>
    ),
  },
  { key: "expertise", header: "Expertise" },
  { key: "coursesAssigned", header: "Courses" },
  { key: "batchesAssigned", header: "Batches" },
  { key: "rating", header: "Rating", render: (r) => <StarRating value={r.rating} size={13} /> },
  { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge> },
];

const FIELDS = [
  { key: "name", label: "Full Name", type: "text", required: true },
  { key: "trainerCode", label: "Trainer Code", type: "text", required: true },
  { key: "expertise", label: "Expertise", type: "select", options: EXPERTISE_AREAS },
  { key: "coursesAssigned", label: "Courses Assigned", type: "number" },
  { key: "batchesAssigned", label: "Batches Assigned", type: "number" },
  { key: "rating", label: "Rating (0-5)", type: "number" },
  { key: "status", label: "Status", type: "select", options: ["Active", "On Leave", "Inactive"] },
];

export default function TrainerList() {
  const navigate = useNavigate();

  return (
    <CrudPage
      title="Trainers"
      breadcrumbLabel="All Trainers"
      entityLabel="Trainer"
      seed={TRAINERS}
      columns={COLUMNS}
      searchFields={["name", "trainerCode", "expertise"]}
      statusOptions={["All", "Active", "On Leave", "Inactive"]}
      sortOptions={[
        { key: "name", label: "Name" },
        { key: "rating", label: "Rating" },
      ]}
      fields={FIELDS}
      subNav={<TrainerTabs />}
      extraRowAction={(row) => (
        <button
          type="button"
          className="dash-icon-btn"
          aria-label={`View ${row.name}`}
          onClick={() => navigate(ROUTES.TRAINER_PROFILE, { state: { trainer: row } })}
        >
          <Icon name="eye" size={15} />
        </button>
      )}
    />
  );
}
