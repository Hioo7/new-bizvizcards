export interface Country {
  iso: string;
  name: string;
  dial: string;
}

// Shared by both exchange-contact popups (legacy fixed form and the dynamic
// custom-form one) — previously duplicated verbatim in each.
export const COUNTRIES: Country[] = [
  { iso: "IN", name: "India", dial: "91" },
  { iso: "US", name: "United States", dial: "1" },
  { iso: "GB", name: "United Kingdom", dial: "44" },
  { iso: "CA", name: "Canada", dial: "1" },
  { iso: "AU", name: "Australia", dial: "61" },
  { iso: "SG", name: "Singapore", dial: "65" },
  { iso: "AE", name: "United Arab Emirates", dial: "971" },
];

export function isoToFlag(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return code;
  const base = 0x1f1e6;
  const first = code.toUpperCase().charCodeAt(0) - 65;
  const second = code.toUpperCase().charCodeAt(1) - 65;
  return String.fromCodePoint(base + first, base + second);
}
