import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ECardAccentColorPresetThemeAffinity,
  ECardComponentType,
  ECardHeroLayout,
  ECardIconShape,
  ECardTheme,
  Prisma,
  SmartCardTemplateKey,
} from '../../../generated/prisma/client';
import {
  ECARD_GATED_HERO_LAYOUTS,
  ECARD_GATED_ICON_SHAPES,
  ECARD_GATED_THEMES,
} from '../../ecards/ecards.constants';
import { PLAN_FALLBACK_PLAN_MISSING_MESSAGE } from '../plans.constants';

export interface EffectiveGalleryLimits {
  maxGalleries: number;
  maxImagesPerGallery: number;
  maxGallerySizeBytes: number;
}

export interface EffectiveVideoGalleryLimits {
  maxVideoGalleries: number;
  maxVideosPerGallery: number;
}

export interface EffectiveAccentColorPreset {
  themeAffinity: ECardAccentColorPresetThemeAffinity;
  primaryColor: string;
  secondaryColor: string;
}

export interface EffectiveEcardPolicy {
  isAvailable: boolean;
  maxEcards: number;
  exchangeContactAccess: boolean;
  // Gates the customizable exchange-contact form feature — OR-boosted same
  // as exchangeContactAccess.
  isCustomFormAvailable: boolean;
  // Personal-only cap, never boosted — same treatment as maxEcards.
  maxCustomForms: number;
  components: Record<ECardComponentType, boolean>;
  galleryLimits: EffectiveGalleryLimits;
  videoGalleryLimits: EffectiveVideoGalleryLimits;
  // Only the plan-restrictable layouts are ever false-by-default here —
  // DEFAULT is unconditionally forced to true in mapEcardPolicy below.
  heroLayouts: Record<ECardHeroLayout, boolean>;
  // Same convention — DEFAULT_DARK/CIRCLE are unconditionally forced to true.
  themes: Record<ECardTheme, boolean>;
  iconShapes: Record<ECardIconShape, boolean>;
  // Full free-hex custom accent-color entry — independent of
  // accentColorPresets below, which are available regardless of this flag.
  accentColorCustomizationAvailable: boolean;
  accentColorPresets: EffectiveAccentColorPreset[];
}

export interface EffectiveSmartCardPolicy {
  isAvailable: boolean;
  maxSmartCards: number;
  exchangeContactAccess: boolean;
  whitelistedTemplateKeys: SmartCardTemplateKey[];
}

export interface EffectiveOrganisationPolicy {
  isAvailable: boolean;
  maxOrgsCanJoin: number;
  maxOrgsCanCreate: number;
  // The organisation's own shared bundles — not derived from any member's
  // personal plan. This is what boosts a linked e-card.
  orgEcardPolicy: EffectiveEcardPolicy;
  orgSmartCardPolicy: EffectiveSmartCardPolicy;
}

export interface EffectiveEventPolicy {
  isAvailable: boolean;
  maxEvents: number;
  maxGuestsPerEvent: number;
}

export interface EffectiveEmailSignaturePolicy {
  isAvailable: boolean;
  maxEmailSignatures: number;
}

export interface EffectiveVirtualBackgroundTemplate {
  id: string;
  name: string;
}

export interface EffectiveVirtualBackgroundPolicy {
  isAvailable: boolean;
  maxVirtualBackgrounds: number;
  allowCustomBackground: boolean;
  availableTemplates: EffectiveVirtualBackgroundTemplate[];
}

export interface EffectiveBulkMessengerPolicy {
  isAvailable: boolean;
  maxTemplates: number;
}

export interface EffectivePolicy {
  planId: string;
  isFallback: boolean;
  ecard: EffectiveEcardPolicy;
  smartCard: EffectiveSmartCardPolicy;
  organisation: EffectiveOrganisationPolicy;
  event: EffectiveEventPolicy;
  emailSignature: EffectiveEmailSignaturePolicy;
  virtualBackground: EffectiveVirtualBackgroundPolicy;
  bulkMessenger: EffectiveBulkMessengerPolicy;
}

