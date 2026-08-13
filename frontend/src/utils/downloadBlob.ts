import { BLOB_DOWNLOAD_REVOKE_DELAY_MS } from "@config/fileDownload.config";
import { downloadFile } from "@utils/downloadFile";

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  downloadFile(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), BLOB_DOWNLOAD_REVOKE_DELAY_MS);
}
