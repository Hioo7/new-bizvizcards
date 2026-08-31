import type { LeadFormPrefill } from "@app-types/lead";
import { LEAD_NOTE_MAX_LENGTH } from "@features/card-scan/config";
import { splitE164 } from "@features/card-scan/utils/splitE164";
import type { ScannedContact } from "@features/card-scan/types";

/**
 * Turns the OCR result into New Lead form prefill values.
 *
 * - `job_title` → profession, `company` → company, first email → email
 * - first phone (E.164) → best-effort dial-code + number split
 * - `address` and any `websites` are folded into the note (the form has no
 *   field for them), truncated to the backend's note limit
 * - `raw_text` is NOT put in the note — it's surfaced separately as a
 *   read-only "scanned text" hint
 */
export function mapExtractionToLead(contact: ScannedContact): LeadFormPrefill {
  const prefill: LeadFormPrefill = {};

  if (contact.name) prefill.name = contact.name;
  if (contact.job_title) prefill.profession = contact.job_title;
  if (contact.company) prefill.company = contact.company;
  if (contact.emails[0]) prefill.email = contact.emails[0];

  if (contact.phones[0]) {
    const { countryDialCode, phoneNumber } = splitE164(contact.phones[0]);
    if (countryDialCode) prefill.countryDialCode = countryDialCode;
    if (phoneNumber) prefill.phoneNumber = phoneNumber;
  }

  const noteParts: string[] = [];
  if (contact.address) noteParts.push(contact.address);
  if (contact.websites.length > 0) noteParts.push(contact.websites.join("\n"));
  if (noteParts.length > 0) {
    const note = noteParts.join("\n\n");
    prefill.note =
      note.length > LEAD_NOTE_MAX_LENGTH
        ? `${note.slice(0, LEAD_NOTE_MAX_LENGTH - 1)}…`
        : note;
  }

  return prefill;
}
