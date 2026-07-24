import FormTextField from "../components/FormTextField.jsx";
import FormSelectField from "../components/FormSelectField.jsx";
import LogoUploader from "../components/LogoUploader.jsx";
import { INDUSTRIES } from "../../companyData.js";

export default function CompanyDetailsStep({ control, errors }) {
  return (
    <div className="form-fields-stack">
      <div className="form-logo-row">
        <LogoUploader control={control} name="logo" label="Company Logo" />
      </div>

      <div className="form-row">
        <FormTextField control={control} name="company_code" label="Company Code" placeholder="Optional" error={errors.company_code?.message} />
        <FormTextField control={control} name="company_name" label="Company Name" required error={errors.company_name?.message} />
      </div>

      <div className="form-row">
        <FormTextField control={control} name="legal_name" label="Legal Name" error={errors.legal_name?.message} />
        <FormTextField control={control} name="registration_number" label="Registration Number" error={errors.registration_number?.message} />
      </div>

      <div className="form-row">
        <FormTextField control={control} name="gst_number" label="GST Number" maxLength={15} error={errors.gst_number?.message} />
        <FormTextField control={control} name="pan_number" label="PAN Number" maxLength={10} error={errors.pan_number?.message} />
      </div>

      <div className="form-row">
        <FormSelectField control={control} name="industry_type" label="Industry Type" options={INDUSTRIES} error={errors.industry_type?.message} />
        <FormTextField control={control} name="website" label="Website" placeholder="https://example.com" error={errors.website?.message} />
      </div>

      <div className="form-row">
        <FormTextField control={control} name="email" label="Company Email" type="email" required error={errors.email?.message} />
        <FormTextField control={control} name="mobile" label="Mobile Number" required error={errors.mobile?.message} />
      </div>

      <FormTextField control={control} name="phone" label="Phone Number" error={errors.phone?.message} />
    </div>
  );
}
