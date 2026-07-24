import FormTextField from "../components/FormTextField.jsx";
import FormSelectField from "../components/FormSelectField.jsx";
import LogoUploader from "../components/LogoUploader.jsx";
import { INDUSTRIES } from "../../companyData.js";
import { COUNTRIES, STATES_BY_COUNTRY, CITIES_BY_STATE } from "../../../../data/locations.js";

// The Laravel field order is City / State / Country, but a cascading picker
// only works usefully as Country -> State -> City, so that's the order
// rendered here; the submitted field names are unchanged.
export default function CompanyDetailsStep({ control, errors, watch, setValue }) {
  const country = watch("country");
  const state = watch("state");
  const stateOptions = STATES_BY_COUNTRY[country] ?? [];
  const cityOptions = CITIES_BY_STATE[state] ?? [];

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

      <div className="form-section-divider">
        <span className="form-section-title">Address Details</span>
      </div>

      <FormTextField control={control} name="address_line1" label="Address Line 1" required error={errors.address_line1?.message} />
      <FormTextField control={control} name="address_line2" label="Address Line 2" error={errors.address_line2?.message} />

      <div className="form-row">
        <FormSelectField
          control={control}
          name="country"
          label="Country"
          required
          options={COUNTRIES}
          error={errors.country?.message}
          onValueChange={() => {
            setValue("state", "");
            setValue("city", "");
          }}
        />
        <FormSelectField
          control={control}
          name="state"
          label="State"
          required
          options={stateOptions}
          error={errors.state?.message}
          disabled={!country}
          placeholder={country ? "Select state" : "Select country first"}
          onValueChange={() => setValue("city", "")}
        />
      </div>

      <div className="form-row">
        <FormSelectField
          control={control}
          name="city"
          label="City"
          required
          options={cityOptions}
          error={errors.city?.message}
          disabled={!state}
          placeholder={state ? "Select city" : "Select state first"}
        />
        <FormTextField control={control} name="pincode" label="Pincode" required maxLength={10} error={errors.pincode?.message} />
      </div>
    </div>
  );
}
