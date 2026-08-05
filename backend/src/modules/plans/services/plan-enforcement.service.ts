import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ECardHeroLayout,
  ECardIconShape,
  ECardTheme,
  EventMemberRole,
  SmartCardTemplateKey,
} from '../../../generated/prisma/client';
import {
  PLAN_ACCENT_COLOR_CUSTOMIZATION_NOT_ALLOWED_MESSAGE,
  PLAN_CUSTOM_FORM_LIMIT_REACHED_MESSAGE,
  PLAN_CUSTOM_FORM_NOT_AVAILABLE_MESSAGE,
  PLAN_ECARD_LIMIT_REACHED_MESSAGE,
  PLAN_ECARD_NOT_AVAILABLE_MESSAGE,
  PLAN_EVENT_GUEST_LIMIT_REACHED_MESSAGE,
  PLAN_EVENT_LIMIT_REACHED_MESSAGE,
  PLAN_EVENT_NOT_AVAILABLE_MESSAGE,
  PLAN_EXCHANGE_CONTACT_NOT_ALLOWED_MESSAGE,
  PLAN_GALLERY_LIMIT_REACHED_MESSAGE,
  PLAN_HERO_LAYOUT_NOT_AVAILABLE_MESSAGE,
  PLAN_ICON_SHAPE_NOT_AVAILABLE_MESSAGE,
  PLAN_ORGANISATION_CREATE_LIMIT_MESSAGE,
  PLAN_ORGANISATION_JOIN_LIMIT_MESSAGE,
  PLAN_ORGANISATION_NOT_AVAILABLE_MESSAGE,
  PLAN_SMART_CARD_LIMIT_REACHED_MESSAGE,
  PLAN_SMART_CARD_NOT_AVAILABLE_MESSAGE,
  PLAN_SMART_CARD_TEMPLATE_NOT_ALLOWED_MESSAGE,
  PLAN_THEME_NOT_AVAILABLE_MESSAGE,
  PLAN_VIDEO_GALLERY_LIMIT_REACHED_MESSAGE,
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

export interface ExistingVideoGalleryState {
  organisationId: string | null;
  existingVideoSubGalleryCount: number;
  existingTotalVideoCount: number;
}

export interface IncomingVideoGalleryContent {
  subGalleries: Array<{ videos: unknown[] }>;
}

export interface AccentColorPair {
  primary: string | null;
  secondary: string | null;
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

  async assertCanAddVideoGalleryContent(
    customerId: string,
    existing: ExistingVideoGalleryState | null,
    incoming: IncomingVideoGalleryContent | undefined,
  ): Promise<void> {
    if (!incoming) {
      return;
    }

    const limits = await this.policyResolver
      .getEffectiveEcardPolicyForCard({
        customerId,
        organisationId: existing?.organisationId ?? null,
      })
      .then((ecardPolicy) => ecardPolicy.videoGalleryLimits);

    const existingVideoSubGalleryCount =
      existing?.existingVideoSubGalleryCount ?? 0;
    const existingTotalVideoCount = existing?.existingTotalVideoCount ?? 0;
    const incomingVideoSubGalleryCount = incoming.subGalleries.length;
    const incomingTotalVideoCount = incoming.subGalleries.reduce(
      (sum, subGallery) => sum + subGallery.videos.length,
      0,
    );

    if (
      incomingVideoSubGalleryCount > existingVideoSubGalleryCount &&
      existingVideoSubGalleryCount >= limits.maxVideoGalleries
    ) {
      throw new ConflictException(PLAN_VIDEO_GALLERY_LIMIT_REACHED_MESSAGE);
    }

    if (
      incomingTotalVideoCount > existingTotalVideoCount &&
      existingTotalVideoCount >= limits.maxVideosPerGallery
    ) {
      throw new ConflictException(PLAN_VIDEO_GALLERY_LIMIT_REACHED_MESSAGE);
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

  async assertHeroLayoutAllowedForCard(
    card: { customerId: string; organisationId: string | null },
    layout: ECardHeroLayout,
  ): Promise<void> {
    if (layout === ECardHeroLayout.DEFAULT) {
      return;
    }
    const policy =
      await this.policyResolver.getEffectiveEcardPolicyForCard(card);
    if (!policy.heroLayouts[layout]) {
      throw new ForbiddenException(PLAN_HERO_LAYOUT_NOT_AVAILABLE_MESSAGE);
    }
  }

  // The org template belongs to the organisation itself, not to any one
  // customer — so this checks the org's own orgEcardPolicy directly (via its
  // creator's plan), never merged with a personal policy the way a linked
  // card's boost is. Fails closed (unlike getEffectiveEcardPolicyForCard's
  // "degrade to no-op" precedent for an unresolvable creator) since this is
  // the template's own hard gate, not a permissive boost on top of something
  // else.
  async assertHeroLayoutAllowedForOrganisationTemplate(
    organisationId: string,
    layout: ECardHeroLayout,
  ): Promise<void> {
    if (layout === ECardHeroLayout.DEFAULT) {
      return;
    }
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { createdByCustomerId: true },
    });
    if (!organisation?.createdByCustomerId) {
      throw new ForbiddenException(PLAN_HERO_LAYOUT_NOT_AVAILABLE_MESSAGE);
    }
    const policy = await this.policyResolver.getEffectivePolicyForCustomer(
      organisation.createdByCustomerId,
    );
    if (!policy.organisation.orgEcardPolicy.heroLayouts[layout]) {
      throw new ForbiddenException(PLAN_HERO_LAYOUT_NOT_AVAILABLE_MESSAGE);
    }
  }

  async assertThemeAllowedForCard(
    card: { customerId: string; organisationId: string | null },
    theme: ECardTheme,
  ): Promise<void> {
    if (theme === ECardTheme.DEFAULT_DARK) {
      return;
    }
    const policy =
      await this.policyResolver.getEffectiveEcardPolicyForCard(card);
    if (!policy.themes[theme]) {
      throw new ForbiddenException(PLAN_THEME_NOT_AVAILABLE_MESSAGE);
    }
  }

  // Same fail-closed-on-unresolvable-creator reasoning as
  // assertHeroLayoutAllowedForOrganisationTemplate above.
  async assertThemeAllowedForOrganisationTemplate(
    organisationId: string,
    theme: ECardTheme,
  ): Promise<void> {
    if (theme === ECardTheme.DEFAULT_DARK) {
      return;
    }
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { createdByCustomerId: true },
    });
    if (!organisation?.createdByCustomerId) {
      throw new ForbiddenException(PLAN_THEME_NOT_AVAILABLE_MESSAGE);
    }
    const policy = await this.policyResolver.getEffectivePolicyForCustomer(
      organisation.createdByCustomerId,
    );
    if (!policy.organisation.orgEcardPolicy.themes[theme]) {
      throw new ForbiddenException(PLAN_THEME_NOT_AVAILABLE_MESSAGE);
    }
  }

  async assertIconShapeAllowedForCard(
    card: { customerId: string; organisationId: string | null },
    iconShape: ECardIconShape,
  ): Promise<void> {
    if (iconShape === ECardIconShape.CIRCLE) {
      return;
    }
    const policy =
      await this.policyResolver.getEffectiveEcardPolicyForCard(card);
    if (!policy.iconShapes[iconShape]) {
      throw new ForbiddenException(PLAN_ICON_SHAPE_NOT_AVAILABLE_MESSAGE);
    }
  }

  async assertIconShapeAllowedForOrganisationTemplate(
    organisationId: string,
    iconShape: ECardIconShape,
  ): Promise<void> {
    if (iconShape === ECardIconShape.CIRCLE) {
      return;
    }
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { createdByCustomerId: true },
    });
    if (!organisation?.createdByCustomerId) {
      throw new ForbiddenException(PLAN_ICON_SHAPE_NOT_AVAILABLE_MESSAGE);
    }
    const policy = await this.policyResolver.getEffectivePolicyForCustomer(
      organisation.createdByCustomerId,
    );
    if (!policy.organisation.orgEcardPolicy.iconShapes[iconShape]) {
      throw new ForbiddenException(PLAN_ICON_SHAPE_NOT_AVAILABLE_MESSAGE);
    }
  }

  // Picking one of the policy's own offered presets never requires full
  // custom-color access — only an arbitrary (non-preset) pair does. An
  // exact-pair match is required: setting only one of the two colors (which
  // can't fully match any preset pair) always falls through to the
  // accentColorCustomizationAvailable check, so a customer can't use a
  // partial preset match to bypass the toggle.
  async assertAccentColorCustomizationAllowedForCard(
    card: { customerId: string; organisationId: string | null },
    accents: AccentColorPair,
  ): Promise<void> {
    if (!accents.primary && !accents.secondary) {
      return;
    }
    const policy =
      await this.policyResolver.getEffectiveEcardPolicyForCard(card);
    const matchesPreset = policy.accentColorPresets.some(
      (preset) =>
        preset.primaryColor === accents.primary &&
        preset.secondaryColor === accents.secondary,
    );
    if (matchesPreset) {
      return;
    }
    if (!policy.accentColorCustomizationAvailable) {
      throw new ForbiddenException(
        PLAN_ACCENT_COLOR_CUSTOMIZATION_NOT_ALLOWED_MESSAGE,
      );
    }
  }

  async assertAccentColorCustomizationAllowedForOrganisationTemplate(
    organisationId: string,
    accents: AccentColorPair,
  ): Promise<void> {
    if (!accents.primary && !accents.secondary) {
      return;
    }
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { createdByCustomerId: true },
    });
    if (!organisation?.createdByCustomerId) {
      throw new ForbiddenException(
        PLAN_ACCENT_COLOR_CUSTOMIZATION_NOT_ALLOWED_MESSAGE,
      );
    }
    const policy = await this.policyResolver.getEffectivePolicyForCustomer(
      organisation.createdByCustomerId,
    );
    const orgEcardPolicy = policy.organisation.orgEcardPolicy;
    const matchesPreset = orgEcardPolicy.accentColorPresets.some(
      (preset) =>
        preset.primaryColor === accents.primary &&
        preset.secondaryColor === accents.secondary,
    );
    if (matchesPreset) {
      return;
    }
    if (!orgEcardPolicy.accentColorCustomizationAvailable) {
      throw new ForbiddenException(
        PLAN_ACCENT_COLOR_CUSTOMIZATION_NOT_ALLOWED_MESSAGE,
      );
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

  async assertCanCreateCustomForm(customerId: string): Promise<void> {
    const policy =
      await this.policyResolver.getEffectivePolicyForCustomer(customerId);
    if (!policy.ecard.isCustomFormAvailable) {
      throw new ForbiddenException(PLAN_CUSTOM_FORM_NOT_AVAILABLE_MESSAGE);
    }

    const currentCount = await this.prisma.exchangeContactForm.count({
      where: { customerId },
    });
    if (currentCount >= policy.ecard.maxCustomForms) {
      throw new ConflictException(PLAN_CUSTOM_FORM_LIMIT_REACHED_MESSAGE);
    }
  }

  // Checked at the point a form is linked to an e-card. Read-side rendering
  // (ExchangeContactFormResolutionService) makes its own equivalent check
  // but degrades silently to the legacy form instead of throwing, per its
  // own "plan access revoked later" fallback behavior — this assertion is
  // only for the write-side link action.
  async assertCustomFormAccessAllowedForCard(card: {
    customerId: string;
    organisationId: string | null;
  }): Promise<void> {
    const policy =
      await this.policyResolver.getEffectiveEcardPolicyForCard(card);
    if (!policy.isCustomFormAvailable) {
      throw new ForbiddenException(PLAN_CUSTOM_FORM_NOT_AVAILABLE_MESSAGE);
    }
  }

  // Same fail-closed-on-unresolvable-creator reasoning as
  // assertHeroLayoutAllowedForOrganisationTemplate above — the org
  // template's own hard gate, not a permissive boost on top of something
  // else.
  async assertCustomFormAccessAllowedForOrganisationTemplate(
    organisationId: string,
  ): Promise<void> {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { createdByCustomerId: true },
    });
    if (!organisation?.createdByCustomerId) {
      throw new ForbiddenException(PLAN_CUSTOM_FORM_NOT_AVAILABLE_MESSAGE);
    }
    const policy = await this.policyResolver.getEffectivePolicyForCustomer(
      organisation.createdByCustomerId,
    );
    if (!policy.organisation.orgEcardPolicy.isCustomFormAvailable) {
      throw new ForbiddenException(PLAN_CUSTOM_FORM_NOT_AVAILABLE_MESSAGE);
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
