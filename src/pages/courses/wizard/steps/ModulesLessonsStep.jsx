import FormField from "../../../../components/FormField.jsx";
import Icon from "../../../../components/Icon.jsx";
import ModuleCard from "../ModuleCard.jsx";
import LessonCard from "../LessonCard.jsx";

export default function ModulesLessonsStep({
  modules,
  selectedModuleId,
  errors,
  onSelectModule,
  onAddModule,
  onDeleteModule,
  onModuleFieldChange,
  onAddLesson,
  onDeleteLesson,
  onLessonFieldChange,
  onAddResource,
  onResourceChange,
  onResourceRemove,
  onPrevious,
  onSaveDraft,
  onNext,
  saving,
}) {
  const selectedModule = modules.find((m) => m.id === selectedModuleId) ?? null;
  const moduleErrors = errors.modules[selectedModuleId] ?? {};

  return (
    <div className="cw-step-body">
      {errors.general && (
        <div className="cw-step-alert">
          <Icon name="warning" size={15} />
          {errors.general}
        </div>
      )}

      <div className="modules-layout">
        <div className="modules-panel">
          <div className="modules-panel-head">
            <span>Modules</span>
            <span className="modules-panel-count">{modules.length}</span>
          </div>

          <div className="modules-list">
            {modules.map((module, index) => (
              <ModuleCard
                key={module.id}
                module={module}
                index={index}
                isActive={module.id === selectedModuleId}
                hasError={Boolean(errors.modules[module.id]) || module.lessons.some((l) => errors.lessons[l.id])}
                onClick={() => onSelectModule(module.id)}
                onDelete={() => onDeleteModule(module.id)}
              />
            ))}
            {modules.length === 0 && <p className="modules-empty-hint">No modules yet.</p>}
          </div>

          <button type="button" className="fa-outline-btn modules-add-btn" onClick={onAddModule}>
            <Icon name="plus" size={15} />
            Add Module
          </button>
        </div>

        <div className="modules-detail">
          {!selectedModule ? (
            <div className="modules-detail-empty">
              <Icon name="layers" size={26} />
              <p>Select a module on the left, or add a new one to get started.</p>
            </div>
          ) : (
            <>
              <div className="modules-detail-fields">
                <FormField label="Module Name *" error={moduleErrors.name}>
                  <input
                    type="text"
                    value={selectedModule.name}
                    onChange={(e) => onModuleFieldChange(selectedModule.id, "name", e.target.value)}
                    placeholder="e.g. Introduction to Selling"
                  />
                </FormField>
                <FormField label="Description">
                  <textarea
                    rows={2}
                    value={selectedModule.description}
                    onChange={(e) => onModuleFieldChange(selectedModule.id, "description", e.target.value)}
                  />
                </FormField>
                <div className="form-row">
                  <FormField label="Estimated Duration">
                    <input
                      type="text"
                      value={selectedModule.estimatedDuration}
                      onChange={(e) => onModuleFieldChange(selectedModule.id, "estimatedDuration", e.target.value)}
                      placeholder="e.g. 1h 20m"
                    />
                  </FormField>
                  <FormField label="Sequence Number">
                    <input
                      type="number"
                      min="1"
                      value={selectedModule.sequence}
                      onChange={(e) => onModuleFieldChange(selectedModule.id, "sequence", e.target.value)}
                    />
                  </FormField>
                </div>
              </div>

              <div className="lessons-section">
                <div className="lessons-section-head">
                  <h4>Lessons</h4>
                </div>

                {selectedModule.lessons.length === 0 ? (
                  <p className="modules-empty-hint">No lessons in this module yet.</p>
                ) : (
                  <div className="lessons-list">
                    {selectedModule.lessons.map((lesson, index) => (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        index={index}
                        errors={errors.lessons[lesson.id] ?? {}}
                        resourceErrors={errors.resources?.[lesson.id]}
                        onChange={(field, value) => onLessonFieldChange(selectedModule.id, lesson.id, field, value)}
                        onDelete={() => onDeleteLesson(selectedModule.id, lesson.id)}
                        onAddResource={() => onAddResource(selectedModule.id, lesson.id)}
                        onResourceChange={(resourceId, field, value) => onResourceChange(selectedModule.id, lesson.id, resourceId, field, value)}
                        onResourceRemove={(resourceId) => onResourceRemove(selectedModule.id, lesson.id, resourceId)}
                      />
                    ))}
                  </div>
                )}

                <button type="button" className="fa-outline-btn" onClick={() => onAddLesson(selectedModule.id)}>
                  <Icon name="plus" size={15} />
                  Add Lesson
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="cw-step-footer">
        <button type="button" className="cl-btn" onClick={onPrevious} disabled={saving}>
          <Icon name="back" size={15} />
          Previous
        </button>
        <div className="cw-step-footer-right">
          <button type="button" className="cl-btn" onClick={onSaveDraft} disabled={saving}>
            <Icon name="download" size={15} style={{ transform: "rotate(90deg)" }} />
            Save Draft
          </button>
          <button type="button" className="dash-primary-btn" onClick={onNext} disabled={saving}>
            Next
            <Icon name="arrow" size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
