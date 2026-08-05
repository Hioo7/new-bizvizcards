import { EmailSignatureSocialPlatform } from '../../../generated/prisma/client';

export interface EmailSignatureSocialLinkRenderInput {
  platform: EmailSignatureSocialPlatform;
  url: string;
  label?: string;
  // Resolved by the service (via MediaService.getPublicUrlForKey) before the
  // renderer ever sees this input — keeps every renderer a pure,
  // dependency-free class. Undefined for CUSTOM, which has no brand icon.
  iconUrl?: string;
}

// Every field a signature can carry, already resolved to plain values
// (image fields are public URLs, not Media rows/upload slots) — the same
// shape whether the caller is a real create/update or the non-persisting
// preview endpoint.
export interface EmailSignatureRenderInput {
  fullName: string;
  jobTitle?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  ctaText?: string;
  ctaUrl?: string;
  profileImageUrl?: string;
  companyLogoUrl?: string;
  bannerImageUrl?: string;
  socialLinks: EmailSignatureSocialLinkRenderInput[];
}

// Strategy interface — one implementation per EmailSignatureTemplateKey,
// selected via the registry. Every implementation must render every field
// slot on this interface; a template that deliberately can't fit a slot
// (e.g. Minimal omitting a banner) documents that as an explicit decision
// in its own renderer, not as a missing switch case.
export interface EmailSignatureRenderer {
  render(input: EmailSignatureRenderInput): string;
}
