import * as yup from "yup";

const MOBILE_REGEX = /^\+?[0-9]{7,15}$/;
const PINCODE_REGEX = /^\d{4,10}$/;
const WEBSITE_REGEX = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}([/?#]\S*)?$/i;
const NUMERIC_REGEX = /^\d+(\.\d+)?$/;

function optionalNumeric(label) {
  return yup
    .string()
    .default("")
    .test("is-numeric", `${label} must be a number.`, (value) => !value || NUMERIC_REGEX.test(value));
}

// Field names deliberately mirror the Laravel API's multipart/form-data keys
// (snake_case) rather than the app's usual camelCase, so FormData
// construction and 422 validation-error mapping are a straight 1:1 lookup.
// Only the fields the API marks as required are enforced here — everything
// else is intentionally optional per the spec, even though the UI shows
// most of them across all four steps.
export const companySchema = yup.object({
  company_code: yup.string().default(""),
  company_name: yup.string().default("").required("Company name is required."),
  legal_name: yup.string().default(""),
  registration_number: yup.string().default(""),
  gst_number: yup.string().default(""),
  pan_number: yup.string().default(""),
  industry_type: yup.string().default(""),
  website: yup
    .string()
    .default("")
    .test("is-url", "Enter a valid website URL.", (value) => !value || WEBSITE_REGEX.test(value)),
  email: yup.string().default("").required("Email is required.").email("Enter a valid email address."),
  mobile: yup.string().default("").required("Mobile number is required.").matches(MOBILE_REGEX, "Enter a valid mobile number."),
  phone: yup.string().default(""),
  logo: yup.mixed().nullable().default(null),

  address_line1: yup.string().default("").required("Address line 1 is required."),
  address_line2: yup.string().default(""),
  city: yup.string().default("").required("City is required."),
  state: yup.string().default("").required("State is required."),
  country: yup.string().default("").required("Country is required."),
  pincode: yup.string().default("").required("Pincode is required.").matches(PINCODE_REGEX, "Enter a valid pincode."),

  plan_id: yup.string().default(""),
  subscription_start: yup.string().default(""),
  employee_limit: optionalNumeric("Employee limit"),
  trainer_limit: optionalNumeric("Trainer limit"),
  storage_limit: optionalNumeric("Storage limit"),
  amount: optionalNumeric("Amount"),
  payment_status: yup.string().oneOf(["Pending", "Paid", "Failed", ""]).default(""),

  admin_name: yup.string().default(""),
  admin_email: yup
    .string()
    .default("")
    .test("email-if-present", "Enter a valid email address.", (value) => !value || yup.string().email().isValidSync(value)),
  admin_mobile: yup
    .string()
    .default("")
    .test("mobile-if-present", "Enter a valid mobile number.", (value) => !value || MOBILE_REGEX.test(value)),
  // Only validate password (strength/confirmation) if the admin chose to set
  // one — the whole Admin step is optional per spec.
  admin_password: yup
    .string()
    .default("")
    .test("min-length-if-present", "Password must be at least 8 characters.", (value) => !value || value.length >= 8),
  admin_password_confirmation: yup
    .string()
    .default("")
    .when("admin_password", {
      is: (value) => Boolean(value),
      then: (schema) => schema.required("Please confirm the password.").oneOf([yup.ref("admin_password")], "Passwords do not match."),
      otherwise: (schema) => schema,
    }),
});

export const defaultCompanyFormValues = companySchema.getDefault();

export const WIZARD_STEPS = [
  {
    key: "details",
    label: "Company Details",
    fields: [
      "company_code",
      "company_name",
      "legal_name",
      "registration_number",
      "gst_number",
      "pan_number",
      "industry_type",
      "website",
      "email",
      "mobile",
      "phone",
      "logo",
      "address_line1",
      "address_line2",
      "city",
      "state",
      "country",
      "pincode",
    ],
  },
  {
    key: "subscription",
    label: "Subscription Details",
    fields: ["plan_id", "subscription_start", "employee_limit", "trainer_limit", "storage_limit", "amount", "payment_status"],
  },
  {
    key: "admin",
    label: "Company Admin Details",
    fields: ["admin_name", "admin_email", "admin_mobile", "admin_password", "admin_password_confirmation"],
  },
];
