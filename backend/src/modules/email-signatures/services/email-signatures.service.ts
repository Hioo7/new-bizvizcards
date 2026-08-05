import { Injectable, NotFoundException } from '@nestjs/common';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { MediaService } from '../../../common/media/media.service';
import { MediaSlotResolverService } from '../../../common/media/media-slot-resolver.service';
import { toAbsoluteUrl } from '../../../common/utils/absolute-url.util';
import {
  EmailSignatureSocialPlatform,
  EmailSignatureTemplateKey,
  Prisma,
} from '../../../generated/prisma/client';
import { PlanEnforcementService } from '../../plans/services/plan-enforcement.service';
import type { CreateEmailSignatureDto } from '../dto/create-email-signature.dto';
import type { UpdateEmailSignatureDto } from '../dto/update-email-signature.dto';
import type { PreviewEmailSignatureDto } from '../dto/preview-email-signature.dto';
import type { EmailSignatureSocialLinkDto } from '../dto/email-signature-social-link.dto';
import {
  buildEmailSignatureWhatsAppUrl,
  EMAIL_SIGNATURE_BANNER_IMAGE_FIELD,
  EMAIL_SIGNATURE_COMPANY_LOGO_FIELD,
  EMAIL_SIGNATURE_NOT_FOUND_MESSAGE,
  EMAIL_SIGNATURE_PROFILE_IMAGE_FIELD,
  EMAIL_SIGNATURE_SOCIAL_ICON_STORAGE_KEY,
  EMAIL_SIGNATURE_STORAGE_KEY_PREFIX,
} from '../email-signatures.constants';
import { emailSignatureRendererRegistry } from '../templates/email-signature-renderer-registry';
import type {
  EmailSignatureRenderInput,
  EmailSignatureSocialLinkRenderInput,
} from '../templates/email-signature-renderer.interface';

const FULL_INCLUDE = {
  profileImageMedia: true,
  companyLogoMedia: true,
  bannerImageMedia: true,
  socialLinks: { orderBy: { order: 'asc' as const } },
} satisfies Prisma.EmailSignatureInclude;

type FullEmailSignature = Prisma.EmailSignatureGetPayload<{
  include: typeof FULL_INCLUDE;
}>;

export interface EmailSignatureSocialLinkResponse {
  platform: EmailSignatureSocialPlatform;
  url: string;
  label: string | null;
}

