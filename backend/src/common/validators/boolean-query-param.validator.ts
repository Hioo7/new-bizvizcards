import { z } from 'zod';

/**
 * Parses a "true"/"false" query-string param into a boolean. z.coerce.boolean()
 * is unsafe for this: it does `Boolean(value)`, and `Boolean("false")` is
 * `true` (any non-empty string is truthy), silently inverting the filter.
 */
export const booleanQueryParamSchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');
