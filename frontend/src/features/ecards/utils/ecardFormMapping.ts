import {
  ECARD_BROCHURE_FIELD,
  ECARD_HERO_BANNER_FIELD,
  ECARD_HERO_PHOTO_FIELD,
  ecardGalleryImageField,
} from "@config/ecardFields";
import { HEX_COLOR_REGEX } from "@config/color.config";
import type {
  Ecard,
  EcardComponent,
  EcardComponentPayload,
  EcardGalleryImageEntryPayload,
  EcardImageUpload,
  EcardPayload,
  ImageSlotPayload,
} from "@app-types/ecard";
import type { ImageFieldValue } from "@app-types/media.types";
import {
  heroSheetSchema,
  type HeroSheetValues,
} from "@features/ecards/schemas/ecardComponentSchemas";
import { ECARD_HERO_DEFAULT_FALLBACK_COLOR } from "@features/ecards/config/ecardBuilder.config";
import type {
  BuilderComponent,
  ComponentDraft,
  EcardBuilderState,
  EcardHeroDraft,
} from "@features/ecards/types/ecardBuilder.types";

/** Maps the *server's* ecard-core field names (see backend's ecardCoreFields) to the
 * Hero sheet's own form field names, so a validation error returned by the API can
 * drive the exact same `setError`/highlight path as the sheet's own client-side
 * validation. Also acts as an allowlist — any server field not listed here (e.g. a
 * component- or customer-level error) is not a Hero-sheet concern and is dropped. */
const HERO_SERVER_FIELD_TO_FORM_FIELD: Record<string, keyof HeroSheetValues> = {
  endpoint: "endpoint",
  heroName: "name",
  heroEmail: "email",
  heroCompanyName: "companyName",
  phoneCountryDialCode: "phoneCountryDialCode",
  phoneNumber: "phoneNumber",
};

// Layout-related fields aren't react-hook-form-registered (banner is an image
// slot, organisationId lives outside the form) — mapped separately so a
// server rejection still lands on the right field key in the generic
// fieldErrors map the Hero sheets already consume for both RHF and non-RHF fields.
const HERO_SERVER_FIELD_TO_LAYOUT_FIELD: Record<string, string> = {
  heroBanner: "banner",
  heroBannerFallbackColor: "bannerFallbackColor",
  heroBadgeFallbackColor: "badgeFallbackColor",
  organisationId: "layout",
  heroTheme: "heroTheme",
  heroIconShape: "heroIconShape",
  heroPrimaryAccentColor: "heroPrimaryAccentColor",
  heroSecondaryAccentColor: "heroSecondaryAccentColor",
};

/** Mirrors the backend's assertHeroLayoutFieldsConsistent/
 * assertHeroOrgBadgeRequiresOrganisation superRefine checks (ecard-core.dto.ts)
 * for the layout-specific fields that live outside heroSheetSchema's plain-string
 * fields (banner is an image slot, organisationId is managed outside react-hook-form). */
export function getHeroLayoutValidationErrors(
  hero: EcardHeroDraft,
): Record<string, string> | null {
  const fieldErrors: Record<string, string> = {};

  if (hero.layout === "BANNER" || hero.layout === "BANNER_PROFILE") {
    if (!hero.banner.file && !hero.banner.existingMediaId) {
      fieldErrors.banner = "A banner image is required for this layout";
    }
    if (!HEX_COLOR_REGEX.test(hero.bannerFallbackColor)) {
      fieldErrors.bannerFallbackColor = "Enter a valid fallback color";
    }
  }

  if (hero.layout === "ORG_BADGE") {
    if (!hero.organisationId) {
      fieldErrors.layout = "Link an organisation to use the Org Badge layout";
    }
    if (!HEX_COLOR_REGEX.test(hero.badgeFallbackColor)) {
      fieldErrors.badgeFallbackColor = "Enter a valid fallback color";
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
}

/** Runs the same schema the Hero edit sheet validates against, against the builder's
 * current hero draft — lets the outer "Save card" action catch a missing/invalid Hero
 * field instantly, with no server round-trip. Returns a field->message map (keyed by
 * the Hero sheet's own form field names) or null when the hero draft is valid. */
export function getHeroValidationErrors(
  hero: EcardHeroDraft,
): Record<string, string> | null {
  const result = heroSheetSchema.safeParse({
    endpoint: hero.endpoint,
    name: hero.name,
    email: hero.email,
    companyName: hero.companyName,
    phoneCountryDialCode: hero.phoneCountryDialCode,
    phoneNumber: hero.phoneNumber,
  });

  const fieldErrors: Record<string, string> = {};
  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = String(issue.path[0]);
      // A field can fail more than one check (e.g. both too short and the wrong
      // pattern) — keep the first, since it reads most naturally top-to-bottom.
      if (!(field in fieldErrors)) fieldErrors[field] = issue.message;
    }
  }

  const layoutErrors = getHeroLayoutValidationErrors(hero);
  Object.assign(fieldErrors, layoutErrors);

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
}

