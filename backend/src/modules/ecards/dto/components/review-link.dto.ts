import { z } from 'zod';
import { ECARD_REVIEW_LINK_URL_MAX_LENGTH } from '../../ecards.constants';

// Required — same "an empty one would make the component meaningless"
// reasoning as ecardWhatsAppComponentSchema. Not Google-specific: just a URL
// the visitor is redirected to (typically a Google review link).
export const ecardReviewLinkComponentSchema = z
  .object({
    type: z.literal('REVIEW_LINK'),
    url: z.url().max(ECARD_REVIEW_LINK_URL_MAX_LENGTH),
  })
  .strict();

export type EcardReviewLinkComponentDto = z.infer<
  typeof ecardReviewLinkComponentSchema
>;
