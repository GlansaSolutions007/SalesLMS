import { Controller } from "react-hook-form";
import FormField from "../../../../components/FormField.jsx";

export default function FormTextField({ control, name, label, required, type = "text", placeholder, error, disabled, maxLength }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormField label={required ? `${label} *` : label} error={error}>
          <input
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
          />
        </FormField>
      )}
    />
  );
}
