/**
 * Downloads a same-origin URL via a synthetic `<a download>` click instead
 * of a real navigation. Unlike `window.location.href = url`, this never
 * takes the current page anywhere — desktop browsers special-case a handful
 * of download-like content types (e.g. vCard) enough to mask that
 * difference, but mobile Chrome does not, and a real navigation to an
 * `inline`-disposed response with no renderer for its content type just
 * leaves the visitor on a blank page with no way back.
 */
export function downloadFile(url: string, filename?: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename ?? "";
  document.body.appendChild(link);
  link.click();
  link.remove();
}
