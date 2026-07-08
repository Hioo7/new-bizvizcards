export type PasswordStrengthLevel = 0 | 1 | 2 | 3;

export interface PasswordStrength {
  level: PasswordStrengthLevel;
  label: "" | "Weak" | "Fair" | "Strong";
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { level: 0, label: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: "Weak" };
  if (score <= 3) return { level: 2, label: "Fair" };
  return { level: 3, label: "Strong" };
}
