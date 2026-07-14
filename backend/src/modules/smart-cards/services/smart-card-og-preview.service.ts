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
import type { PublicSmartCard } from './smart-cards.service';
import {
  ogPreviewFieldsRegistry,
  type OgPreviewFields,
} from '../templates/og-preview-registry';
import { SMART_CARD_PUBLIC_PAGE_PATH_PREFIX } from '../smart-card-og-preview.constants';

@Injectable()
export class SmartCardOgPreviewService {
  constructor(
    private readonly mediaService: MediaService,
    private readonly appConfig: AppConfigService,
  ) {}

  buildFields(card: PublicSmartCard): OgPreviewFields {
    const extractor = ogPreviewFieldsRegistry[card.templateKey];
    const fields = extractor(card);

    return {
      ...fields,
      imageUrl: fields.imageUrl ?? this.defaultImageUrl(),
    };
  }

  renderHtml(endpoint: string, fields: OgPreviewFields): string {
    const canonicalUrl = `${this.appConfig.publicAppBaseUrl}${SMART_CARD_PUBLIC_PAGE_PATH_PREFIX}/${endpoint}`;
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

    <meta property="og:type" content="website" />
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
    <p><a href="${url}">View this business card</a></p>
  </body>
</html>
`;
  }

  private defaultImageUrl(): string {
    return this.mediaService.getPublicUrlForKey(DEFAULT_OG_IMAGE_STORAGE_KEY);
  }
}
