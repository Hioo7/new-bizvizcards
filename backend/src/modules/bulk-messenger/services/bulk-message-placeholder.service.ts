import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ExchangeContactFieldType,
  Prisma,
} from '../../../generated/prisma/client';
import {
  BULK_MESSAGE_CORE_PLACEHOLDERS,
  BULK_MESSAGE_FORM_PLACEHOLDER_PREFIX,
  BULK_MESSAGE_TEMPLATE_LINKED_FORM_NOT_FOUND_MESSAGE,
} from '../bulk-messenger.constants';
import { resolveFormFieldSlugs } from '../utils/slugify-placeholder-label.util';

export interface PlaceholderOption {
  token: string;
  label: string;
}

export interface FormPlaceholderOption extends PlaceholderOption {
  fieldType: ExchangeContactFieldType;
}

export interface AvailablePlaceholders {
  core: PlaceholderOption[];
  formFields: FormPlaceholderOption[];
}

export interface UntaggedFormField {
  label: string;
  type: ExchangeContactFieldType;
}

// A form's current-version fields that a Lead's answer is captured against
// outside its own columns — i.e. untagged, real questions (BREAK is a layout
// marker, tagged fields route to Lead columns already covered by core tokens).
const CURRENT_VERSION_FIELDS_INCLUDE = {
  versions: {
    where: { isCurrent: true },
    include: { fields: { orderBy: { order: 'asc' as const } } },
  },
} satisfies Prisma.ExchangeContactFormInclude;

@Injectable()
export class BulkMessagePlaceholderService {
  constructor(private readonly prisma: PrismaService) {}

  // The untagged current-version fields of a form the given customer owns.
  // Throws 404 (not 403) if the form does not exist or belongs to someone
  // else, so a foreign form's existence isn't leaked. Returns [] when
  // formId is null.
  async getOwnedFormUntaggedFields(
    customerId: string,
    formId: string | null,
  ): Promise<UntaggedFormField[]> {
    if (!formId) {
      return [];
    }
    const form = await this.prisma.exchangeContactForm.findUnique({
      where: { id: formId },
      include: CURRENT_VERSION_FIELDS_INCLUDE,
    });
    if (!form || form.customerId !== customerId) {
      throw new NotFoundException(
        BULK_MESSAGE_TEMPLATE_LINKED_FORM_NOT_FOUND_MESSAGE,
      );
    }
    const currentVersion = form.versions[0];
    if (!currentVersion) {
      return [];
    }
    return currentVersion.fields
      .filter(
        (field) =>
          field.tag === null && field.type !== ExchangeContactFieldType.BREAK,
      )
      .map((field) => ({ label: field.label, type: field.type }));
  }

  // Pure. Builds `{field.<slug>}` placeholder options for a list of untagged
  // fields, disambiguating any label collisions deterministically.
  buildFormPlaceholders(
    fields: readonly UntaggedFormField[],
  ): FormPlaceholderOption[] {
    const slugs = resolveFormFieldSlugs(fields.map((field) => field.label));
    return fields.map((field, index) => ({
      token: `${BULK_MESSAGE_FORM_PLACEHOLDER_PREFIX}${slugs[index]}`,
      label: field.label,
      fieldType: field.type,
    }));
  }

  // Pure. label -> slug map (first occurrence wins on collision) for resolving
  // a submission's answers to placeholder slugs at send time.
  buildSlugByLabel(fields: readonly UntaggedFormField[]): Map<string, string> {
    const slugs = resolveFormFieldSlugs(fields.map((field) => field.label));
    const map = new Map<string, string>();
    fields.forEach((field, index) => {
      if (!map.has(field.label)) {
        map.set(field.label, slugs[index]);
      }
    });
    return map;
  }

  private corePlaceholders(): PlaceholderOption[] {
    return BULK_MESSAGE_CORE_PLACEHOLDERS.map((placeholder) => ({
      token: placeholder.token,
      label: placeholder.label,
    }));
  }

  async getAvailablePlaceholders(
    customerId: string,
    formId: string | null,
  ): Promise<AvailablePlaceholders> {
    const fields = await this.getOwnedFormUntaggedFields(customerId, formId);
    return {
      core: this.corePlaceholders(),
      formFields: this.buildFormPlaceholders(fields),
    };
  }

  // The full set of tokens (lowercase, `field.` prefix included) a template
  // body may reference given its linked form — used to validate a body on
  // write.
  async getAvailableTokenSet(
    customerId: string,
    formId: string | null,
  ): Promise<Set<string>> {
    const { core, formFields } = await this.getAvailablePlaceholders(
      customerId,
      formId,
    );
    return new Set(
      [...core, ...formFields].map((option) => option.token.toLowerCase()),
    );
  }
}
