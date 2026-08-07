import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import * as QRCode from 'qrcode';
import { VirtualBackgroundQrCorner } from '../../../generated/prisma/client';
import { escapeHtml } from '../../../common/utils/html-escape.util';
import {
  VIRTUAL_BACKGROUND_CAPTION_AVG_CHAR_WIDTH_RATIO,
  VIRTUAL_BACKGROUND_CAPTION_FONT_FAMILY,
  VIRTUAL_BACKGROUND_CAPTION_FONT_SIZE_PX,
  VIRTUAL_BACKGROUND_CAPTION_GAP_PX,
  VIRTUAL_BACKGROUND_CAPTION_TEXT_COLOR,
  VIRTUAL_BACKGROUND_CARD_BACKGROUND_COLOR,
  VIRTUAL_BACKGROUND_CARD_CORNER_RADIUS_PX,
  VIRTUAL_BACKGROUND_CARD_PADDING_PX,
  VIRTUAL_BACKGROUND_CORNER_MARGIN_PX,
  VIRTUAL_BACKGROUND_HEIGHT_PX,
  VIRTUAL_BACKGROUND_QR_SIZE_PX,
  VIRTUAL_BACKGROUND_WIDTH_PX,
} from '../virtual-backgrounds.constants';
import { assertVirtualBackgroundImageDimensions } from '../utils/assert-virtual-background-image-dimensions';

export interface ComposeVirtualBackgroundParams {
  baseImageBuffer: Buffer;
  ecardUrl: string;
  qrCorner: VirtualBackgroundQrCorner;
  captionText: string | null;
}

interface CardLayout {
  cardWidth: number;
  cardHeight: number;
  cardLeft: number;
  cardTop: number;
  qrOffsetInCard: number;
}

/**
 * Generates the final 1920x1080 virtual-background PNG once, server-side —
 * never re-rendered on view (the caller uploads and caches the result via
 * MediaService). Composites a QR code (linking to the customer's ecard) and
 * an optional caption, both on a white legibility card, onto one corner of
 * the base image.
 */
@Injectable()
export class VirtualBackgroundComposerService {
  async compose(params: ComposeVirtualBackgroundParams): Promise<Buffer> {
    const baseImage = await this.prepareBaseImage(params.baseImageBuffer);
    const qrBuffer = await this.generateQrCode(params.ecardUrl);
    const layout = this.buildCardLayout(params.qrCorner, params.captionText);
    const cardBuffer = this.buildCardSvg(layout, params.captionText);

    return sharp(baseImage)
      .composite([
        { input: cardBuffer, left: layout.cardLeft, top: layout.cardTop },
        {
          input: qrBuffer,
          left: layout.cardLeft + layout.qrOffsetInCard,
          top: layout.cardTop + layout.qrOffsetInCard,
        },
      ])
      .png()
      .toBuffer();
  }

  private async prepareBaseImage(buffer: Buffer): Promise<Buffer> {
    await assertVirtualBackgroundImageDimensions(buffer);

    return sharp(buffer)
      .resize(VIRTUAL_BACKGROUND_WIDTH_PX, VIRTUAL_BACKGROUND_HEIGHT_PX, {
        fit: 'cover',
      })
      .png()
      .toBuffer();
  }

  private async generateQrCode(url: string): Promise<Buffer> {
    return QRCode.toBuffer(url, {
      type: 'png',
      width: VIRTUAL_BACKGROUND_QR_SIZE_PX,
      margin: 1,
    });
  }

