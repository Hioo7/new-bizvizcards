import { downloadBlob } from "@utils/downloadBlob";

export function downloadLeadsExportFile(blob: Blob): void {
  downloadBlob(blob, `leads-${Date.now()}.xlsx`);
}
