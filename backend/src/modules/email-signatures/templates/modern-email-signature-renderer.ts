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

const ACCENT_COLOR = '#2563eb';
const HEADING_COLOR = '#111827';
const BODY_COLOR = '#374151';
const MUTED_COLOR = '#6b7280';

// Two-column layout: a colored left accent border, profile photo, then
// name/title/contact details. Supports every field slot on the interface.
export class ModernEmailSignatureRenderer implements EmailSignatureRenderer {
  render(input: EmailSignatureRenderInput): string {
    const nameLine = `<div style="font-size:16px;font-weight:bold;color:${HEADING_COLOR};font-family:Arial,Helvetica,sans-serif;">${emailText(input.fullName)}</div>`;

    const titleLineParts = [input.jobTitle, input.company]
      .filter((part): part is string => Boolean(part))
      .map((part) => emailText(part));
    const titleLine = titleLineParts.length
      ? `<div style="font-size:13px;color:${MUTED_COLOR};font-family:Arial,Helvetica,sans-serif;margin-top:2px;">${titleLineParts.join(' &middot; ')}</div>`
      : '';

    const contactRows = [
      input.phone &&
        tr(
          td(
            emailLink(`tel:${input.phone}`, emailText(input.phone)),
            `padding-top:6px;font-size:12px;color:${BODY_COLOR};font-family:Arial,Helvetica,sans-serif;`,
          ),
        ),
      input.email &&
        tr(
          td(
            emailLink(`mailto:${input.email}`, emailText(input.email)),
            `padding-top:2px;font-size:12px;color:${BODY_COLOR};font-family:Arial,Helvetica,sans-serif;`,
          ),
        ),
      input.website &&
        tr(
          td(
            emailLink(input.website, emailText(input.website)),
            `padding-top:2px;font-size:12px;color:${BODY_COLOR};font-family:Arial,Helvetica,sans-serif;`,
          ),
        ),
      input.address &&
        tr(
          td(
            emailText(input.address),
            `padding-top:2px;font-size:12px;color:${MUTED_COLOR};font-family:Arial,Helvetica,sans-serif;`,
          ),
        ),
    ]
      .filter((row): row is string => Boolean(row))
      .join('');
    const contactTable = contactRows
      ? `${tableOpen()}${contactRows}${TABLE_CLOSE}`
      : '';

    const companyLogo = input.companyLogoUrl
      ? `<div style="margin-top:8px;">${emailImage(input.companyLogoUrl, { height: 24, alt: input.company ?? 'Company logo' })}</div>`
      : '';

    const socialRow = input.socialLinks.length
      ? `<div style="margin-top:10px;">${socialLinksRow(input.socialLinks, EMAIL_SIGNATURE_SOCIAL_ICON_SIZE_PX)}</div>`
      : '';

    const profileCell = input.profileImageUrl
      ? td(
          emailImage(input.profileImageUrl, {
            width: 72,
            height: 72,
            alt: input.fullName,
            extraStyle: 'border-radius:50%;',
          }),
          'padding-right:16px;vertical-align:top;',
        )
      : '';

    const detailsCell = td(
      `${nameLine}${titleLine}${contactTable}${companyLogo}${socialRow}`,
      'vertical-align:top;',
    );

    const banner = input.bannerImageUrl
      ? `<div style="margin-top:16px;">${emailImage(input.bannerImageUrl, { extraStyle: 'width:100%;max-width:600px;' })}</div>`
      : '';

    const ctaButton =
      input.ctaText && input.ctaUrl
        ? `<div style="margin-top:16px;">${emailLink(
            input.ctaUrl,
            `<span style="display:inline-block;padding:8px 16px;background-color:${ACCENT_COLOR};color:#ffffff;font-size:12px;font-family:Arial,Helvetica,sans-serif;border-radius:4px;">${emailText(input.ctaText)}</span>`,
            'text-decoration:none;',
          )}</div>`
        : '';

    return (
      `${tableOpen('width="600"', 'max-width:600px;')}` +
      tr(
        td(
          `${tableOpen()}${tr(profileCell + detailsCell)}${TABLE_CLOSE}${banner}${ctaButton}`,
          `border-left:4px solid ${ACCENT_COLOR};padding:4px 0 4px 16px;`,
        ),
      ) +
      TABLE_CLOSE
    );
  }
}
