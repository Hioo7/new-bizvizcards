import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  EventMemberRole,
  SmartCardTemplateKey,
} from '../../../generated/prisma/client';
import {
  PLAN_ECARD_LIMIT_REACHED_MESSAGE,
  PLAN_ECARD_NOT_AVAILABLE_MESSAGE,
  PLAN_EVENT_GUEST_LIMIT_REACHED_MESSAGE,
  PLAN_EVENT_LIMIT_REACHED_MESSAGE,
  PLAN_EVENT_NOT_AVAILABLE_MESSAGE,
  PLAN_EXCHANGE_CONTACT_NOT_ALLOWED_MESSAGE,
  PLAN_GALLERY_LIMIT_REACHED_MESSAGE,
  PLAN_ORGANISATION_CREATE_LIMIT_MESSAGE,
  PLAN_ORGANISATION_JOIN_LIMIT_MESSAGE,
  PLAN_ORGANISATION_NOT_AVAILABLE_MESSAGE,
  PLAN_SMART_CARD_LIMIT_REACHED_MESSAGE,
  PLAN_SMART_CARD_NOT_AVAILABLE_MESSAGE,
  PLAN_SMART_CARD_TEMPLATE_NOT_ALLOWED_MESSAGE,
} from '../plans.constants';
import { PlanPolicyResolverService } from './plan-policy-resolver.service';

export type ExchangeContactSource = 'ECARD' | 'SMART_CARD';

export interface ExistingGalleryState {
  organisationId: string | null;
  existingSubGalleryCount: number;
  existingTotalImageCount: number;
}

export interface IncomingGalleryContent {
  subGalleries: Array<{ images: unknown[] }>;
}

/**
 * Write-side assertions, called directly from other modules' services at
 * the exact point of mutation — mirrors this codebase's existing
 * assertIsSpoc/assertNotLastSpoc idiom. Every method is a no-op when
 * customerId is null (an unclaimed smart card has no plan to enforce).
 */
