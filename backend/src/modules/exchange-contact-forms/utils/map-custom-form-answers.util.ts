import { BadRequestException } from '@nestjs/common';
import type {
  ExchangeContactFieldTag,
  ExchangeContactFieldType,
} from '../../../generated/prisma/client';
import type { ExchangeContactFormAnswerDto } from '../dto/submit-custom-form-exchange-contact.dto';
import {
  EXCHANGE_CONTACT_FORM_SUBMISSION_DUPLICATE_ANSWER_MESSAGE,
  EXCHANGE_CONTACT_FORM_SUBMISSION_INVALID_OPTION_MESSAGE,
  EXCHANGE_CONTACT_FORM_SUBMISSION_MISSING_REQUIRED_MESSAGE,
  EXCHANGE_CONTACT_FORM_SUBMISSION_TYPE_MISMATCH_MESSAGE,
  EXCHANGE_CONTACT_FORM_SUBMISSION_UNKNOWN_FIELD_MESSAGE,
} from '../exchange-contact-forms.constants';

export interface ResolvedFormFieldForMapping {
  id: string;
  type: ExchangeContactFieldType;
  tag: ExchangeContactFieldTag | null;
  isRequired: boolean;
  options: { id: string }[];
}

export interface MappedLeadFields {
  name?: string;
  email?: string;
  countryDialCode?: string;
  phoneNumber?: string;
  note?: string;
  company?: string;
  profession?: string;
  locationLatitude?: number;
  locationLongitude?: number;
}

export type MappedCustomAnswer =
  | { fieldId: string; kind: 'TEXT'; value: string }
  | { fieldId: string; kind: 'CHOICE'; selectedOptionId: string }
  | { fieldId: string; kind: 'DATE'; value: Date };

export interface MappedCustomFormAnswers {
  leadFields: MappedLeadFields;
  customAnswers: MappedCustomAnswer[];
}

/**
 * Pure function: cross-checks a public submission's answers against the
 * exact field list of the form version they were submitted against, and
 * splits the result into tag-mapped Lead columns vs. untagged custom
 * answers. Never trusts anything about the submission beyond that it was
 * already Zod-shape-validated — every cross-field invariant (unknown field,
 * duplicate answer, missing-required, type mismatch, invalid option) is
 * re-checked here against the server-resolved field list, never the
 * client's own claims.
 */
export function mapCustomFormAnswersToLeadFields(
  fields: ResolvedFormFieldForMapping[],
  answers: ExchangeContactFormAnswerDto[],
): MappedCustomFormAnswers {
  const fieldById = new Map(fields.map((field) => [field.id, field]));
  const answerByFieldId = new Map<string, ExchangeContactFormAnswerDto>();
  for (const answer of answers) {
    if (!fieldById.has(answer.fieldId)) {
      throw new BadRequestException(
        EXCHANGE_CONTACT_FORM_SUBMISSION_UNKNOWN_FIELD_MESSAGE,
      );
    }
    if (answerByFieldId.has(answer.fieldId)) {
      throw new BadRequestException(
        EXCHANGE_CONTACT_FORM_SUBMISSION_DUPLICATE_ANSWER_MESSAGE,
      );
    }
    answerByFieldId.set(answer.fieldId, answer);
  }

  const leadFields: MappedLeadFields = {};
  const customAnswers: MappedCustomAnswer[] = [];

  for (const field of fields) {
    const answer = answerByFieldId.get(field.id);
    if (!answer) {
      if (field.isRequired) {
        throw new BadRequestException(
          EXCHANGE_CONTACT_FORM_SUBMISSION_MISSING_REQUIRED_MESSAGE,
        );
      }
      continue;
    }
    if (answer.type !== field.type) {
      throw new BadRequestException(
        EXCHANGE_CONTACT_FORM_SUBMISSION_TYPE_MISMATCH_MESSAGE,
      );
    }

    if (field.tag) {
      applyTaggedAnswer(leadFields, field.tag, answer);
    } else {
      customAnswers.push(toCustomAnswer(field, answer));
    }
  }

  return { leadFields, customAnswers };
}

function applyTaggedAnswer(
  leadFields: MappedLeadFields,
  tag: ExchangeContactFieldTag,
  answer: ExchangeContactFormAnswerDto,
): void {
  switch (answer.type) {
    case 'SHORT_TEXT':
      if (tag === 'LEAD_NAME') {
        leadFields.name = answer.value;
      } else if (tag === 'LEAD_COMPANY') {
        leadFields.company = answer.value;
      } else if (tag === 'LEAD_PROFESSION') {
        leadFields.profession = answer.value;
      }
      return;
    case 'LONG_TEXT':
      leadFields.note = answer.value;
      return;
    case 'EMAIL':
      leadFields.email = answer.value;
      return;
    case 'PHONE':
      leadFields.countryDialCode = answer.countryDialCode;
      leadFields.phoneNumber = answer.phoneNumber;
      return;
    case 'LOCATION':
      leadFields.locationLatitude = answer.latitude;
      leadFields.locationLongitude = answer.longitude;
      return;
    case 'MULTIPLE_CHOICE':
    case 'DROPDOWN':
    case 'DATE':
      // No tag exists for these types per the field schema's own
      // type/tag compatibility rules (enforced at form-save time) —
      // unreachable in practice, but exhaustively handled for type safety.
      return;
  }
}

function toCustomAnswer(
  field: ResolvedFormFieldForMapping,
  answer: ExchangeContactFormAnswerDto,
): MappedCustomAnswer {
  switch (answer.type) {
    case 'SHORT_TEXT':
    case 'LONG_TEXT':
      return { fieldId: field.id, kind: 'TEXT', value: answer.value };
    case 'MULTIPLE_CHOICE':
    case 'DROPDOWN': {
      const isValidOption = field.options.some(
        (option) => option.id === answer.optionId,
      );
      if (!isValidOption) {
        throw new BadRequestException(
          EXCHANGE_CONTACT_FORM_SUBMISSION_INVALID_OPTION_MESSAGE,
        );
      }
      return {
        fieldId: field.id,
        kind: 'CHOICE',
        selectedOptionId: answer.optionId,
      };
    }
    case 'DATE':
      return { fieldId: field.id, kind: 'DATE', value: answer.value };
    case 'EMAIL':
    case 'PHONE':
    case 'LOCATION':
      // These types are always core-tagged (no untagged variant exists per
      // the field schema), so they're always routed through
      // applyTaggedAnswer instead — unreachable in practice.
      throw new BadRequestException(
        EXCHANGE_CONTACT_FORM_SUBMISSION_TYPE_MISMATCH_MESSAGE,
      );
  }
}
