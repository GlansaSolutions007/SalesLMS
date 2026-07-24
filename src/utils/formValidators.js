export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MOBILE_REGEX = /^\+?[0-9]{7,15}$/;
export const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,32}$/;
export const PINCODE_REGEX = /^\d{4,10}$/;

export function req(value, message) {
  return String(value ?? "").trim() ? null : message;
}

export function passwordStrength(password) {
  const value = String(password ?? "");
  let score = 0;
  if (value.length >= 8) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;

  const levels = [
    { label: "Very weak", tone: "danger" },
    { label: "Weak", tone: "danger" },
    { label: "Fair", tone: "warning" },
    { label: "Good", tone: "warning" },
    { label: "Strong", tone: "success" },
  ];
  const level = value ? levels[score] : { label: "", tone: "danger" };
  return { score: value ? score + 1 : 0, ...level };
}
