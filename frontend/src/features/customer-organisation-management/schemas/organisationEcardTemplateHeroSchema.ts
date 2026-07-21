import { z } from "zod";
import {
  ECARD_PHONE_NUMBER_DIGITS_REGEX,
  ECARD_PHONE_NUMBER_MAX_DIGITS,
  ECARD_PHONE_NUMBER_MIN_DIGITS,
  ECARD_TEXT_SHORT_MAX_LENGTH,
} from "@features/ecards";

// Same phone-pairing validation as the e-card's own heroSheetSchema, but
// name/email/companyName are all optional here — a SPOC very often leaves
// personal identity fields blank on purpose, deferring to each member's own
// e-card (see the backend merge util for the exact precedence).
export const organisationEcardTemplateHeroSheetSchema = z
  .object({
    name: z.string().trim().max(ECARD_TEXT_SHORT_MAX_LENGTH),
    email: z
      .string()
      .trim()
      .refine((value) => value === "" || z.email().safeParse(value).success, {
        message: "Enter a valid email",
      }),
    companyName: z.string().trim().max(ECARD_TEXT_SHORT_MAX_LENGTH),
    phoneCountryDialCode: z.string().trim(),
    phoneNumber: z.string().trim(),
  })
  .refine(
    (value) => (value.phoneCountryDialCode === "") === (value.phoneNumber === ""),
    { message: "Enter both the dial code and phone number", path: ["phoneNumber"] },
  )
  .refine(
    (value) =>
      value.phoneNumber === "" ||
      (ECARD_PHONE_NUMBER_DIGITS_REGEX.test(value.phoneNumber) &&
        value.phoneNumber.length >= ECARD_PHONE_NUMBER_MIN_DIGITS &&
        value.phoneNumber.length <= ECARD_PHONE_NUMBER_MAX_DIGITS),
    {
      message: `Enter ${ECARD_PHONE_NUMBER_MIN_DIGITS}-${ECARD_PHONE_NUMBER_MAX_DIGITS} digits`,
      path: ["phoneNumber"],
    },
  );

export type OrganisationEcardTemplateHeroSheetValues = z.infer<
  typeof organisationEcardTemplateHeroSheetSchema
>;
