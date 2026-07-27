import * as yup from "yup";
import { EMAIL_REGEX, MOBILE_REGEX, PINCODE_REGEX, GST_REGEX, PAN_REGEX, WEBSITE_REGEX } from "../../../utils/formValidators.js";

// Only the fields this page actually edits (Sections 1-4 + status). Subscription
// and Settings are read-only here and never submitted.
export const editCompanySchema = yup.object({
  company_name: yup.string().default("").required("Company name is required."),
  company_code: yup.string().default(""),
  legal_name: yup.string().default(""),
  registration_number: yup.string().default(""),
  gst_number: yup
    .string()
    .default("")
    .test("gst-format", "Enter a valid GST number.", (value) => !value || GST_REGEX.test(value)),
  pan_number: yup
    .string()
    .default("")
    .test("pan-format", "Enter a valid PAN number.", (value) => !value || PAN_REGEX.test(value)),
  industry_type: yup.string().default("").required("Industry type is required."),
  website: yup
    .string()
    .default("")
    .test("is-url", "Enter a valid website URL.", (value) => !value || WEBSITE_REGEX.test(value)),
  status: yup.string().default("Active"),

  email: yup.string().default("").required("Email is required.").matches(EMAIL_REGEX, "Enter a valid email address."),
  mobile: yup.string().default("").required("Mobile number is required.").matches(MOBILE_REGEX, "Enter a valid mobile number."),
  phone: yup.string().default(""),

  address_line1: yup.string().default("").required("Address line 1 is required."),
  address_line2: yup.string().default(""),
  city: yup.string().default("").required("City is required."),
  state: yup.string().default("").required("State is required."),
  country: yup.string().default("").required("Country is required."),
  pincode: yup.string().default("").required("Pincode is required.").matches(PINCODE_REGEX, "Enter a valid pincode."),

  logo: yup.mixed().nullable().default(null),
});
