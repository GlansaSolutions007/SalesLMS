import { useEffect, useState } from "react";
import FormTextField from "../../../../components/FormTextField.jsx";
import PasswordField from "../components/PasswordField.jsx";

export default function AdminDetailsStep({ control, errors, watch, setValue }) {
  const [useCompanyDetails, setUseCompanyDetails] = useState(false);
  const companyEmail = watch("email");
  const companyMobile = watch("mobile");

  useEffect(() => {
    if (!useCompanyDetails) return;
    setValue("admin_email", companyEmail ?? "");
    setValue("admin_mobile", companyMobile ?? "");
  }, [useCompanyDetails, companyEmail, companyMobile, setValue]);

  return (
    <div className="form-fields-stack">
      <FormTextField control={control} name="admin_name" label="Admin Name" required error={errors.admin_name?.message} />

      <label className="ef-same-address">
        <input type="checkbox" checked={useCompanyDetails} onChange={(e) => setUseCompanyDetails(e.target.checked)} />
        <span>Use company email &amp; mobile number for admin</span>
      </label>

      <div className="form-row">
        <FormTextField
          control={control}
          name="admin_email"
          label="Admin Email"
          type="email"
          required
          disabled={useCompanyDetails}
          error={errors.admin_email?.message}
        />
        <FormTextField
          control={control}
          name="admin_mobile"
          label="Admin Mobile"
          required
          disabled={useCompanyDetails}
          error={errors.admin_mobile?.message}
        />
      </div>

      <div className="form-row">
        <PasswordField control={control} name="admin_password" label="Password" required error={errors.admin_password?.message} placeholder="Enter password" />
        <PasswordField
          control={control}
          name="admin_password_confirmation"
          label="Confirm Password"
          required
          error={errors.admin_password_confirmation?.message}
          placeholder="Re-enter password"
        />
      </div>
    </div>
  );
}
