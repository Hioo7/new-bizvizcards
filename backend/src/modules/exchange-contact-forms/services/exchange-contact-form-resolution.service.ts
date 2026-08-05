import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ExchangeContactFieldTag,
  ExchangeContactFieldType,
  Prisma,
} from '../../../generated/prisma/client';
import { PlanPolicyResolverService } from '../../plans/services/plan-policy-resolver.service';

const CURRENT_VERSION_INCLUDE = {
  versions: {
    where: { isCurrent: true },
    include: {
      fields: {
        orderBy: { order: 'asc' as const },
        include: { options: { orderBy: { order: 'asc' as const } } },
      },
    },
  },
} satisfies Prisma.ExchangeContactFormInclude;

type FormWithCurrentVersion = NonNullable<
  Awaited<
    ReturnType<ExchangeContactFormResolutionService['findByOrganisationId']>
  >
>;

export interface PublicExchangeContactFormFieldOption {
  id: string;
  label: string;
}

export interface PublicExchangeContactFormField {
  id: string;
  order: number;
  type: ExchangeContactFieldType;
  tag: ExchangeContactFieldTag | null;
  label: string;
  helpText: string | null;
  isRequired: boolean;
  options: PublicExchangeContactFormFieldOption[];
}

export interface PublicExchangeContactForm {
  id: string;
  versionId: string;
  fields: PublicExchangeContactFormField[];
}

export interface ResolvableCard {
  customerId: string;
  organisationId: string | null;
  customFormId: string | null;
}

/**
 * Read-only precedence resolution of "which exchange-contact form (if any)
 * should render for this e-card right now" — never mutates anything, mirrors
 * organisation-ecard-template-merge.util.ts's "read-time only" convention.
 * Precedence: (1) the card's organisation has its own template AND the
 * organisation's own policy allows it (fail-closed on an unresolvable
 * creator — this is the template's own hard gate, not a boost); (2) else the
 * card's own linked form, gated by the card's effective (already org-boosted)
 * policy, degrading permissively to (3) if denied; (3) null — the caller
 * renders the legacy fixed exchange-contact form.
 */
@Injectable()
export class ExchangeContactFormResolutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policyResolver: PlanPolicyResolverService,
  ) {}

  async resolveForCard(
    card: ResolvableCard,
  ): Promise<PublicExchangeContactForm | null> {
    if (card.organisationId) {
      const template = await this.findByOrganisationId(card.organisationId);
      if (
        template &&
        (await this.isOrganisationTemplateAllowed(card.organisationId))
      ) {
        return this.toPublicForm(template);
      }
    }

    if (card.customFormId) {
      const policy = await this.policyResolver.getEffectiveEcardPolicyForCard({
        customerId: card.customerId,
        organisationId: card.organisationId,
      });
      if (policy.isCustomFormAvailable) {
        const form = await this.findById(card.customFormId);
        if (form) {
          return this.toPublicForm(form);
        }
      }
    }

    return null;
  }

  private async isOrganisationTemplateAllowed(
    organisationId: string,
  ): Promise<boolean> {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { createdByCustomerId: true },
    });
    if (!organisation?.createdByCustomerId) {
      return false;
    }
    const policy = await this.policyResolver.getEffectivePolicyForCustomer(
      organisation.createdByCustomerId,
    );
    return policy.organisation.orgEcardPolicy.isCustomFormAvailable;
  }

  private findByOrganisationId(organisationId: string) {
    return this.prisma.exchangeContactForm.findUnique({
      where: { organisationId },
      include: CURRENT_VERSION_INCLUDE,
    });
  }

  private findById(formId: string) {
    return this.prisma.exchangeContactForm.findUnique({
      where: { id: formId },
      include: CURRENT_VERSION_INCLUDE,
    });
  }

  private toPublicForm(
    form: FormWithCurrentVersion,
  ): PublicExchangeContactForm | null {
    const currentVersion = form.versions[0];
    if (!currentVersion) {
      return null;
    }
    return {
      id: form.id,
      versionId: currentVersion.id,
      fields: currentVersion.fields.map((field) => ({
        id: field.id,
        order: field.order,
        type: field.type,
        tag: field.tag,
        label: field.label,
        helpText: field.helpText,
        isRequired: field.isRequired,
        options: field.options.map((option) => ({
          id: option.id,
          label: option.label,
        })),
      })),
    };
  }
}
