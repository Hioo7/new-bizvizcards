import { EmailSignatureTemplateKey } from '../../../generated/prisma/client';
import { CorporateEmailSignatureRenderer } from './corporate-email-signature-renderer';
import type { EmailSignatureRenderer } from './email-signature-renderer.interface';
import { MinimalEmailSignatureRenderer } from './minimal-email-signature-renderer';
import { ModernEmailSignatureRenderer } from './modern-email-signature-renderer';

// Plain object registry, not DI-injected — every renderer is a pure class
// with no dependencies (icon URLs are resolved by the service before a
// renderer ever runs), so there's nothing for Nest's container to provide.
export const emailSignatureRendererRegistry: Record<
  EmailSignatureTemplateKey,
  EmailSignatureRenderer
> = {
  MODERN: new ModernEmailSignatureRenderer(),
  CORPORATE: new CorporateEmailSignatureRenderer(),
  MINIMAL: new MinimalEmailSignatureRenderer(),
};
