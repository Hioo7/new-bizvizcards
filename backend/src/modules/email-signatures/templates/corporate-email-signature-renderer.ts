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
const BODY_COLOR = '#374151';
const MUTED_COLOR = '#6b7280';
const DIVIDER_COLOR = '#d1d5db';
const ACCENT_COLOR = '#0f766e';

// Stacked layout: logo on top, name/title, a divider rule, then labeled
// contact rows (T:/E:/W:). Supports every field slot on the interface.
export class CorporateEmailSignatureRenderer implements EmailSignatureRenderer {
  render(input: EmailSignatureRenderInput): string {
    const logo = input.companyLogoUrl
      ? `<div style="margin-bottom:8px;">${emailImage(input.companyLogoUrl, { height: 32, alt: input.company ?? 'Company logo' })}</div>`
      : '';

    const nameLine = `<div style="font-size:15px;font-weight:bold;color:${HEADING_COLOR};font-family:Arial,Helvetica,sans-serif;">${emailText(input.fullName)}</div>`;

    const titleLineParts = [input.jobTitle, input.company]
      .filter((part): part is string => Boolean(part))
      .map((part) => emailText(part));
    const titleLine = titleLineParts.length
      ? `<div style="font-size:12px;color:${MUTED_COLOR};font-family:Arial,Helvetica,sans-serif;margin-top:1px;">${titleLineParts.join(' | ')}</div>`
      : '';

    const divider = `<div style="border-top:1px solid ${DIVIDER_COLOR};margin:8px 0;width:100%;max-width:400px;"></div>`;

    const labeledRow = (label: string, valueHtml: string) =>
      valueHtml
        ? tr(
            td(
              `<span style="color:${MUTED_COLOR};">${label}</span>&nbsp;${valueHtml}`,
              `font-size:12px;color:${BODY_COLOR};font-family:Arial,Helvetica,sans-serif;padding-top:2px;`,
            ),
          )
        : '';

    const contactRows =
      labeledRow(
        'T:',
        input.phone
          ? emailLink(`tel:${input.phone}`, emailText(input.phone))
          : '',
      ) +
      labeledRow(
        'E:',
        input.email
          ? emailLink(`mailto:${input.email}`, emailText(input.email))
          : '',
      ) +
      labeledRow(
        'W:',
        input.website ? emailLink(input.website, emailText(input.website)) : '',
      ) +
      labeledRow('A:', input.address ? emailText(input.address) : '');
    const contactTable = contactRows
      ? `${tableOpen()}${contactRows}${TABLE_CLOSE}`
      : '';

    const socialRow = input.socialLinks.length
      ? `<div style="margin-top:10px;">${socialLinksRow(input.socialLinks, EMAIL_SIGNATURE_SOCIAL_ICON_SIZE_PX)}</div>`
      : '';

    const banner = input.bannerImageUrl
      ? `<div style="margin-top:12px;">${emailImage(input.bannerImageUrl, { extraStyle: 'width:100%;max-width:500px;' })}</div>`
      : '';

    const ctaButton =
      input.ctaText && input.ctaUrl
        ? `<div style="margin-top:12px;">${emailLink(
            input.ctaUrl,
            `<span style="display:inline-block;padding:7px 14px;background-color:${ACCENT_COLOR};color:#ffffff;font-size:11px;font-family:Arial,Helvetica,sans-serif;border-radius:3px;">${emailText(input.ctaText)}</span>`,
            'text-decoration:none;',
          )}</div>`
        : '';

    return (
      `${tableOpen('width="500"', 'max-width:500px;')}` +
      tr(
        td(
          `${logo}${nameLine}${titleLine}${divider}${contactTable}${socialRow}${banner}${ctaButton}`,
        ),
      ) +
      TABLE_CLOSE
    );
  }
}
