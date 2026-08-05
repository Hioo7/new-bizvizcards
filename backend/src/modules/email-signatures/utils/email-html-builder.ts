import { escapeHtml } from '../../../common/utils/html-escape.util';
import { EMAIL_SIGNATURE_SOCIAL_PLATFORM_LABEL } from '../email-signatures.constants';
import type { EmailSignatureSocialLinkRenderInput } from '../templates/email-signature-renderer.interface';
import { sanitizeUrlForHtmlAttribute } from './email-html-sanitize.util';

// Small, focused helpers for building email-client-safe HTML (old-school
// table layout, inline CSS — no flexbox/grid, which most email clients
// strip or mis-render). Every helper here is the one place user text/URLs
// get embedded, so every text interpolation is escaped and every URL is
// scheme-checked before it ever reaches the output string.

export function emailText(value: string | undefined): string {
  return value ? escapeHtml(value) : '';
}

export function emailLink(
  href: string | undefined,
  innerHtml: string,
  style = 'color:inherit;text-decoration:none;',
): string {
  const safeHref = sanitizeUrlForHtmlAttribute(href);
  if (!safeHref || !innerHtml) {
    return innerHtml;
  }
  return `<a href="${safeHref}" style="${style}" target="_blank" rel="noopener noreferrer">${innerHtml}</a>`;
}

export interface EmailImageOptions {
  width?: number;
  height?: number;
  alt?: string;
  extraStyle?: string;
}

export function emailImage(
  src: string | undefined,
  options: EmailImageOptions = {},
): string {
  const safeSrc = sanitizeUrlForHtmlAttribute(src);
  if (!safeSrc) {
    return '';
  }
  const width = options.width !== undefined ? ` width="${options.width}"` : '';
  const height =
    options.height !== undefined ? ` height="${options.height}"` : '';
  const alt = ` alt="${escapeHtml(options.alt ?? '')}"`;
  const style = `display:block;border:0;${options.extraStyle ?? ''}`;
  return `<img src="${safeSrc}"${width}${height}${alt} style="${style}">`;
}

export function tableOpen(attrs = 'width="100%"', style = ''): string {
  const styleAttr = style ? ` style="${style}"` : '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" ${attrs}${styleAttr}>`;
}

export const TABLE_CLOSE = '</table>';

export function tr(innerHtml: string): string {
  return `<tr>${innerHtml}</tr>`;
}

export function td(innerHtml: string, style = ''): string {
  const styleAttr = style ? ` style="${style}"` : '';
  return `<td${styleAttr}>${innerHtml}</td>`;
}

// Shared across every renderer — a horizontal row of social links, each a
// clickable icon image (the fix for legacy's plain-text-label "icons").
// Falls back to small text (the platform's display label) only when there's
// no icon to show, i.e. CUSTOM links.
export function socialLinksRow(
  socialLinks: EmailSignatureSocialLinkRenderInput[],
  iconSizePx: number,
): string {
  if (socialLinks.length === 0) {
    return '';
  }
  const cells = socialLinks
    .map((link) => {
      const label =
        link.label ?? EMAIL_SIGNATURE_SOCIAL_PLATFORM_LABEL[link.platform];
      const content = link.iconUrl
        ? emailImage(link.iconUrl, {
            width: iconSizePx,
            height: iconSizePx,
            alt: label,
          })
        : `<span style="font-size:11px;color:#555555;">${emailText(label)}</span>`;
      return td(emailLink(link.url, content), 'padding:0 8px 0 0;');
    })
    .join('');
  return `${tableOpen('cellpadding="0" cellspacing="0" border="0"')}${tr(cells)}${TABLE_CLOSE}`;
}
