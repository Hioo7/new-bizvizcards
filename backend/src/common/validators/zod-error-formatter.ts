import { HttpStatus } from '@nestjs/common';
import type { ZodError } from 'zod';
import {
  HTTP_BAD_REQUEST_ERROR_LABEL,
  VALIDATION_FAILED_MESSAGE,
} from '../constants/validation.constants';

export interface ZodFieldError {
  field: string;
  message: string;
}

export interface FormattedZodError {
  statusCode: number;
  error: string;
  message: string;
  fieldErrors: ZodFieldError[];
}

function humanizeFieldLabel(field: string): string {
  const lastSegment = field.split('.').pop() ?? field;
  const spaced = lastSegment
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Formats a Zod validation failure into a structured, field-addressable response body
 * instead of Nest's default `{statusCode,message:"Bad Request"}` — callers pass this
 * directly as the `BadRequestException` constructor argument. */
export function formatZodError(error: ZodError): FormattedZodError {
  const fieldErrors: ZodFieldError[] = error.issues.map((issue) => {
    const field = issue.path.join('.') || '(root)';
    const message =
      issue.code === 'invalid_type'
        ? `${humanizeFieldLabel(field)} is required`
        : issue.message;
    return { field, message };
  });

  return {
    statusCode: HttpStatus.BAD_REQUEST,
    error: HTTP_BAD_REQUEST_ERROR_LABEL,
    message: VALIDATION_FAILED_MESSAGE,
    fieldErrors,
  };
}
