import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../common/config/app-config.service';
import { MediaService } from '../../../common/media/media.service';
import {
  DEFAULT_OG_IMAGE_STORAGE_KEY,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
} from '../../../common/constants/og-preview.constants';
import { escapeHtml } from '../../../common/utils/html-escape.util';
import { toAbsoluteUrl } from '../../../common/utils/absolute-url.util';
import type { PublicEcard } from './ecards.service';
import {
  ECARD_OG_PREVIEW_FALLBACK_TITLE,
  ECARD_PUBLIC_PAGE_PATH_PREFIX,
  ecardOgPreviewFallbackDescription,
} from '../ecard-og-preview.constants';

export interface EcardOgPreviewFields {
  title: string;
  description: string;
  imageUrl: string | null;
}

@Injectable()
export class EcardOgPreviewService {
  constructor(
    private readonly mediaService: MediaService,
    private readonly appConfig: AppConfigService,
  ) {}

  buildFields(card: PublicEcard): EcardOgPreviewFields {
    const title = card.hero.name.trim() || ECARD_OG_PREVIEW_FALLBACK_TITLE;
    const description =
      card.hero.companyName?.trim() || ecardOgPreviewFallbackDescription(title);
    const imageUrl = card.hero.profilePhotoUrl ?? this.defaultImageUrl();

    return { title, description, imageUrl };
  }

  renderHtml(endpoint: string, fields: EcardOgPreviewFields): string {
    const canonicalUrl = `${this.appConfig.publicAppBaseUrl}${ECARD_PUBLIC_PAGE_PATH_PREFIX}/${endpoint}`;
    const imageUrl = toAbsoluteUrl(
      this.appConfig.publicAppBaseUrl,
      fields.imageUrl ?? this.defaultImageUrl(),
    );

    const title = escapeHtml(fields.title);
    const description = escapeHtml(fields.description);
    const url = escapeHtml(canonicalUrl);
    const image = escapeHtml(imageUrl);

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${url}" />

    <meta property="og:type" content="profile" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="${OG_IMAGE_WIDTH}" />
    <meta property="og:image:height" content="${OG_IMAGE_HEIGHT}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
  </head>
  <body>
    <p><a href="${url}">View this e-card</a></p>
  </body>
</html>
`;
  }

  private defaultImageUrl(): string {
    return this.mediaService.getPublicUrlForKey(DEFAULT_OG_IMAGE_STORAGE_KEY);
  }
}
