import { ECardComponentType } from '../../generated/prisma/client';
import type {
  OrganisationEcardTemplateComponentResponse,
  OrganisationEcardTemplateResponse,
} from '../organisations/services/organisation-ecard-template.service';
import type {
  EcardComponentResponse,
  PublicEcard,
} from './services/ecards.service';

/**
 * Merges an organisation's e-card template onto a card linked to that
 * organisation — read-time only, never mutates stored data (mirrors
 * ecard-policy-filter.util.ts's convention exactly).
 *
 * The template is authoritative over the card's *structure*: the merged
 * component list is always exactly the template's own set of component
 * types, in the template's own order — a "uniform" every linked member's
 * card conforms to. A card's own component whose type isn't in the
 * template is dropped entirely, even if the customer has data in it; a
 * type the template adds that the card doesn't have is injected. Adding or
 * removing a type from the template therefore adds or removes it from
 * every linked card immediately, with no per-card bookkeeping.
 *
 * Within a type both sides share, the *content* merges field by field:
 * every hero field and every scalar component field is independent —
 * wherever the template defines a value it wins, wherever it doesn't the
 * card's own value shows through. Gallery/Team/Brochure aren't
 * field-mergeable (list-shaped or single-media), so the template's version
 * replaces the card's own wholesale, but only when it actually has content
 * — an empty template component defers to what the customer already has
 * for that same type. Hero fields merge independently of the component
 * structure above, since every card always has exactly one hero.
 */
export function mergeOrganisationEcardTemplateOntoCard(
  card: PublicEcard,
  template: OrganisationEcardTemplateResponse | null,
): PublicEcard {
  if (!template) {
    return card;
  }

  return {
    ...card,
    hero: {
      ...card.hero,
      name: template.hero.name ?? card.hero.name,
      email: template.hero.email ?? card.hero.email,
      companyName: template.hero.companyName ?? card.hero.companyName,
      profilePhotoMediaId:
        template.hero.profilePhotoMediaId ?? card.hero.profilePhotoMediaId,
      profilePhotoUrl:
        template.hero.profilePhotoUrl ?? card.hero.profilePhotoUrl,
      phoneCountryDialCode:
        template.hero.phoneCountryDialCode ?? card.hero.phoneCountryDialCode,
      phoneNumber: template.hero.phoneNumber ?? card.hero.phoneNumber,
    },
    components: mergeComponents(card.components, template.components),
  };
}

function mergeComponents(
  cardComponents: EcardComponentResponse[],
  templateComponents: OrganisationEcardTemplateComponentResponse[],
): EcardComponentResponse[] {
  const cardByType = new Map(
    cardComponents.map((component) => [component.type, component]),
  );

  // The template's own type set and order is the definitive structure —
  // a card-only type that isn't in the template is excluded, never carried
  // through, since the template defines the full "uniform" of components.
  return templateComponents.map((templateComponent, index) => ({
    ...mergeOneComponent(
      cardByType.get(templateComponent.type),
      templateComponent,
    ),
    order: index,
  }));
}

