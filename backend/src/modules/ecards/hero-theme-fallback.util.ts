import { ECardTheme } from '../../generated/prisma/client';
import type { EffectiveEcardPolicy } from '../plans/services/plan-policy-resolver.service';

interface EcardWithHeroTheme {
  hero: { theme: ECardTheme };
}

// Read-time only, never mutates stored data (mirrors hero-layout-fallback.util.ts's
// convention exactly) — falls back to DEFAULT_DARK whenever the stored theme is no
// longer allowed by the resolved plan (e.g. after a downgrade).
export function resolveEffectiveTheme<TCard extends EcardWithHeroTheme>(
  card: TCard,
  policy: EffectiveEcardPolicy,
): TCard {
  if (policy.themes[card.hero.theme]) {
    return card;
  }
  return {
    ...card,
    hero: { ...card.hero, theme: ECardTheme.DEFAULT_DARK },
  };
}
