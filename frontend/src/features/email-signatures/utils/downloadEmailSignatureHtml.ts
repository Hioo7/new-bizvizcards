import DOMPurify from "dompurify";

const DOWNLOAD_FILE_NAME = "email-signature.html";

export function downloadEmailSignatureHtml(html: string): void {
  const safeHtml = DOMPurify.sanitize(html);
  const document_ = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${safeHtml}</body></html>`;
  const blob = new Blob([document_], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = DOWNLOAD_FILE_NAME;
  link.click();

  URL.revokeObjectURL(url);
}
