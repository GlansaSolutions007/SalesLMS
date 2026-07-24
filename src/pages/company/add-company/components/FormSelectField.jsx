import { Controller } from "react-hook-form";
import FormField from "../../../../components/FormField.jsx";

export default function FormSelectField({
  control,
  name,
  label,
  required,
  options,
  error,
  disabled,
  placeholder = "Select an option",
  getOptionLabel = (opt) => opt,
  getOptionValue = (opt) => opt,
  onValueChange,
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormField label={required ? `${label} *` : label} error={error}>
          <select
            value={field.value ?? ""}
            onChange={(e) => {
              field.onChange(e);
              onValueChange?.(e.target.value);
            }}
            onBlur={field.onBlur}
            disabled={disabled}
            ref={field.ref}
          >
            <option value="">{placeholder}</option>
            {options.map((opt) => (
              <option key={getOptionValue(opt)} value={getOptionValue(opt)}>
                {getOptionLabel(opt)}
              </option>
            ))}
          </select>
        </FormField>
      )}
    />
  );
}
