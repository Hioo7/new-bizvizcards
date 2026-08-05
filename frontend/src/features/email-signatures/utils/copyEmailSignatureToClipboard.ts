import DOMPurify from "dompurify";

// Writes both text/html and text/plain simultaneously so pasting into
// Gmail/Outlook Web/Apple Mail etc. preserves rich formatting. Falls back to
// a plain-text clipboard write on browsers without ClipboardItem support.
// Sanitized client-side (defense in depth on top of the backend's own
// escape-at-construction-time safety) before it ever touches the clipboard
// or the DOM.
export async function copyEmailSignatureRichText(html: string): Promise<void> {
  const safeHtml = DOMPurify.sanitize(html);
  if (typeof ClipboardItem !== "undefined") {
    const htmlBlob = new Blob([safeHtml], { type: "text/html" });
    const textBlob = new Blob([stripHtml(safeHtml)], { type: "text/plain" });
    await navigator.clipboard.write([
      new ClipboardItem({ "text/html": htmlBlob, "text/plain": textBlob }),
    ]);
    return;
  }
  await navigator.clipboard.writeText(safeHtml);
}

export async function copyEmailSignatureRawHtml(html: string): Promise<void> {
  await navigator.clipboard.writeText(DOMPurify.sanitize(html));
}

function stripHtml(html: string): string {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container.textContent ?? "";
}
