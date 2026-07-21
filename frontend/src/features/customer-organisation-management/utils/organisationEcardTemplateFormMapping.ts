import {
  ECARD_BROCHURE_FIELD,
  ECARD_HERO_PHOTO_FIELD,
  ecardGalleryImageField,
} from "@config/ecardFields";
import type {
  OrganisationEcardTemplate,
  OrganisationEcardTemplateComponentPayload,
  OrganisationEcardTemplateImageUpload,
  OrganisationEcardTemplatePayload,
} from "@app-types/organisationEcardTemplate";
import { buildImageSlot, componentToDraft } from "@features/ecards";
import type { ComponentDraft } from "@features/ecards";
import {
  emptyOrganisationEcardTemplateBuilderState,
  emptyOrganisationEcardTemplateHeroDraft,
  type OrganisationEcardTemplateBuilderState,
} from "@features/customer-organisation-management/types/organisationEcardTemplateBuilder.types";

export function organisationEcardTemplateToBuilderState(
  template: OrganisationEcardTemplate | null,
): OrganisationEcardTemplateBuilderState {
  if (!template) {
    return emptyOrganisationEcardTemplateBuilderState();
  }

  return {
    hero: {
      ...emptyOrganisationEcardTemplateHeroDraft(),
      name: template.hero.name ?? "",
      email: template.hero.email ?? "",
      companyName: template.hero.companyName ?? "",
      photo: template.hero.profilePhotoMediaId
        ? {
            file: null,
            existingMediaId: template.hero.profilePhotoMediaId,
            existingUrl: template.hero.profilePhotoUrl ?? undefined,
          }
        : { file: null },
      phoneCountryDialCode: template.hero.phoneCountryDialCode ?? "",
      phoneNumber: template.hero.phoneNumber ?? "",
    },
    components: template.components
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((component) => ({
        key: crypto.randomUUID(),
        draft: componentToDraft(component),
      })),
  };
}

// Unlike an e-card's own componentDraftToPayload, every field here is
// trimmed-or-omitted (never sent as an empty required value) — a template
// component left blank means "defer to the customer", not "invalid input".
function componentDraftToTemplatePayload(
  draft: ComponentDraft,
  files: OrganisationEcardTemplateImageUpload[],
): OrganisationEcardTemplateComponentPayload {
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
        videoUrl: draft.videoUrl.trim() || undefined,
      };
    case "GALLERY":
      return {
        type: "GALLERY",
        subGalleries: draft.subGalleries.map((subGallery, g) => ({
          title: subGallery.title.trim() || undefined,
          images: subGallery.images
            .map((image, j) => buildImageSlot(image, ecardGalleryImageField(g, j), files))
            .filter((slot) => slot !== undefined),
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
        phoneCountryDialCode: draft.phoneCountryDialCode.trim() || undefined,
        phoneNumber: draft.phoneNumber.trim() || undefined,
      };
    case "BROCHURE":
      return {
        type: "BROCHURE",
        pdf: buildImageSlot(draft.pdf, ECARD_BROCHURE_FIELD, files),
      };
  }
}

export interface OrganisationEcardTemplateSubmission {
  payload: OrganisationEcardTemplatePayload;
  files: OrganisationEcardTemplateImageUpload[];
}

export function buildOrganisationEcardTemplateSubmission(
  state: OrganisationEcardTemplateBuilderState,
): OrganisationEcardTemplateSubmission {
  const files: OrganisationEcardTemplateImageUpload[] = [];
  const heroProfilePhoto = buildImageSlot(
    state.hero.photo,
    ECARD_HERO_PHOTO_FIELD,
    files,
  );
  const components = state.components.map((component) =>
    componentDraftToTemplatePayload(component.draft, files),
  );

  const payload: OrganisationEcardTemplatePayload = {
    heroName: state.hero.name.trim() || undefined,
    heroEmail: state.hero.email.trim() || undefined,
    heroCompanyName: state.hero.companyName.trim() || undefined,
    phoneCountryDialCode: state.hero.phoneCountryDialCode.trim() || undefined,
    phoneNumber: state.hero.phoneNumber.trim() || undefined,
    heroProfilePhoto,
    components,
  };

  return { payload, files };
}