  private buildCardLayout(
    corner: VirtualBackgroundQrCorner,
    captionText: string | null,
  ): CardLayout {
    const captionBlockHeight = captionText
      ? VIRTUAL_BACKGROUND_CAPTION_GAP_PX +
        VIRTUAL_BACKGROUND_CAPTION_FONT_SIZE_PX +
        VIRTUAL_BACKGROUND_CARD_PADDING_PX
      : 0;

    const cardWidth =
      VIRTUAL_BACKGROUND_QR_SIZE_PX + VIRTUAL_BACKGROUND_CARD_PADDING_PX * 2;
    const cardHeight =
      VIRTUAL_BACKGROUND_QR_SIZE_PX +
      VIRTUAL_BACKGROUND_CARD_PADDING_PX * 2 +
      captionBlockHeight;

    const isLeftCorner =
      corner === VirtualBackgroundQrCorner.TOP_LEFT ||
      corner === VirtualBackgroundQrCorner.BOTTOM_LEFT;
    const isTopCorner =
      corner === VirtualBackgroundQrCorner.TOP_LEFT ||
      corner === VirtualBackgroundQrCorner.TOP_RIGHT;

    const cardLeft = isLeftCorner
      ? VIRTUAL_BACKGROUND_CORNER_MARGIN_PX
      : VIRTUAL_BACKGROUND_WIDTH_PX -
        VIRTUAL_BACKGROUND_CORNER_MARGIN_PX -
        cardWidth;
    const cardTop = isTopCorner
      ? VIRTUAL_BACKGROUND_CORNER_MARGIN_PX
      : VIRTUAL_BACKGROUND_HEIGHT_PX -
        VIRTUAL_BACKGROUND_CORNER_MARGIN_PX -
        cardHeight;

    return {
      cardWidth,
      cardHeight,
      cardLeft,
      cardTop,
      qrOffsetInCard: VIRTUAL_BACKGROUND_CARD_PADDING_PX,
    };
  }

  private buildCardSvg(layout: CardLayout, captionText: string | null): Buffer {
    const captionMarkup = captionText
      ? this.buildCaptionMarkup(layout, captionText)
      : '';

    return Buffer.from(
      `<svg width="${layout.cardWidth}" height="${layout.cardHeight}" xmlns="http://www.w3.org/2000/svg">` +
        `<rect width="${layout.cardWidth}" height="${layout.cardHeight}" rx="${VIRTUAL_BACKGROUND_CARD_CORNER_RADIUS_PX}" fill="${VIRTUAL_BACKGROUND_CARD_BACKGROUND_COLOR}" />` +
        `${captionMarkup}` +
        `</svg>`,
    );
  }

  private buildCaptionMarkup(layout: CardLayout, captionText: string): string {
    const maxTextWidth =
      layout.cardWidth - VIRTUAL_BACKGROUND_CARD_PADDING_PX * 2;
    const estimatedTextWidth =
      captionText.length *
      VIRTUAL_BACKGROUND_CAPTION_FONT_SIZE_PX *
      VIRTUAL_BACKGROUND_CAPTION_AVG_CHAR_WIDTH_RATIO;
    // Only forces an exact rendered width (compressing long captions to
    // fit) when the estimate overflows the card — a short caption keeps its
    // natural width instead of being stretched to fill the card.
    const fitAttributes =
      estimatedTextWidth > maxTextWidth
        ? ` textLength="${maxTextWidth}" lengthAdjust="spacingAndGlyphs"`
        : '';

    const textY =
      layout.cardHeight -
      VIRTUAL_BACKGROUND_CARD_PADDING_PX -
      VIRTUAL_BACKGROUND_CAPTION_FONT_SIZE_PX / 2;

    return (
      `<text x="${layout.cardWidth / 2}" y="${textY}" text-anchor="middle" dominant-baseline="middle" ` +
      `font-family="${VIRTUAL_BACKGROUND_CAPTION_FONT_FAMILY}" font-size="${VIRTUAL_BACKGROUND_CAPTION_FONT_SIZE_PX}" ` +
      `font-weight="600" fill="${VIRTUAL_BACKGROUND_CAPTION_TEXT_COLOR}"${fitAttributes}>` +
      `${escapeHtml(captionText)}</text>`
    );
  }
}
