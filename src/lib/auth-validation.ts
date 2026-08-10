export type FieldErrors = Partial<Record<"name" | "email" | "password", string>>;

type ValidationResult<T> = {
  values: T;
  errors: FieldErrors;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{12,128}$/;

export const PASSWORD_POLICY = "Use at least 12 characters, including a letter and a number.";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function emailError(email: string) {
  return EMAIL_PATTERN.test(normalizeEmail(email)) ? undefined : "Enter a valid email address.";
}

export function passwordPolicyError(password: string) {
  return PASSWORD_PATTERN.test(password) ? undefined : PASSWORD_POLICY;
}

export function validateLogin(values: { email: string; password: string }): ValidationResult<typeof values> {
  const normalized = { email: normalizeEmail(values.email), password: values.password };
  return {
    values: normalized,
    errors: {
      ...(emailError(values.email) ? { email: emailError(values.email) } : {}),
      ...(!values.password ? { password: "Enter your password." } : {}),
    },
  };
}

export function validateRegistration(values: {
  name: string;
  email: string;
  password: string;
}): ValidationResult<typeof values> {
  const normalized = {
    name: values.name.trim(),
    email: normalizeEmail(values.email),
    password: values.password,
  };
  return {
    values: normalized,
    errors: {
      ...(!normalized.name ? { name: "Enter your name." } : {}),
      ...(emailError(values.email) ? { email: emailError(values.email) } : {}),
      ...(passwordPolicyError(values.password) ? { password: passwordPolicyError(values.password) } : {}),
    },
  };
}
