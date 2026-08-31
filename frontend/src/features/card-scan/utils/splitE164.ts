import { COMMON_CALLING_CODES } from "@features/card-scan/config/callingCodes";

export interface SplitPhone {
  countryDialCode?: string;
  phoneNumber?: string;
}

/**
 * Best-effort split of a scanned E.164 number (`+14155550123`) into the
 * dial-code + national-number shape the lead form uses.
 *
 * The list of calling codes isn't exhaustive; an unrecognised number falls
 * back to putting the whole string in the phone field so nothing is lost —
 * the user can fix it before saving.
 */
export function splitE164(raw: string): SplitPhone {
  const trimmed = raw.trim();
  const match = /^\+(\d{6,15})$/.exec(trimmed);
  if (!match) {
    return trimmed ? { phoneNumber: trimmed } : {};
  }

  const digits = match[1];
  for (const code of COMMON_CALLING_CODES) {
    if (digits.length > code.length && digits.startsWith(code)) {
      return {
        countryDialCode: `+${code}`,
        phoneNumber: digits.slice(code.length),
      };
    }
  }
  return { phoneNumber: trimmed };
}
