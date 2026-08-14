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

// Employee Count drives Total Amount = Employee Count × Price Per Employee
// (see SubscriptionDetailsStep.jsx), so unlike the other subscription
// fields it can't stay optional.
function requiredNumeric(label) {
  return yup
    .string()
    .default("")
    .required(`${label} is required.`)
    .test("is-numeric", `${label} must be a number.`, (value) => !value || NUMERIC_REGEX.test(value));
}

// Field names deliberately mirror the Laravel API's multipart/form-data keys
// (snake_case) rather than the app's usual camelCase, so FormData
// construction and 422 validation-error mapping are a straight 1:1 lookup.
// Subscription plan/start and the full Admin section are required by
// product decision even though the Laravel API itself still treats them as
// optional (nullable) — the API happily accepts a company with no plan or
// admin, this UI just always asks for both.
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

  plan_id: yup.string().default("").required("Please select a subscription plan."),
  subscription_start: yup.string().default("").required("Subscription start date is required."),
  employee_limit: requiredNumeric("Employee count"),
  trainer_limit: optionalNumeric("Trainer limit"),
  storage_limit: optionalNumeric("Storage limit"),
  amount: optionalNumeric("Amount"),
  payment_status: yup.string().oneOf(["Pending", "Paid", "Failed", ""]).default(""),

  admin_name: yup.string().default("").required("Admin name is required."),
  admin_email: yup.string().default("").required("Admin email is required.").email("Enter a valid email address."),
  admin_mobile: yup.string().default("").required("Admin mobile number is required.").matches(MOBILE_REGEX, "Enter a valid mobile number."),
  admin_password: yup
    .string()
    .default("")
    .required("Password is required.")
    .min(8, "Password must be at least 8 characters."),
  admin_password_confirmation: yup
    .string()
    .default("")
    .required("Please confirm the password.")
    .oneOf([yup.ref("admin_password")], "Passwords do not match."),
});

export const defaultCompanyFormValues = companySchema.getDefault();
