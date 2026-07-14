import {
  ECARD_BROCHURE_FIELD,
  ECARD_HERO_PHOTO_FIELD,
  ecardGalleryImageField,
} from "@config/ecardFields";
import type {
  Ecard,
  EcardComponent,
  EcardComponentPayload,
  EcardImageUpload,
  EcardPayload,
  ImageSlotPayload,
} from "@app-types/ecard";
import type { ImageFieldValue } from "@app-types/media.types";
import type {
  BuilderComponent,
  ComponentDraft,
  EcardBuilderState,
} from "@features/ecards/types/ecardBuilder.types";

export function ecardToBuilderState(card: Ecard): EcardBuilderState {
  return {
    hero: {
      name: card.hero.name,
      email: card.hero.email,
      organisationId: card.organisationId,
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
      endpoint: card.endpoint,
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

function componentToDraft(component: EcardComponent): ComponentDraft {
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
            file: null,
            existingMediaId: image.imageMediaId,
            existingUrl: image.imageUrl,
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
  }
}

function buildImageSlot(
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
          images: subGallery.images
            .map((image, j) =>
              buildImageSlot(image, ecardGalleryImageField(g, j), files),
            )
            .filter((slot): slot is ImageSlotPayload => slot !== undefined),
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
    heroProfilePhoto,
    components,
  };

  return { payload, files };
}