// Exported for reuse by PlansService, which needs the identical nested
// shape to round-trip a plan's policy tree back out as a DTO.
export const ecardPolicyInclude = {
  componentAvailabilities: {
    include: { galleryLimits: true, videoGalleryLimits: true },
  },
  heroLayoutAvailabilities: true,
  themeAvailabilities: true,
  iconShapeAvailabilities: true,
  accentColorPresets: { orderBy: { order: 'asc' } },
} satisfies Prisma.EcardPolicyInclude;

export type EcardPolicyWithRelations = Prisma.EcardPolicyGetPayload<{
  include: typeof ecardPolicyInclude;
}>;

export const smartCardPolicyInclude = {
  whitelistedTemplates: { include: { template: true } },
} satisfies Prisma.SmartCardPolicyInclude;

export type SmartCardPolicyWithRelations = Prisma.SmartCardPolicyGetPayload<{
  include: typeof smartCardPolicyInclude;
}>;

export const virtualBackgroundPolicyInclude = {
  whitelistedTemplates: { include: { template: true } },
} satisfies Prisma.VirtualBackgroundPolicyInclude;

export type VirtualBackgroundPolicyWithRelations =
  Prisma.VirtualBackgroundPolicyGetPayload<{
    include: typeof virtualBackgroundPolicyInclude;
  }>;

export const planPolicyInclude = {
  ecardPolicy: { include: ecardPolicyInclude },
  smartCardPolicy: { include: smartCardPolicyInclude },
  organisationPolicy: {
    include: {
      orgEcardPolicy: { include: ecardPolicyInclude },
      orgSmartCardPolicy: { include: smartCardPolicyInclude },
    },
  },
  eventPolicy: true,
  emailSignaturePolicy: true,
  virtualBackgroundPolicy: { include: virtualBackgroundPolicyInclude },
  bulkMessengerPolicy: true,
} satisfies Prisma.PlanPolicyInclude;

/**
 * Read-side resolution of "what can this customer actually do right now".
 * Never mutates anything — pure resolution of the effective policy from a
 * customer's current plan (or the system fallback plan once it has expired
 * or was never assigned), plus the organisation-linked e-card boost.
 */
@Injectable()
export class PlanPolicyResolverService {
  constructor(private readonly prisma: PrismaService) {}

