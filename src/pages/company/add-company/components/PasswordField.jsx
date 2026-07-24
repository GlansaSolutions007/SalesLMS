import { useState } from "react";
import { Controller } from "react-hook-form";
import FormField from "../../../../components/FormField.jsx";
import Icon from "../../../../components/Icon.jsx";

export default function PasswordField({ control, name, label, required, error, placeholder }) {
  const [visible, setVisible] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormField label={required ? `${label} *` : label} error={error}>
          <div className="form-password-input">
            <input
              type={visible ? "text" : "password"}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              placeholder={placeholder}
            />
            <button type="button" onClick={() => setVisible((v) => !v)} aria-label="Toggle password visibility">
              <Icon name="eye" size={16} />
            </button>
          </div>
        </FormField>
      )}
    />
  );
}
