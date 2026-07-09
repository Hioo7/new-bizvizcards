import {
  SMART_CARD_FOUNDER_IMAGE_FIELD,
  SMART_CARD_PROFILE_LOGO_FIELD,
  smartCardGalleryImageField,
  smartCardServiceImageField,
} from "@config/smartCardFields";
import { emptyImageField } from "@features/smart-cards/types/smartCardForm.types";
import type {
  ImageFieldValue,
  SmartCardFormValues,
} from "@features/smart-cards/types/smartCardForm.types";
import type {
  CreateSmartCardPayload,
  ImageSlot,
  SmartCard,
  SmartCardImageUpload,
  SmartCardTemplateKey,
} from "@app-types/smartCard";

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function optionalNumber(value: string): number | undefined {
  return value.trim() === "" ? undefined : Number(value);
}

function toImageField(
  mediaId: string | null | undefined,
  url: string | null | undefined,
): ImageFieldValue {
  return mediaId
    ? { file: null, existingMediaId: mediaId, existingUrl: url ?? undefined }
    : emptyImageField();
}

function resolveImageSlot(
  image: ImageFieldValue,
  fieldName: string,
  files: SmartCardImageUpload[],
): ImageSlot | undefined {
  if (image.file) {
    files.push({ fieldName, file: image.file });
    return { action: "upload" };
  }
  if (image.existingMediaId) {
    return { action: "keep", mediaId: image.existingMediaId };
  }
  return undefined;
}

export function smartCardToFormValues(card: SmartCard): SmartCardFormValues {
  return {
    customer: { customerId: card.customerId ?? "" },
    profile: {
      endpoint: card.endpoint,
      companyName: card.profile?.companyName ?? "",
      tagline: card.profile?.tagline ?? "",
      subTagline: card.profile?.subTagline ?? "",
      aboutText: card.profile?.aboutText ?? "",
      logo: toImageField(card.profile?.logoMediaId, card.profile?.logoUrl),
    },
    contact: {
      contactNumber: card.contact?.contactNumber ?? "",
      email: card.contact?.email ?? "",
      address: card.contact?.address ?? "",
    },
    social: {
      whatsapp: card.socialMedia?.whatsapp ?? "",
      instagram: card.socialMedia?.instagram ?? "",
      facebook: card.socialMedia?.facebook ?? "",
      linkedIn: card.socialMedia?.linkedIn ?? "",
      twitter: card.socialMedia?.twitter ?? "",
      youtube: card.socialMedia?.youtube ?? "",
      googleMap: card.socialMedia?.googleMap ?? "",
      website: card.socialMedia?.website ?? "",
      other: card.socialMedia?.other ?? "",
    },
    founder: {
      name: card.founder?.name ?? "",
      title: card.founder?.title ?? "",
      experience: card.founder?.experience?.toString() ?? "",
      projects: card.founder?.projects?.toString() ?? "",
      satisfaction: card.founder?.satisfaction?.toString() ?? "",
      introText: card.founder?.introText ?? "",
      philosophyText: card.founder?.philosophyText ?? "",
      quote: card.founder?.quote ?? "",
      image: toImageField(card.founder?.imageMediaId, card.founder?.imageUrl),
    },
    services: {
      services: card.services.map((service) => ({
        title: service.title ?? "",
        description: service.description ?? "",
        image: toImageField(service.imageMediaId, service.imageUrl),
      })),
    },
    testimonials: {
      testimonials: card.testimonials.map((testimonial) => ({
        name: testimonial.name ?? "",
        initials: testimonial.initials ?? "",
        text: testimonial.text ?? "",
      })),
    },
    gallery: {
      galleries: card.galleries.map((gallery) => ({
        title: gallery.title ?? "",
        images: gallery.images.map((image) =>
          toImageField(image.imageMediaId, image.imageUrl),
        ),
      })),
    },
  };
}

export function buildSmartCardSubmission(
  values: SmartCardFormValues,
  templateKey: SmartCardTemplateKey,
): { payload: CreateSmartCardPayload; files: SmartCardImageUpload[] } {
  const files: SmartCardImageUpload[] = [];

  const payload: CreateSmartCardPayload = {
    endpoint: values.profile.endpoint.trim(),
    customerId:
      templateKey === "INTERIOR_DESIGN_TEMPLATE_2"
        ? values.customer.customerId
        : undefined,
    profile: {
      companyName: optionalText(values.profile.companyName),
      tagline: optionalText(values.profile.tagline),
      subTagline: optionalText(values.profile.subTagline),
      aboutText: optionalText(values.profile.aboutText),
      logo: resolveImageSlot(
        values.profile.logo,
        SMART_CARD_PROFILE_LOGO_FIELD,
        files,
      ),
    },
    contact: {
      contactNumber: optionalText(values.contact.contactNumber),
      email: optionalText(values.contact.email),
      address: optionalText(values.contact.address),
    },
    socialMedia: {
      whatsapp: optionalText(values.social.whatsapp),
      instagram: optionalText(values.social.instagram),
      facebook: optionalText(values.social.facebook),
      linkedIn: optionalText(values.social.linkedIn),
      twitter: optionalText(values.social.twitter),
      youtube: optionalText(values.social.youtube),
      googleMap: optionalText(values.social.googleMap),
      website: optionalText(values.social.website),
      other: optionalText(values.social.other),
    },
    founder: {
      name: optionalText(values.founder.name),
      title: optionalText(values.founder.title),
      experience: optionalNumber(values.founder.experience),
      projects: optionalNumber(values.founder.projects),
      satisfaction: optionalNumber(values.founder.satisfaction),
      introText: optionalText(values.founder.introText),
      philosophyText: optionalText(values.founder.philosophyText),
      quote: optionalText(values.founder.quote),
      image: resolveImageSlot(
        values.founder.image,
        SMART_CARD_FOUNDER_IMAGE_FIELD,
        files,
      ),
    },
    services: values.services.services.map((service, index) => ({
      title: optionalText(service.title),
      description: optionalText(service.description),
      image: resolveImageSlot(
        service.image,
        smartCardServiceImageField(index),
        files,
      ),
    })),
    testimonials: values.testimonials.testimonials.map((testimonial) => ({
      name: optionalText(testimonial.name),
      initials: optionalText(testimonial.initials),
      text: optionalText(testimonial.text),
    })),
    galleries: values.gallery.galleries.map((gallery, galleryIndex) => ({
      title: optionalText(gallery.title),
      images: gallery.images.map((image, imageIndex) => {
        const slot = resolveImageSlot(
          image,
          smartCardGalleryImageField(galleryIndex, imageIndex),
          files,
        );
        if (!slot) {
          throw new Error("Every gallery photo needs an image.");
        }
        return slot;
      }),
    })),
  };

  return { payload, files };
}
