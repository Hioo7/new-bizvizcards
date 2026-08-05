import {
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  ChevronDownSquare,
  Mail,
  MapPin,
  Phone,
  SeparatorHorizontal,
  StickyNote,
  Type,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  ExchangeContactFieldTag,
  ExchangeContactFieldType,
} from "@app-types/exchangeContactForm";

export const EXCHANGE_CONTACT_FORM_NAME_MAX_LENGTH = 150;
export const EXCHANGE_CONTACT_FIELD_LABEL_MAX_LENGTH = 200;
export const EXCHANGE_CONTACT_FIELD_HELP_TEXT_MAX_LENGTH = 300;
export const EXCHANGE_CONTACT_FIELD_OPTION_LABEL_MAX_LENGTH = 150;
export const EXCHANGE_CONTACT_FORM_MAX_FIELDS = 30;
export const EXCHANGE_CONTACT_FIELD_MIN_OPTIONS = 2;
export const EXCHANGE_CONTACT_FIELD_MAX_OPTIONS = 20;

interface CoreFieldCatalogEntry {
  tag: ExchangeContactFieldTag;
  type: ExchangeContactFieldType;
  label: string;
  icon: LucideIcon;
  description: string;
}

// Every form must include exactly one LEAD_NAME field (enforced both here —
// it's always pre-added and non-removable in the builder — and server-side).
// Kept first in this list so it's always the top row of the "Core fields"
// picker section, even though the picker never actually offers it (it's
// already on the form from the moment a new form is created).
export const CORE_FIELD_CATALOG: CoreFieldCatalogEntry[] = [
  {
    tag: "LEAD_NAME",
    type: "SHORT_TEXT",
    label: "Name",
    icon: User,
    description: "The visitor's name — every form must include this.",
  },
  {
    tag: "LEAD_PHONE",
    type: "PHONE",
    label: "Phone Number",
    icon: Phone,
    description: "Country code + phone number.",
  },
  {
    tag: "LEAD_EMAIL",
    type: "EMAIL",
    label: "Email",
    icon: Mail,
    description: "A format-validated email address.",
  },
  {
    tag: "LEAD_NOTE",
    type: "LONG_TEXT",
    label: "Note",
    icon: StickyNote,
    description: "A free-text note, e.g. what they're interested in.",
  },
  {
    tag: "LEAD_LOCATION",
    type: "LOCATION",
    label: "Location",
    icon: MapPin,
    description: "Captured from the visitor's browser, not typed.",
  },
  {
    tag: "LEAD_COMPANY",
    type: "SHORT_TEXT",
    label: "Company",
    icon: Building2,
    description: "The visitor's company name.",
  },
  {
    tag: "LEAD_PROFESSION",
    type: "SHORT_TEXT",
    label: "Profession",
    icon: Briefcase,
    description: "The visitor's job title or profession.",
  },
];

export type CustomQuestionFieldType =
  | "SHORT_TEXT"
  | "MULTIPLE_CHOICE"
  | "DROPDOWN"
  | "DATE"
  | "BREAK";

interface CustomQuestionCatalogEntry {
  type: CustomQuestionFieldType;
  label: string;
  icon: LucideIcon;
  description: string;
}

// Custom questions have no core tag — their answers are captured separately
// from the Lead record (see backend ExchangeContactFormSubmissionAnswer).
// Unlike core fields, any number of these may be added.
export const CUSTOM_QUESTION_CATALOG: CustomQuestionCatalogEntry[] = [
  {
    type: "SHORT_TEXT",
    label: "Short answer",
    icon: Type,
    description: "A single-line free-text answer.",
  },
  {
    type: "MULTIPLE_CHOICE",
    label: "Multiple choice",
    icon: CheckSquare,
    description: "Pick one from a set of options.",
  },
  {
    type: "DROPDOWN",
    label: "Dropdown",
    icon: ChevronDownSquare,
    description: "Pick one from a dropdown list.",
  },
  {
    type: "DATE",
    label: "Date",
    icon: Calendar,
    description: "A date answer.",
  },
  {
    type: "BREAK",
    label: "Break",
    icon: SeparatorHorizontal,
    description:
      "Splits the form here — visitors tap Continue to move to the next stage.",
  },
];

export const FIELD_TYPE_LABEL: Record<ExchangeContactFieldType, string> = {
  SHORT_TEXT: "Short answer",
  LONG_TEXT: "Long answer",
  PHONE: "Phone number",
  EMAIL: "Email",
  LOCATION: "Location",
  MULTIPLE_CHOICE: "Multiple choice",
  DROPDOWN: "Dropdown",
  DATE: "Date",
  BREAK: "Break",
};

export const FIELD_TYPE_ICON: Record<ExchangeContactFieldType, LucideIcon> = {
  SHORT_TEXT: Type,
  LONG_TEXT: StickyNote,
  PHONE: Phone,
  EMAIL: Mail,
  LOCATION: MapPin,
  MULTIPLE_CHOICE: CheckSquare,
  DROPDOWN: ChevronDownSquare,
  DATE: Calendar,
  BREAK: SeparatorHorizontal,
};

// A plain record (not a function) so callers can look up a field's icon via
// indexing — e.g. `CORE_TAG_ICON[draft.tag] ?? FIELD_TYPE_ICON[draft.type]` —
// which the React Compiler's lint rules recognize as a safe component
// reference, unlike a lookup wrapped in a function call.
export const CORE_TAG_ICON: Partial<Record<ExchangeContactFieldTag, LucideIcon>> =
  Object.fromEntries(CORE_FIELD_CATALOG.map((entry) => [entry.tag, entry.icon]));
