/** True when both values are provided or both are omitted — used to keep paired fields (e.g. lat/lng) in sync. */
export function isPairedOrBothAbsent(a: unknown, b: unknown): boolean {
  return (a === undefined) === (b === undefined);
}
