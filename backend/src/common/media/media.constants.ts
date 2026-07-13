import { MediaSource } from '../../generated/prisma/client';

export const DEFAULT_MEDIA_SOURCE = MediaSource.MINIO;

export const MEDIA_PUBLIC_PATH_PREFIX = '/media';

/**
 * Anonymous-read policy for a bucket: every object under it is publicly
 * downloadable (uploads themselves still require the backend's credentials).
 * Applied on startup so a freshly created bucket is never left private —
 * without it, `getPublicUrl()` links resolve but every GET 403s.
 */
export function buildPublicReadBucketPolicy(bucket: string): string {
  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: '*',
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  });
}
