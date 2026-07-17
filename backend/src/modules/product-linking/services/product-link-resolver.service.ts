import { Injectable } from '@nestjs/common';
import { MediaService } from '../../../common/media/media.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  LinkedCardType,
  ProductMediaPurpose,
} from '../../../generated/prisma/client';

const RESOLVE_INCLUDE = {
  link: { include: { ecard: true, smartCard: true } },
  product: { include: { media: { include: { media: true } } } },
  variant: {
    include: {
      media: { include: { media: true } },
      product: { include: { media: { include: { media: true } } } },
    },
  },
};

export type ResolveProductUnitResult =
  | { status: 'not_found' }
  | { status: 'linked'; cardType: LinkedCardType; endpoint: string }
  | {
      status: 'unclaimed';
      product: { id: string; name: string };
      variant: { id: string; name: string } | null;
      previewMediaUrl: string | null;
    };

@Injectable()
export class ProductLinkResolverService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  async resolve(code: string): Promise<ResolveProductUnitResult> {
    const unit = await this.prisma.productUnit.findUnique({
      where: { code },
      include: RESOLVE_INCLUDE,
    });
    if (!unit) {
      return { status: 'not_found' };
    }

    if (unit.link) {
      const endpoint =
        unit.link.cardType === LinkedCardType.ECARD
          ? unit.link.ecard?.endpoint
          : unit.link.smartCard?.endpoint;
      // Defensive: ProductUnitLink cascades away when its target card is
      // deleted, so a link row with no resolvable endpoint shouldn't happen.
      if (!endpoint) {
        return { status: 'not_found' };
      }
      return { status: 'linked', cardType: unit.link.cardType, endpoint };
    }

    const product = unit.product ?? unit.variant?.product;
    if (!product) {
      return { status: 'not_found' };
    }

    // Resolution order: variant-level PREVIEW media wins, else fall back to
    // the product-level one.
    const variantPreview = unit.variant?.media.find(
      (entry) => entry.purpose === ProductMediaPurpose.PREVIEW,
    );
    const productPreview = product.media.find(
      (entry) => entry.purpose === ProductMediaPurpose.PREVIEW,
    );
    const previewEntry = variantPreview ?? productPreview;

    return {
      status: 'unclaimed',
      product: { id: product.id, name: product.name },
      variant: unit.variant
        ? { id: unit.variant.id, name: unit.variant.name }
        : null,
      previewMediaUrl: previewEntry
        ? this.mediaService.getPublicUrl(previewEntry.media)
        : null,
    };
  }
}
