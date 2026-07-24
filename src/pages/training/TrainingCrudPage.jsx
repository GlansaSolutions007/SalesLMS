import CrudPage from "../../components/CrudPage.jsx";
import TrainingTabs from "../../components/TrainingTabs.jsx";

export default function TrainingCrudPage(props) {
  return <CrudPage subNav={<TrainingTabs />} {...props} />;
}