/** Translates a server-returned field-error map (backend field names) into the Hero
 * sheet's own form field names, dropping anything outside the Hero sheet's fields.
 * Returns null when none of the server errors are Hero-related. */
export function mapServerFieldErrorsToHeroFields(
  serverFieldErrors: Record<string, string>,
): Record<string, string> | null {
  const heroFieldErrors: Record<string, string> = {};
  for (const [field, message] of Object.entries(serverFieldErrors)) {
    const formField =
      HERO_SERVER_FIELD_TO_FORM_FIELD[field] ??
      HERO_SERVER_FIELD_TO_LAYOUT_FIELD[field];
    if (formField) heroFieldErrors[formField] = message;
  }

  return Object.keys(heroFieldErrors).length > 0 ? heroFieldErrors : null;
}

export function ecardToBuilderState(card: Ecard): EcardBuilderState {
  return {
    hero: {
      name: card.hero.name,
      email: card.hero.email,
      organisationId: card.organisationId,
      organisationLogoUrl: card.hero.organisationLogoUrl,
      companyName: card.hero.companyName ?? "",
      photo: card.hero.profilePhotoMediaId
        ? {
            file: null,
            existingMediaId: card.hero.profilePhotoMediaId,
            existingUrl: card.hero.profilePhotoUrl ?? undefined,
          }
        : { file: null },
      phoneCountryDialCode: card.hero.phoneCountryDialCode ?? "",
      phoneNumber: card.hero.phoneNumber ?? "",
      isExchangeContactEnabled: card.hero.isExchangeContactEnabled,
      autoDownloadContact: card.hero.autoDownloadContact,
      endpoint: card.endpoint,
      layout: card.hero.layout,
      banner: card.hero.bannerMediaId
        ? {
            file: null,
            existingMediaId: card.hero.bannerMediaId,
            existingUrl: card.hero.bannerUrl ?? undefined,
          }
        : { file: null },
      bannerFallbackColor:
        card.hero.bannerFallbackColor ?? ECARD_HERO_DEFAULT_FALLBACK_COLOR,
      badgeFallbackColor:
        card.hero.badgeFallbackColor ?? ECARD_HERO_DEFAULT_FALLBACK_COLOR,
      theme: card.hero.theme,
      primaryAccentColor: card.hero.primaryAccentColor,
      secondaryAccentColor: card.hero.secondaryAccentColor,
      iconShape: card.hero.iconShape,
    },
    components: card.components
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((component) => ({
        key: crypto.randomUUID(),
        draft: componentToDraft(component),
      })),
  };
}