export interface EmailSignatureResponse {
  id: string;
  customerId: string;
  templateKey: EmailSignatureTemplateKey;
  name: string;
  fullName: string;
  jobTitle: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  profileImageMediaId: string | null;
  profileImageUrl: string | null;
  companyLogoMediaId: string | null;
  companyLogoUrl: string | null;
  bannerImageMediaId: string | null;
  bannerImageUrl: string | null;
  socialLinks: EmailSignatureSocialLinkResponse[];
  generatedHtml: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class EmailSignaturesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
    private readonly mediaSlotResolver: MediaSlotResolverService,
    private readonly planEnforcementService: PlanEnforcementService,
    private readonly appConfig: AppConfigService,
  ) {}

  async listForCustomer(customerId: string): Promise<EmailSignatureResponse[]> {
    const signatures = await this.prisma.emailSignature.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: FULL_INCLUDE,
    });
    return signatures.map((signature) => this.toResponse(signature));
  }

  async getById(id: string): Promise<EmailSignatureResponse> {
    const signature = await this.findFullByIdOrThrow(id);
    return this.toResponse(signature);
  }

  async create(
    dto: CreateEmailSignatureDto & { customerId: string },
    files: Express.Multer.File[],
  ): Promise<EmailSignatureResponse> {
    await this.planEnforcementService.assertCanCreateEmailSignature(
      dto.customerId,
    );

    const fileMap = this.mediaSlotResolver.buildFileMap(files);

    const anchor = await this.prisma.emailSignature.create({
      data: {
        customerId: dto.customerId,
        templateKey: dto.templateKey,
        name: dto.name,
        fullName: dto.fullName,
        jobTitle: dto.jobTitle,
        company: dto.company,
        email: dto.email,
        phone: dto.phone,
        website: dto.website,
        address: dto.address,
        ctaText: dto.ctaText,
        ctaUrl: dto.ctaUrl,
      },
    });
    const keyPrefix = `${EMAIL_SIGNATURE_STORAGE_KEY_PREFIX}/${anchor.id}`;

    const profileImageMediaId = await this.mediaSlotResolver.resolveUploadSlot(
      dto.profileImage,
      EMAIL_SIGNATURE_PROFILE_IMAGE_FIELD,
      fileMap,
      `${keyPrefix}/profile`,
    );
    const companyLogoMediaId = await this.mediaSlotResolver.resolveUploadSlot(
      dto.companyLogo,
      EMAIL_SIGNATURE_COMPANY_LOGO_FIELD,
      fileMap,
      `${keyPrefix}/logo`,
    );
    const bannerImageMediaId = await this.mediaSlotResolver.resolveUploadSlot(
      dto.bannerImage,
      EMAIL_SIGNATURE_BANNER_IMAGE_FIELD,
      fileMap,
      `${keyPrefix}/banner`,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.emailSignature.update({
        where: { id: anchor.id },
        data: {
          profileImageMediaId: profileImageMediaId ?? null,
          companyLogoMediaId: companyLogoMediaId ?? null,
          bannerImageMediaId: bannerImageMediaId ?? null,
        },
      });
      await this.replaceSocialLinks(tx, anchor.id, dto.socialLinks);
    });

    return this.getById(anchor.id);
  }

  async update(
    id: string,
    dto: UpdateEmailSignatureDto,
    files: Express.Multer.File[],
  ): Promise<EmailSignatureResponse> {
    const existing = await this.findFullByIdOrThrow(id);
    const existingMediaIds = new Set(this.collectMediaIds(existing));
    const fileMap = this.mediaSlotResolver.buildFileMap(files);
    const keyPrefix = `${EMAIL_SIGNATURE_STORAGE_KEY_PREFIX}/${existing.id}`;

    // A field untouched by this update (dto.<field> === undefined) always
    // carries its existing media id forward unchanged — only a slot the
    // client actually sent (upload or keep) is allowed to change what's
    // attached, so an image is never accidentally orphaned just because the
    // client's payload didn't mention that particular field this time.
    const profileImageMediaId =
      dto.profileImage !== undefined
        ? await this.mediaSlotResolver.resolveUpdateSlot(
            dto.profileImage,
            EMAIL_SIGNATURE_PROFILE_IMAGE_FIELD,
            fileMap,
            `${keyPrefix}/profile`,
            existingMediaIds,
          )
        : (existing.profileImageMediaId ?? undefined);
    const companyLogoMediaId =
      dto.companyLogo !== undefined
        ? await this.mediaSlotResolver.resolveUpdateSlot(
            dto.companyLogo,
            EMAIL_SIGNATURE_COMPANY_LOGO_FIELD,
            fileMap,
            `${keyPrefix}/logo`,
            existingMediaIds,
          )
        : (existing.companyLogoMediaId ?? undefined);
    const bannerImageMediaId =
      dto.bannerImage !== undefined
        ? await this.mediaSlotResolver.resolveUpdateSlot(
            dto.bannerImage,
            EMAIL_SIGNATURE_BANNER_IMAGE_FIELD,
            fileMap,
            `${keyPrefix}/banner`,
            existingMediaIds,
          )
        : (existing.bannerImageMediaId ?? undefined);

    const newMediaIds = new Set(
      [profileImageMediaId, companyLogoMediaId, bannerImageMediaId].filter(
        (mediaId): mediaId is string => Boolean(mediaId),
      ),
    );
    const orphanedMediaIds = [...existingMediaIds].filter(
      (mediaId) => !newMediaIds.has(mediaId),
    );

    await this.prisma.$transaction(async (tx) => {
      const data: Prisma.EmailSignatureUncheckedUpdateInput = {};
      if (dto.templateKey !== undefined) data.templateKey = dto.templateKey;
      if (dto.name !== undefined) data.name = dto.name;
      if (dto.fullName !== undefined) data.fullName = dto.fullName;
      if (dto.jobTitle !== undefined) data.jobTitle = dto.jobTitle;
      if (dto.company !== undefined) data.company = dto.company;
      if (dto.email !== undefined) data.email = dto.email;
      if (dto.phone !== undefined) data.phone = dto.phone;
      if (dto.website !== undefined) data.website = dto.website;
      if (dto.address !== undefined) data.address = dto.address;
      if (dto.ctaText !== undefined) data.ctaText = dto.ctaText;
      if (dto.ctaUrl !== undefined) data.ctaUrl = dto.ctaUrl;
      if (dto.profileImage !== undefined) {
        data.profileImageMediaId = profileImageMediaId ?? null;
      }
      if (dto.companyLogo !== undefined) {
        data.companyLogoMediaId = companyLogoMediaId ?? null;
      }
      if (dto.bannerImage !== undefined) {
        data.bannerImageMediaId = bannerImageMediaId ?? null;
      }
      if (Object.keys(data).length > 0) {
        await tx.emailSignature.update({ where: { id: existing.id }, data });
      }

      if (dto.socialLinks !== undefined) {
        await this.replaceSocialLinks(tx, existing.id, dto.socialLinks);
      }
    });

    await Promise.allSettled(
      orphanedMediaIds.map((mediaId) => this.mediaService.delete(mediaId)),
    );

    return this.getById(existing.id);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.findFullByIdOrThrow(id);
    const mediaIds = this.collectMediaIds(existing);

    await this.prisma.emailSignature.delete({ where: { id: existing.id } });

    await Promise.allSettled(
      mediaIds.map((mediaId) => this.mediaService.delete(mediaId)),
    );
  }

  renderPreview(dto: PreviewEmailSignatureDto): { html: string } {
    const input: EmailSignatureRenderInput = {
      fullName: dto.fullName,
      jobTitle: dto.jobTitle,
      company: dto.company,
      email: dto.email,
      phone: dto.phone,
      website: dto.website,
      address: dto.address,
      ctaText: dto.ctaText,
      ctaUrl: dto.ctaUrl,
      profileImageUrl: dto.profileImageUrl,
      companyLogoUrl: dto.companyLogoUrl,
      bannerImageUrl: dto.bannerImageUrl,
      socialLinks: this.buildSocialLinkRenderInputs(
        dto.socialLinks.map((link) => this.normalizeSocialLink(link)),
      ),
    };
    return {
      html: emailSignatureRendererRegistry[dto.templateKey].render(input),
    };
  }

  // ── internal helpers ──────────────────────────────────────────────────────

  private async replaceSocialLinks(
    tx: Prisma.TransactionClient,
    emailSignatureId: string,
    socialLinks: EmailSignatureSocialLinkDto[],
  ): Promise<void> {
    await tx.emailSignatureSocialLink.deleteMany({
      where: { emailSignatureId },
    });
    if (socialLinks.length === 0) {
      return;
    }
    const normalized = socialLinks.map((link) =>
      this.normalizeSocialLink(link),
    );
    await tx.emailSignatureSocialLink.createMany({
      data: normalized.map((link, index) => ({
        emailSignatureId,
        platform: link.platform,
        url: link.url,
        label: link.label ?? null,
        order: index,
      })),
    });
  }

  // Every social-link DTO variant is normalized to the same {platform, url,
  // label?} shape the renderer/response layer already expects — WhatsApp is
  // the one platform entered as a phone number rather than a URL, so its
  // click-to-chat wa.me link is generated here, once, at the single point
  // every write (create/update) and the non-persisting preview both funnel
  // through, rather than duplicating this in each call site.
  private normalizeSocialLink(link: EmailSignatureSocialLinkDto): {
    platform: EmailSignatureSocialPlatform;
    url: string;
    label?: string;
  } {
    if (link.platform === EmailSignatureSocialPlatform.WHATSAPP) {
      return {
        platform: link.platform,
        url: buildEmailSignatureWhatsAppUrl(link.phoneNumber),
      };
    }
    if (link.platform === EmailSignatureSocialPlatform.CUSTOM) {
      return { platform: link.platform, url: link.url, label: link.label };
    }
    return { platform: link.platform, url: link.url };
  }

  private async findFullByIdOrThrow(id: string): Promise<FullEmailSignature> {
    const signature = await this.prisma.emailSignature.findUnique({
      where: { id },
      include: FULL_INCLUDE,
    });
    if (!signature) {
      throw new NotFoundException(EMAIL_SIGNATURE_NOT_FOUND_MESSAGE);
    }
    return signature;
  }

  private collectMediaIds(signature: FullEmailSignature): string[] {
    return [
      signature.profileImageMediaId,
      signature.companyLogoMediaId,
      signature.bannerImageMediaId,
    ].filter((mediaId): mediaId is string => Boolean(mediaId));
  }

  private buildSocialLinkRenderInputs(
    socialLinks: {
      platform: EmailSignatureSocialPlatform;
      url: string;
      label?: string;
    }[],
  ): EmailSignatureSocialLinkRenderInput[] {
    return socialLinks.map((link) => {
      const iconStorageKey =
        EMAIL_SIGNATURE_SOCIAL_ICON_STORAGE_KEY[link.platform];
      return {
        platform: link.platform,
        url: link.url,
        label: link.label,
        iconUrl: iconStorageKey
          ? toAbsoluteUrl(
              this.appConfig.publicAppBaseUrl,
              this.mediaService.getPublicUrlForKey(iconStorageKey),
            )
          : undefined,
      };
    });
  }

  private toResponse(signature: FullEmailSignature): EmailSignatureResponse {
    // Absolutized (unlike most in-app media references, which stay relative
    // and resolve against the app's own origin) — a signature is meant to be
    // copied or downloaded out of the app entirely (into an email client, or
    // a standalone .html file), where there is no "current origin" for a
    // relative URL to resolve against. Same reasoning/pattern as
    // EcardOgPreviewService's canonical/image URLs.
    const profileImageUrl = signature.profileImageMedia
      ? toAbsoluteUrl(
          this.appConfig.publicAppBaseUrl,
          this.mediaService.getPublicUrl(signature.profileImageMedia),
        )
      : null;
    const companyLogoUrl = signature.companyLogoMedia
      ? toAbsoluteUrl(
          this.appConfig.publicAppBaseUrl,
          this.mediaService.getPublicUrl(signature.companyLogoMedia),
        )
      : null;
    const bannerImageUrl = signature.bannerImageMedia
      ? toAbsoluteUrl(
          this.appConfig.publicAppBaseUrl,
          this.mediaService.getPublicUrl(signature.bannerImageMedia),
        )
      : null;

    const renderInput: EmailSignatureRenderInput = {
      fullName: signature.fullName,
      jobTitle: signature.jobTitle ?? undefined,
      company: signature.company ?? undefined,
      email: signature.email ?? undefined,
      phone: signature.phone ?? undefined,
      website: signature.website ?? undefined,
      address: signature.address ?? undefined,
      ctaText: signature.ctaText ?? undefined,
      ctaUrl: signature.ctaUrl ?? undefined,
      profileImageUrl: profileImageUrl ?? undefined,
      companyLogoUrl: companyLogoUrl ?? undefined,
      bannerImageUrl: bannerImageUrl ?? undefined,
      socialLinks: this.buildSocialLinkRenderInputs(
        signature.socialLinks.map((link) => ({
          platform: link.platform,
          url: link.url,
          label: link.label ?? undefined,
        })),
      ),
    };
    const generatedHtml =
      emailSignatureRendererRegistry[signature.templateKey].render(renderInput);

    return {
      id: signature.id,
      customerId: signature.customerId,
      templateKey: signature.templateKey,
      name: signature.name,
      fullName: signature.fullName,
      jobTitle: signature.jobTitle,
      company: signature.company,
      email: signature.email,
      phone: signature.phone,
      website: signature.website,
      address: signature.address,
      ctaText: signature.ctaText,
      ctaUrl: signature.ctaUrl,
      profileImageMediaId: signature.profileImageMediaId,
      profileImageUrl,
      companyLogoMediaId: signature.companyLogoMediaId,
      companyLogoUrl,
      bannerImageMediaId: signature.bannerImageMediaId,
      bannerImageUrl,
      socialLinks: signature.socialLinks.map((link) => ({
        platform: link.platform,
        url: link.url,
        label: link.label,
      })),
      generatedHtml,
      createdAt: signature.createdAt,
      updatedAt: signature.updatedAt,
    };
  }
}
