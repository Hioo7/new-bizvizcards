import { escapeHtml } from '../../../common/utils/html-escape.util';

const ALLOWED_URL_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);

// Escape-at-construction-time safety boundary for every href/src the
// renderers embed — replaces legacy's after-the-fact DOMPurify pass. Returns
// undefined (never throws) so a renderer can simply omit the attribute for
// an unsafe/invalid URL rather than failing the whole render.
export function sanitizeUrlForHtmlAttribute(
  url: string | undefined,
): string | undefined {
  if (!url) {
    return undefined;
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }
  if (!ALLOWED_URL_SCHEMES.has(parsed.protocol)) {
    return undefined;
  }
  // Escaped for safe embedding inside an HTML attribute value (e.g. `&` in a
  // query string must become `&amp;`).
  return escapeHtml(url);
}