function mergeOneComponent(
  cardComponent: EcardComponentResponse | undefined,
  templateComponent: OrganisationEcardTemplateComponentResponse,
): EcardComponentResponse {
  if (!cardComponent || cardComponent.type !== templateComponent.type) {
    return templateComponentToCardComponent(templateComponent);
  }

  if (cardComponent.type === 'ABOUT' && templateComponent.type === 'ABOUT') {
    return {
      ...cardComponent,
      profession: templateComponent.profession ?? cardComponent.profession,
      shortNote: templateComponent.shortNote ?? cardComponent.shortNote,
      description: templateComponent.description ?? cardComponent.description,
      aboutMe: templateComponent.aboutMe ?? cardComponent.aboutMe,
    };
  }
  if (
    cardComponent.type === 'SOCIAL_LINKS' &&
    templateComponent.type === 'SOCIAL_LINKS'
  ) {
    return {
      ...cardComponent,
      website: templateComponent.website ?? cardComponent.website,
      instagram: templateComponent.instagram ?? cardComponent.instagram,
      facebook: templateComponent.facebook ?? cardComponent.facebook,
      twitter: templateComponent.twitter ?? cardComponent.twitter,
      linkedIn: templateComponent.linkedIn ?? cardComponent.linkedIn,
    };
  }
  if (cardComponent.type === 'VIDEO' && templateComponent.type === 'VIDEO') {
    return {
      ...cardComponent,
      title: templateComponent.title ?? cardComponent.title,
      videoUrl: templateComponent.videoUrl ?? cardComponent.videoUrl,
    };
  }
  if (
    cardComponent.type === 'WHATSAPP' &&
    templateComponent.type === 'WHATSAPP'
  ) {
    return {
      ...cardComponent,
      phoneCountryDialCode:
        templateComponent.phoneCountryDialCode ??
        cardComponent.phoneCountryDialCode,
      phoneNumber: templateComponent.phoneNumber ?? cardComponent.phoneNumber,
    };
  }
  if (
    cardComponent.type === 'GALLERY' &&
    templateComponent.type === 'GALLERY'
  ) {
    return templateComponent.subGalleries.length > 0
      ? templateComponentToCardComponent(templateComponent)
      : cardComponent;
  }
  if (cardComponent.type === 'TEAM' && templateComponent.type === 'TEAM') {
    return templateComponent.members.length > 0
      ? templateComponentToCardComponent(templateComponent)
      : cardComponent;
  }
  if (
    cardComponent.type === 'BROCHURE' &&
    templateComponent.type === 'BROCHURE'
  ) {
    return templateComponent.pdfMediaId
      ? templateComponentToCardComponent(templateComponent)
      : cardComponent;
  }

  // Unreachable — the guard above already confirmed matching types — but
  // keeps every branch typed without a cast.
  return cardComponent;
}

function templateComponentToCardComponent(
  templateComponent: OrganisationEcardTemplateComponentResponse,
): EcardComponentResponse {
  const base = { id: templateComponent.id, order: templateComponent.order };

  switch (templateComponent.type) {
    case ECardComponentType.ABOUT:
      return {
        ...base,
        type: ECardComponentType.ABOUT,
        profession: templateComponent.profession,
        shortNote: templateComponent.shortNote,
        description: templateComponent.description,
        aboutMe: templateComponent.aboutMe,
      };
    case ECardComponentType.SOCIAL_LINKS:
      return {
        ...base,
        type: ECardComponentType.SOCIAL_LINKS,
        website: templateComponent.website,
        instagram: templateComponent.instagram,
        facebook: templateComponent.facebook,
        twitter: templateComponent.twitter,
        linkedIn: templateComponent.linkedIn,
      };
    case ECardComponentType.VIDEO:
      return {
        ...base,
        type: ECardComponentType.VIDEO,
        title: templateComponent.title,
        videoUrl: templateComponent.videoUrl,
      };
    case ECardComponentType.WHATSAPP:
      return {
        ...base,
        type: ECardComponentType.WHATSAPP,
        phoneCountryDialCode: templateComponent.phoneCountryDialCode,
        phoneNumber: templateComponent.phoneNumber,
      };
    case ECardComponentType.GALLERY:
      return {
        ...base,
        type: ECardComponentType.GALLERY,
        subGalleries: templateComponent.subGalleries,
      };
    case ECardComponentType.TEAM:
      return {
        ...base,
        type: ECardComponentType.TEAM,
        title: templateComponent.title,
        members: templateComponent.members,
      };
    case ECardComponentType.BROCHURE:
      return {
        ...base,
        type: ECardComponentType.BROCHURE,
        pdfMediaId: templateComponent.pdfMediaId,
        pdfUrl: templateComponent.pdfUrl,
        fileName: templateComponent.fileName,
      };
  }
}
