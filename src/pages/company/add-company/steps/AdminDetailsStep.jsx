import FormTextField from "../components/FormTextField.jsx";
import PasswordField from "../components/PasswordField.jsx";

export default function AdminDetailsStep({ control, errors, watch }) {
  const hasPassword = Boolean(watch("admin_password"));

  return (
    <div className="form-fields-stack">
      <p className="form-hint-box">This step is optional. Leave the password blank to skip creating a login for a company admin right now.</p>

      <div className="form-row">
        <FormTextField control={control} name="admin_name" label="Admin Name" error={errors.admin_name?.message} />
        <FormTextField control={control} name="admin_email" label="Admin Email" type="email" error={errors.admin_email?.message} />
      </div>

      <FormTextField control={control} name="admin_mobile" label="Admin Mobile" error={errors.admin_mobile?.message} />

      <div className="form-row">
        <PasswordField control={control} name="admin_password" label="Password" error={errors.admin_password?.message} placeholder="Leave blank to skip" />
        <PasswordField
          control={control}
          name="admin_password_confirmation"
          label="Confirm Password"
          required={hasPassword}
          error={errors.admin_password_confirmation?.message}
          placeholder="Re-enter password"
        />
      </div>
    </div>
  );
}
