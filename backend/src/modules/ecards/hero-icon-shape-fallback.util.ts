import { ECardIconShape } from '../../generated/prisma/client';
import type { EffectiveEcardPolicy } from '../plans/services/plan-policy-resolver.service';

interface EcardWithIconShape {
  hero: { iconShape: ECardIconShape };
}

// Read-time only, never mutates stored data (mirrors hero-layout-fallback.util.ts's
// convention exactly) — falls back to CIRCLE whenever the stored icon shape is no
// longer allowed by the resolved plan (e.g. after a downgrade).
export function resolveEffectiveIconShape<TCard extends EcardWithIconShape>(
  card: TCard,
  policy: EffectiveEcardPolicy,
): TCard {
  if (policy.iconShapes[card.hero.iconShape]) {
    return card;
  }
  return {
    ...card,
    hero: { ...card.hero, iconShape: ECardIconShape.CIRCLE },
  };
}