// Exported — also reused by the organisation e-card template's own mapping
// util (its response `components` shape is the exact same EcardComponent
// union, just sourced from a template instead of a card).
export function componentToDraft(component: EcardComponent): ComponentDraft {
  switch (component.type) {
    case "ABOUT":
      return {
        type: "ABOUT",
        profession: component.profession ?? "",
        shortNote: component.shortNote ?? "",
        description: component.description ?? "",
        aboutMe: component.aboutMe ?? "",
      };
    case "SOCIAL_LINKS":
      return {
        type: "SOCIAL_LINKS",
        website: component.website ?? "",
        instagram: component.instagram ?? "",
        facebook: component.facebook ?? "",
        twitter: component.twitter ?? "",
        linkedIn: component.linkedIn ?? "",
        youtube: component.youtube ?? "",
      };
    case "VIDEO":
      return {
        type: "VIDEO",
        title: component.title ?? "",
        videoUrl: component.videoUrl ?? "",
      };
    case "GALLERY":
      return {
        type: "GALLERY",
        subGalleries: component.subGalleries.map((subGallery) => ({
          title: subGallery.title ?? "",
          images: subGallery.images.map((image) => ({
            image: {
              file: null,
              existingMediaId: image.imageMediaId,
              existingUrl: image.imageUrl,
            },
            caption: image.caption ?? "",
          })),
        })),
      };
    case "VIDEO_GALLERY":
      return {
        type: "VIDEO_GALLERY",
        subGalleries: component.subGalleries.map((subGallery) => ({
          title: subGallery.title ?? "",
          videos: subGallery.videos.map((video) => ({
            videoUrl: video.videoUrl,
            caption: video.caption ?? "",
          })),
        })),
      };
    case "TEAM":
      return {
        type: "TEAM",
        title: component.title ?? "",
        memberIds: component.members.map((member) => member.organisationMemberId),
      };
    case "WHATSAPP":
      return {
        type: "WHATSAPP",
        phoneCountryDialCode: component.phoneCountryDialCode ?? "",
        phoneNumber: component.phoneNumber ?? "",
      };
    case "BROCHURE":
      return {
        type: "BROCHURE",
        pdf: component.pdfMediaId
          ? {
              file: null,
              existingMediaId: component.pdfMediaId,
              existingUrl: component.pdfUrl ?? undefined,
            }
          : { file: null },
      };
    case "LOCATION_TILE":
      return {
        type: "LOCATION_TILE",
        label: component.label ?? "",
        latitude: component.latitude,
        longitude: component.longitude,
      };
    case "REVIEW_LINK":
      return {
        type: "REVIEW_LINK",
        url: component.url ?? "",
      };
    case "TESTIMONIALS":
      return {
        type: "TESTIMONIALS",
        entries: component.entries.map((entry) => ({
          name: entry.name,
          rating: entry.rating,
          text: entry.text,
        })),
      };
  }
}

// Exported — reused by the organisation e-card template's mapping util for
// its own hero photo / gallery image / brochure pdf slots.
export function buildImageSlot(
  value: ImageFieldValue,
  fieldName: string,
  files: EcardImageUpload[],
): ImageSlotPayload | undefined {
  if (value.file) {
    files.push({ fieldName, file: value.file });
    return { action: "upload" };
  }
  if (value.existingMediaId) {
    return { action: "keep", mediaId: value.existingMediaId };
  }
  return undefined;
}

