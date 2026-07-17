import type { ProductUnit } from "@app-types/product.types";

export function downloadPrintBatchCsv(
  printBatchId: string,
  units: ProductUnit[],
): void {
  const rows = ["code,url", ...units.map((unit) => `${unit.code},${unit.url}`)];
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `print-batch-${printBatchId}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