  async getEffectivePolicyForCustomer(
    customerId: string,
  ): Promise<EffectivePolicy> {
    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
      select: { currentPlanId: true },
    });
    return this.resolveEffectivePolicy(customerId, customer.currentPlanId);
  }

  async getEffectiveEcardPolicyForCard(card: {
    customerId: string;
    organisationId: string | null;
  }): Promise<EffectiveEcardPolicy> {
    const personal = await this.getEffectivePolicyForCustomer(card.customerId);
    if (!card.organisationId) {
      return personal.ecard;
    }

    const organisation = await this.prisma.organisation.findUnique({
      where: { id: card.organisationId },
      select: { createdByCustomerId: true },
    });
    if (!organisation?.createdByCustomerId) {
      // No resolvable creator — the boost degrades to a no-op rather than
      // failing the whole lookup for an unrelated card.
      return personal.ecard;
    }

    const creatorPolicy = await this.getEffectivePolicyOrNull(
      organisation.createdByCustomerId,
    );
    if (!creatorPolicy) {
      return personal.ecard;
    }

    return this.mergeEcardPolicyBoost(
      personal.ecard,
      creatorPolicy.organisation.orgEcardPolicy,
    );
  }

  async getEffectiveSmartCardPolicy(smartCard: {
    customerId: string | null;
  }): Promise<EffectiveSmartCardPolicy | null> {
    if (!smartCard.customerId) {
      // Unclaimed smart card — fully exempt from plan enforcement.
      return null;
    }
    const policy = await this.getEffectivePolicyForCustomer(
      smartCard.customerId,
    );
    return policy.smartCard;
  }

  async getLeadCaptureAccess(
    customerId: string,
  ): Promise<{ ecard: boolean; smartCard: boolean }> {
    const policy = await this.getEffectivePolicyForCustomer(customerId);
    return {
      ecard: policy.ecard.exchangeContactAccess,
      smartCard: policy.smartCard.exchangeContactAccess,
    };
  }

  async getLeadViewAccess(customerId: string): Promise<boolean> {
    const access = await this.getLeadCaptureAccess(customerId);
    if (access.ecard || access.smartCard) {
      return true;
    }
    const leadCount = await this.prisma.lead.count({ where: { customerId } });
    return leadCount > 0;
  }

  private async getEffectivePolicyOrNull(
    customerId: string,
  ): Promise<EffectivePolicy | null> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { currentPlanId: true },
    });
    if (!customer) {
      return null;
    }
    return this.resolveEffectivePolicy(customerId, customer.currentPlanId);
  }

  private async resolveEffectivePolicy(
    customerId: string,
    currentPlanId: string | null,
  ): Promise<EffectivePolicy> {
    if (currentPlanId) {
      const history = await this.prisma.planPurchaseHistory.findFirst({
        where: { customerId, planId: currentPlanId },
        orderBy: { startedAt: 'desc' },
      });
      const isActive =
        history !== null &&
        (history.expiresAt === null ||
          history.expiresAt.getTime() > Date.now());
      if (isActive) {
        return this.loadEffectivePolicyForPlan(currentPlanId, false);
      }
    }
    return this.loadFallbackEffectivePolicy();
  }

  private async loadFallbackEffectivePolicy(): Promise<EffectivePolicy> {
    const fallbackPlan = await this.prisma.plan.findFirst({
      where: { isFallbackPlan: true },
      select: { id: true },
    });
    if (!fallbackPlan) {
      throw new InternalServerErrorException(
        PLAN_FALLBACK_PLAN_MISSING_MESSAGE,
      );
    }
    return this.loadEffectivePolicyForPlan(fallbackPlan.id, true);
  }

  private async loadEffectivePolicyForPlan(
    planId: string,
    isFallback: boolean,
  ): Promise<EffectivePolicy> {
    const policy = await this.prisma.planPolicy.findUniqueOrThrow({
      where: { planId },
      include: planPolicyInclude,
    });

    return {
      planId,
      isFallback,
      ecard: this.mapEcardPolicy(policy.ecardPolicy),
      smartCard: this.mapSmartCardPolicy(policy.smartCardPolicy),
      organisation: {
        isAvailable: policy.organisationPolicy.isAvailable,
        maxOrgsCanJoin: policy.organisationPolicy.maxOrgsCanJoin,
        maxOrgsCanCreate: policy.organisationPolicy.maxOrgsCanCreate,
        orgEcardPolicy: this.mapEcardPolicy(
          policy.organisationPolicy.orgEcardPolicy,
        ),
        orgSmartCardPolicy: this.mapSmartCardPolicy(
          policy.organisationPolicy.orgSmartCardPolicy,
        ),
      },
      event: {
        isAvailable: policy.eventPolicy.isAvailable,
        maxEvents: policy.eventPolicy.maxEvents,
        maxGuestsPerEvent: policy.eventPolicy.maxGuestsPerEvent,
      },
      emailSignature: {
        isAvailable: policy.emailSignaturePolicy.isAvailable,
        maxEmailSignatures: policy.emailSignaturePolicy.maxEmailSignatures,
      },
      virtualBackground: this.mapVirtualBackgroundPolicy(
        policy.virtualBackgroundPolicy,
      ),
      bulkMessenger: {
        isAvailable: policy.bulkMessengerPolicy.isAvailable,
        maxTemplates: policy.bulkMessengerPolicy.maxTemplates,
      },
    };
  }

  private mapVirtualBackgroundPolicy(
    virtualBackgroundPolicy: VirtualBackgroundPolicyWithRelations,
  ): EffectiveVirtualBackgroundPolicy {
    return {
      isAvailable: virtualBackgroundPolicy.isAvailable,
      maxVirtualBackgrounds: virtualBackgroundPolicy.maxVirtualBackgrounds,
      allowCustomBackground: virtualBackgroundPolicy.allowCustomBackground,
      availableTemplates: virtualBackgroundPolicy.whitelistedTemplates.map(
        (whitelisted) => ({
          id: whitelisted.template.id,
          name: whitelisted.template.name,
        }),
      ),
    };
  }

  private mapEcardPolicy(
    ecardPolicy: EcardPolicyWithRelations,
  ): EffectiveEcardPolicy {
    const components = Object.fromEntries(
      Object.values(ECardComponentType).map((type) => [type, false]),
    ) as Record<ECardComponentType, boolean>;

    let galleryLimits: EffectiveGalleryLimits = {
      maxGalleries: 0,
      maxImagesPerGallery: 0,
      maxGallerySizeBytes: 0,
    };

    let videoGalleryLimits: EffectiveVideoGalleryLimits = {
      maxVideoGalleries: 0,
      maxVideosPerGallery: 0,
    };

    for (const availability of ecardPolicy.componentAvailabilities) {
      components[availability.type] = availability.isAvailable;
      if (
        availability.type === ECardComponentType.GALLERY &&
        availability.galleryLimits
      ) {
        galleryLimits = {
          maxGalleries: availability.galleryLimits.maxGalleries,
          maxImagesPerGallery: availability.galleryLimits.maxImagesPerGallery,
          maxGallerySizeBytes: availability.galleryLimits.maxGallerySizeBytes,
        };
      }
      if (
        availability.type === ECardComponentType.VIDEO_GALLERY &&
        availability.videoGalleryLimits
      ) {
        videoGalleryLimits = {
          maxVideoGalleries: availability.videoGalleryLimits.maxVideoGalleries,
          maxVideosPerGallery:
            availability.videoGalleryLimits.maxVideosPerGallery,
        };
      }
    }

    const heroLayouts = Object.fromEntries(
      ECARD_GATED_HERO_LAYOUTS.map((layout) => [layout, false]),
    ) as Record<ECardHeroLayout, boolean>;
    for (const availability of ecardPolicy.heroLayoutAvailabilities) {
      heroLayouts[availability.layout] = availability.isAvailable;
    }
    // The one place DEFAULT's "never plan-restricted" invariant lives — no
    // stored row for it is ever read, it's always true.
    heroLayouts[ECardHeroLayout.DEFAULT] = true;

    const themes = Object.fromEntries(
      ECARD_GATED_THEMES.map((theme) => [theme, false]),
    ) as Record<ECardTheme, boolean>;
    for (const availability of ecardPolicy.themeAvailabilities) {
      themes[availability.theme] = availability.isAvailable;
    }
    themes[ECardTheme.DEFAULT_DARK] = true;

    const iconShapes = Object.fromEntries(
      ECARD_GATED_ICON_SHAPES.map((shape) => [shape, false]),
    ) as Record<ECardIconShape, boolean>;
    for (const availability of ecardPolicy.iconShapeAvailabilities) {
      iconShapes[availability.iconShape] = availability.isAvailable;
    }
    iconShapes[ECardIconShape.CIRCLE] = true;

    const accentColorPresets: EffectiveAccentColorPreset[] =
      ecardPolicy.accentColorPresets.map((preset) => ({
        themeAffinity: preset.themeAffinity,
        primaryColor: preset.primaryColor,
        secondaryColor: preset.secondaryColor,
      }));

    return {
      isAvailable: ecardPolicy.isAvailable,
      maxEcards: ecardPolicy.maxEcards,
      exchangeContactAccess: ecardPolicy.exchangeContactAccess,
      isCustomFormAvailable: ecardPolicy.isCustomFormAvailable,
      maxCustomForms: ecardPolicy.maxCustomForms,
      components,
      galleryLimits,
      videoGalleryLimits,
      heroLayouts,
      themes,
      iconShapes,
      accentColorCustomizationAvailable:
        ecardPolicy.accentColorCustomizationAvailable,
      accentColorPresets,
    };
  }

  private mapSmartCardPolicy(
    smartCardPolicy: SmartCardPolicyWithRelations,
  ): EffectiveSmartCardPolicy {
    return {
      isAvailable: smartCardPolicy.isAvailable,
      maxSmartCards: smartCardPolicy.maxSmartCards,
      exchangeContactAccess: smartCardPolicy.exchangeContactAccess,
      whitelistedTemplateKeys: smartCardPolicy.whitelistedTemplates.map(
        (whitelisted) => whitelisted.template.key,
      ),
    };
  }

  private mergeEcardPolicyBoost(
    personal: EffectiveEcardPolicy,
    orgBoost: EffectiveEcardPolicy,
  ): EffectiveEcardPolicy {
    const components = { ...personal.components };
    for (const type of Object.keys(components) as ECardComponentType[]) {
      components[type] = personal.components[type] || orgBoost.components[type];
    }

    const heroLayouts = { ...personal.heroLayouts };
    for (const layout of Object.keys(heroLayouts) as ECardHeroLayout[]) {
      heroLayouts[layout] =
        personal.heroLayouts[layout] || orgBoost.heroLayouts[layout];
    }

    const themes = { ...personal.themes };
    for (const theme of Object.keys(themes) as ECardTheme[]) {
      themes[theme] = personal.themes[theme] || orgBoost.themes[theme];
    }

    const iconShapes = { ...personal.iconShapes };
    for (const shape of Object.keys(iconShapes) as ECardIconShape[]) {
      iconShapes[shape] =
        personal.iconShapes[shape] || orgBoost.iconShapes[shape];
    }

    // List-union, not a boolean OR — presets are content, not a flag.
    // De-duped by exact (primaryColor, secondaryColor) pair so a preset
    // defined identically on both sides doesn't appear twice.
    const accentColorPresets = [...personal.accentColorPresets];
    for (const boostPreset of orgBoost.accentColorPresets) {
      const alreadyPresent = accentColorPresets.some(
        (preset) =>
          preset.primaryColor === boostPreset.primaryColor &&
          preset.secondaryColor === boostPreset.secondaryColor,
      );
      if (!alreadyPresent) {
        accentColorPresets.push(boostPreset);
      }
    }

    return {
      isAvailable: personal.isAvailable || orgBoost.isAvailable,
      // Never boosted — a personal, account-wide cap unrelated to one
      // linked card.
      maxEcards: personal.maxEcards,
      exchangeContactAccess:
        personal.exchangeContactAccess || orgBoost.exchangeContactAccess,
      isCustomFormAvailable:
        personal.isCustomFormAvailable || orgBoost.isCustomFormAvailable,
      // Never boosted — same personal-cap treatment as maxEcards above.
      maxCustomForms: personal.maxCustomForms,
      components,
      heroLayouts,
      themes,
      iconShapes,
      accentColorCustomizationAvailable:
        personal.accentColorCustomizationAvailable ||
        orgBoost.accentColorCustomizationAvailable,
      accentColorPresets,
      galleryLimits: {
        maxGalleries: Math.max(
          personal.galleryLimits.maxGalleries,
          orgBoost.galleryLimits.maxGalleries,
        ),
        maxImagesPerGallery: Math.max(
          personal.galleryLimits.maxImagesPerGallery,
          orgBoost.galleryLimits.maxImagesPerGallery,
        ),
        maxGallerySizeBytes: Math.max(
          personal.galleryLimits.maxGallerySizeBytes,
          orgBoost.galleryLimits.maxGallerySizeBytes,
        ),
      },
      videoGalleryLimits: {
        maxVideoGalleries: Math.max(
          personal.videoGalleryLimits.maxVideoGalleries,
          orgBoost.videoGalleryLimits.maxVideoGalleries,
        ),
        maxVideosPerGallery: Math.max(
          personal.videoGalleryLimits.maxVideosPerGallery,
          orgBoost.videoGalleryLimits.maxVideosPerGallery,
        ),
      },
    };
  }
}
