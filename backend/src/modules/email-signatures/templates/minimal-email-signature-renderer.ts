import {
  emailImage,
  emailLink,
  emailText,
  socialLinksRow,
  TABLE_CLOSE,
  tableOpen,
  td,
  tr,
} from '../utils/email-html-builder';
import { EMAIL_SIGNATURE_SOCIAL_ICON_SIZE_PX } from '../email-signatures.constants';
import type {
  EmailSignatureRenderer,
  EmailSignatureRenderInput,
} from './email-signature-renderer.interface';

const HEADING_COLOR = '#111827';
const BODY_COLOR = '#4b5563';
const SEPARATOR = '<span style="color:#9ca3af;">&nbsp;|&nbsp;</span>';

// Single-line, text-first layout — the deliberately minimal option. It
// renders profile image and company logo as small inline elements (they fit
// a compact avatar/wordmark role fine), and still renders social icons in a
// compact row beneath the line, but — as a deliberate design decision, not a
// missing switch case — never renders bannerImage or a CTA button: a wide
// promotional banner or a call-to-action button contradicts a one-line
// signature's whole reason to exist.
export class MinimalEmailSignatureRenderer implements EmailSignatureRenderer {
  render(input: EmailSignatureRenderInput): string {
    const avatar = input.profileImageUrl
      ? td(
          emailImage(input.profileImageUrl, {
            width: 32,
            height: 32,
            alt: input.fullName,
            extraStyle: 'border-radius:50%;',
          }),
          'padding-right:10px;vertical-align:middle;',
        )
      : '';

    const lineParts = [
      `<b style="color:${HEADING_COLOR};">${emailText(input.fullName)}</b>`,
      input.jobTitle && emailText(input.jobTitle),
      input.company && emailText(input.company),
      input.phone && emailLink(`tel:${input.phone}`, emailText(input.phone)),
      input.email && emailLink(`mailto:${input.email}`, emailText(input.email)),
      input.website && emailLink(input.website, emailText(input.website)),
    ].filter((part): part is string => Boolean(part));

    const textLine = `<div style="font-size:12px;color:${BODY_COLOR};font-family:Arial,Helvetica,sans-serif;">${lineParts.join(SEPARATOR)}</div>`;
    const addressLine = input.address
      ? `<div style="font-size:11px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif;margin-top:2px;">${emailText(input.address)}</div>`
      : '';

    const logo = input.companyLogoUrl
      ? td(
          emailImage(input.companyLogoUrl, {
            height: 20,
            alt: input.company ?? 'Company logo',
          }),
          'padding-left:10px;vertical-align:middle;',
        )
      : '';

    const socialRow = input.socialLinks.length
      ? `<div style="margin-top:6px;">${socialLinksRow(input.socialLinks, EMAIL_SIGNATURE_SOCIAL_ICON_SIZE_PX - 4)}</div>`
      : '';

    const textCell = td(
      `${textLine}${addressLine}${socialRow}`,
      'vertical-align:middle;',
    );

    return (
      `${tableOpen('width="480"', 'max-width:480px;')}` +
      tr(`${avatar}${textCell}${logo}`) +
      TABLE_CLOSE
    );
  }
}
