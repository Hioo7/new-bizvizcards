import { randomInt } from 'crypto';
import {
  PRODUCT_VARIANT_SKU_PREFIX,
  PRODUCT_VARIANT_SKU_RANDOM_ALPHABET,
  PRODUCT_VARIANT_SKU_RANDOM_LENGTH,
} from '../products.constants';

export function generateVariantSkuCandidate(): string {
  let random = '';
  for (let i = 0; i < PRODUCT_VARIANT_SKU_RANDOM_LENGTH; i++) {
    random += PRODUCT_VARIANT_SKU_RANDOM_ALPHABET.charAt(
      randomInt(PRODUCT_VARIANT_SKU_RANDOM_ALPHABET.length),
    );
  }
  return `${PRODUCT_VARIANT_SKU_PREFIX}${random}`;
}
