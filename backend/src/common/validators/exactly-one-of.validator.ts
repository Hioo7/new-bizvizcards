/** True when exactly one of the given values is defined (not undefined/null) — used for "exactly one of N" mutually exclusive fields. */
export function isExactlyOneDefined(...values: unknown[]): boolean {
  return (
    values.filter((value) => value !== undefined && value !== null).length === 1
  );
}