function componentDraftToPayload(
  draft: ComponentDraft,
  index: number,
  files: EcardImageUpload[],
): EcardComponentPayload {
  switch (draft.type) {
    case "ABOUT":
      return {
        type: "ABOUT",
        profession: draft.profession.trim() || undefined,
        shortNote: draft.shortNote.trim() || undefined,
        description: draft.description.trim() || undefined,
        aboutMe: draft.aboutMe.trim() || undefined,
      };
    case "SOCIAL_LINKS":
      return {
        type: "SOCIAL_LINKS",
        website: draft.website.trim() || undefined,
        instagram: draft.instagram.trim() || undefined,
        facebook: draft.facebook.trim() || undefined,
        twitter: draft.twitter.trim() || undefined,
        linkedIn: draft.linkedIn.trim() || undefined,
        youtube: draft.youtube.trim() || undefined,
      };
    case "VIDEO":
      return {
        type: "VIDEO",
        title: draft.title.trim() || undefined,
        videoUrl: draft.videoUrl.trim(),
      };
    case "GALLERY":
      return {
        type: "GALLERY",
        subGalleries: draft.subGalleries.map((subGallery, g) => ({
          title: subGallery.title.trim() || undefined,
          images: subGallery.images.flatMap(
            (entry, j): EcardGalleryImageEntryPayload[] => {
              const image = buildImageSlot(
                entry.image,
                ecardGalleryImageField(g, j),
                files,
              );
              if (!image) return [];
              return [{ image, caption: entry.caption.trim() || undefined }];
            },
          ),
        })),
      };
    case "VIDEO_GALLERY":
      return {
        type: "VIDEO_GALLERY",
        subGalleries: draft.subGalleries.map((subGallery) => ({
          title: subGallery.title.trim() || undefined,
          videos: subGallery.videos
            .filter((video) => video.videoUrl.trim() !== "")
            .map((video) => ({
              videoUrl: video.videoUrl.trim(),
              caption: video.caption.trim() || undefined,
            })),
        })),
      };
    case "TEAM":
      return {
        type: "TEAM",
        title: draft.title.trim() || undefined,
        members: draft.memberIds.map((organisationMemberId) => ({
          organisationMemberId,
        })),
      };
    case "WHATSAPP":
      return {
        type: "WHATSAPP",
        phoneCountryDialCode: draft.phoneCountryDialCode.trim(),
        phoneNumber: draft.phoneNumber.trim(),
      };
    case "BROCHURE": {
      const pdf = buildImageSlot(draft.pdf, ECARD_BROCHURE_FIELD, files);
      if (!pdf) {
        throw new Error("Brochure component requires an uploaded PDF");
      }
      return { type: "BROCHURE", pdf };
    }
    case "LOCATION_TILE": {
      if (draft.latitude === null || draft.longitude === null) {
        throw new Error("Location component requires a captured location");
      }
      return {
        type: "LOCATION_TILE",
        label: draft.label.trim(),
        latitude: draft.latitude,
        longitude: draft.longitude,
      };
    }
    case "REVIEW_LINK":
      return { type: "REVIEW_LINK", url: draft.url.trim() };
    case "TESTIMONIALS":
      return {
        type: "TESTIMONIALS",
        entries: draft.entries
          .filter((entry) => entry.name.trim() && entry.text.trim())
          .map((entry) => ({
            name: entry.name.trim(),
            rating: entry.rating,
            text: entry.text.trim(),
          })),
      };
  }
  // index is only used to keep the parameter list symmetric with the
  // caller's map(); no per-component numbering is needed in the payload.
  void index;
}

export interface EcardSubmission {
  payload: EcardPayload;
  files: EcardImageUpload[];
}

export function buildEcardSubmission(state: EcardBuilderState): EcardSubmission {
  const files: EcardImageUpload[] = [];
  const heroProfilePhoto = buildImageSlot(
    state.hero.photo,
    ECARD_HERO_PHOTO_FIELD,
    files,
  );
  const isBannerLayout =
    state.hero.layout === "BANNER" || state.hero.layout === "BANNER_PROFILE";
  const heroBanner = isBannerLayout
    ? buildImageSlot(state.hero.banner, ECARD_HERO_BANNER_FIELD, files)
    : undefined;
  const components = state.components.map((component: BuilderComponent, index) =>
    componentDraftToPayload(component.draft, index, files),
  );

  const payload: EcardPayload = {
    endpoint: state.hero.endpoint.trim(),
    heroName: state.hero.name.trim(),
    heroEmail: state.hero.email.trim(),
    organisationId: state.hero.organisationId ?? undefined,
    heroCompanyName: state.hero.companyName.trim() || undefined,
    phoneCountryDialCode: state.hero.phoneCountryDialCode.trim() || undefined,
    phoneNumber: state.hero.phoneNumber.trim() || undefined,
    isExchangeContactEnabled: state.hero.isExchangeContactEnabled,
    autoDownloadContact: state.hero.autoDownloadContact,
    heroProfilePhoto,
    heroLayout: state.hero.layout,
    heroBanner,
    heroBannerFallbackColor: isBannerLayout
      ? state.hero.bannerFallbackColor
      : undefined,
    heroBadgeFallbackColor:
      state.hero.layout === "ORG_BADGE"
        ? state.hero.badgeFallbackColor
        : undefined,
    heroTheme: state.hero.theme,
    heroIconShape: state.hero.iconShape,
    heroPrimaryAccentColor: state.hero.primaryAccentColor ?? undefined,
    heroSecondaryAccentColor: state.hero.secondaryAccentColor ?? undefined,
    components,
  };

  return { payload, files };
}
