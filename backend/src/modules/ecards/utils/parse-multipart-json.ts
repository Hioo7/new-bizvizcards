import { BadRequestException } from '@nestjs/common';
import type { ZodType } from 'zod';

export function parseMultipartJson<T>(schema: ZodType<T>, rawData: string): T {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawData) as unknown;
  } catch {
    throw new BadRequestException('Invalid JSON in "data" field');
  }
  const result = schema.safeParse(parsedJson);
  if (!result.success) {
    throw new BadRequestException(result.error.issues);
  }
  return result.data;
}
