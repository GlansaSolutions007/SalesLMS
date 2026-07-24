import FormTextField from "../components/FormTextField.jsx";
import FormSelectField from "../components/FormSelectField.jsx";
import { COUNTRIES, STATES_BY_COUNTRY, CITIES_BY_STATE } from "../../../../data/locations.js";

// The Laravel field order is City / State / Country, but a cascading picker
// only works usefully as Country -> State -> City, so that's the order
// rendered here; the submitted field names are unchanged.
export default function AddressDetailsStep({ control, errors, watch, setValue }) {
  const country = watch("country");
  const state = watch("state");
  const stateOptions = STATES_BY_COUNTRY[country] ?? [];
  const cityOptions = CITIES_BY_STATE[state] ?? [];

  return (
    <div className="form-fields-stack">
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