@Injectable()
export class PlanEnforcementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policyResolver: PlanPolicyResolverService,
  ) {}

  async assertCanCreateEcard(customerId: string): Promise<void> {
    const policy =
      await this.policyResolver.getEffectivePolicyForCustomer(customerId);
    if (!policy.ecard.isAvailable) {
      throw new ForbiddenException(PLAN_ECARD_NOT_AVAILABLE_MESSAGE);
    }

    const currentCount = await this.prisma.eCard.count({
      where: { customerId },
    });
    if (currentCount >= policy.ecard.maxEcards) {
      throw new ConflictException(PLAN_ECARD_LIMIT_REACHED_MESSAGE);
    }
  }

  /**
   * Count limits are grandfathered under EcardsService's full-replace update
   * semantics: this only blocks when the incoming count is *higher* than the
   * existing count and the existing count is already at/over the cap — an
   * existing card that's already over a newly-lowered limit is left alone.
   */
  async assertCanAddGalleryContent(
    customerId: string,
    existing: ExistingGalleryState | null,
    incoming: IncomingGalleryContent | undefined,
  ): Promise<void> {
    if (!incoming) {
      return;
    }

    const limits = await this.policyResolver
      .getEffectiveEcardPolicyForCard({
        customerId,
        organisationId: existing?.organisationId ?? null,
      })
      .then((ecardPolicy) => ecardPolicy.galleryLimits);

    const existingSubGalleryCount = existing?.existingSubGalleryCount ?? 0;
    const existingTotalImageCount = existing?.existingTotalImageCount ?? 0;
    const incomingSubGalleryCount = incoming.subGalleries.length;
    const incomingTotalImageCount = incoming.subGalleries.reduce(
      (sum, subGallery) => sum + subGallery.images.length,
      0,
    );

    if (
      incomingSubGalleryCount > existingSubGalleryCount &&
      existingSubGalleryCount >= limits.maxGalleries
    ) {
      throw new ConflictException(PLAN_GALLERY_LIMIT_REACHED_MESSAGE);
    }

    if (
      incomingTotalImageCount > existingTotalImageCount &&
      existingTotalImageCount >= limits.maxImagesPerGallery
    ) {
      throw new ConflictException(PLAN_GALLERY_LIMIT_REACHED_MESSAGE);
    }
  }

  // A hard per-file check, always live (not grandfathered) — a new upload is
  // always a "new add", unlike a retroactive count.
  async assertGalleryImageSizeAllowed(
    customerId: string,
    organisationId: string | null,
    fileSizeBytes: number,
  ): Promise<void> {
    const { galleryLimits } =
      await this.policyResolver.getEffectiveEcardPolicyForCard({
        customerId,
        organisationId,
      });
    if (fileSizeBytes > galleryLimits.maxGallerySizeBytes) {
      throw new ConflictException(PLAN_GALLERY_LIMIT_REACHED_MESSAGE);
    }
  }

  async assertCanCreateSmartCard(customerId: string | null): Promise<void> {
    if (!customerId) {
      return;
    }

    const policy = await this.policyResolver.getEffectiveSmartCardPolicy({
      customerId,
    });
    if (!policy?.isAvailable) {
      throw new ForbiddenException(PLAN_SMART_CARD_NOT_AVAILABLE_MESSAGE);
    }

    const currentCount = await this.prisma.smartCard.count({
      where: { customerId },
    });
    if (currentCount >= policy.maxSmartCards) {
      throw new ConflictException(PLAN_SMART_CARD_LIMIT_REACHED_MESSAGE);
    }
  }

  async assertSmartCardTemplateAllowed(
    customerId: string | null,
    templateKey: SmartCardTemplateKey,
  ): Promise<void> {
    if (!customerId) {
      return;
    }

    const policy = await this.policyResolver.getEffectiveSmartCardPolicy({
      customerId,
    });
    if (!policy?.whitelistedTemplateKeys.includes(templateKey)) {
      throw new ForbiddenException(
        PLAN_SMART_CARD_TEMPLATE_NOT_ALLOWED_MESSAGE,
      );
    }
  }

  async assertExchangeContactAllowed(
    source: ExchangeContactSource,
    customerId: string | null,
    organisationId: string | null = null,
  ): Promise<void> {
    if (!customerId) {
      return;
    }

    const allowed =
      source === 'ECARD'
        ? (
            await this.policyResolver.getEffectiveEcardPolicyForCard({
              customerId,
              organisationId,
            })
          ).exchangeContactAccess
        : (
            await this.policyResolver.getEffectiveSmartCardPolicy({
              customerId,
            })
          )?.exchangeContactAccess;

    if (!allowed) {
      throw new ForbiddenException(PLAN_EXCHANGE_CONTACT_NOT_ALLOWED_MESSAGE);
    }
  }

  async assertCanJoinOrganisation(customerId: string): Promise<void> {
    const policy =
      await this.policyResolver.getEffectivePolicyForCustomer(customerId);
    if (!policy.organisation.isAvailable) {
      throw new ForbiddenException(PLAN_ORGANISATION_NOT_AVAILABLE_MESSAGE);
    }

    const currentCount = await this.prisma.organisationMember.count({
      where: { customerId },
    });
    if (currentCount >= policy.organisation.maxOrgsCanJoin) {
      throw new ConflictException(PLAN_ORGANISATION_JOIN_LIMIT_MESSAGE);
    }
  }

  async assertCanCreateOrganisation(customerId: string): Promise<void> {
    const policy =
      await this.policyResolver.getEffectivePolicyForCustomer(customerId);
    if (!policy.organisation.isAvailable) {
      throw new ForbiddenException(PLAN_ORGANISATION_NOT_AVAILABLE_MESSAGE);
    }

    const currentCount = await this.prisma.organisation.count({
      where: { createdByCustomerId: customerId },
    });
    if (currentCount >= policy.organisation.maxOrgsCanCreate) {
      throw new ConflictException(PLAN_ORGANISATION_CREATE_LIMIT_MESSAGE);
    }
  }

  // Event caps always come from the HOST's own plan, never a co-host's,
  // volunteer's, or guest's — same "creator's plan governs the shared
  // resource" precedent as OrganisationPolicy.
  async assertCanCreateEvent(hostCustomerId: string): Promise<void> {
    const policy =
      await this.policyResolver.getEffectivePolicyForCustomer(hostCustomerId);
    if (!policy.event.isAvailable) {
      throw new ForbiddenException(PLAN_EVENT_NOT_AVAILABLE_MESSAGE);
    }

    const currentCount = await this.prisma.eventMember.count({
      where: { customerId: hostCustomerId, role: EventMemberRole.HOST },
    });
    if (currentCount >= policy.event.maxEvents) {
      throw new ConflictException(PLAN_EVENT_LIMIT_REACHED_MESSAGE);
    }
  }

  async assertCanAddEventGuest(eventId: string): Promise<void> {
    const hostMembership = await this.prisma.eventMember.findFirstOrThrow({
      where: { eventId, role: EventMemberRole.HOST },
      select: { customerId: true },
    });
    const policy = await this.policyResolver.getEffectivePolicyForCustomer(
      hostMembership.customerId,
    );

    const currentGuestCount = await this.prisma.eventGuest.count({
      where: { eventId },
    });
    if (currentGuestCount >= policy.event.maxGuestsPerEvent) {
      throw new ConflictException(PLAN_EVENT_GUEST_LIMIT_REACHED_MESSAGE);
    }
  }
}
