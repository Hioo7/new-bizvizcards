import { ECardHeroLayout } from '../../generated/prisma/client';
import type { EffectiveEcardPolicy } from '../plans/services/plan-policy-resolver.service';

interface EcardWithHeroLayout {
  organisationId: string | null;
  hero: { layout: ECardHeroLayout };
}

// Read-time only, never mutates stored data (mirrors ecard-policy-filter.util.ts's
// convention exactly) — falls back to DEFAULT whenever the stored layout can no
// longer actually render: its organisation was unlinked (ORG_BADGE with no org)
// or the resolved plan no longer allows it (e.g. after a downgrade).
export function resolveEffectiveHeroLayout<TCard extends EcardWithHeroLayout>(
  card: TCard,
  policy: EffectiveEcardPolicy,
): TCard {
  const layout = card.hero.layout;
  const missingRequiredOrganisation =
    layout === ECardHeroLayout.ORG_BADGE && !card.organisationId;
  const noLongerAllowedByPlan = !policy.heroLayouts[layout];

  if (!missingRequiredOrganisation && !noLongerAllowedByPlan) {
    return card;
  }
  return {
    ...card,
    hero: { ...card.hero, layout: ECardHeroLayout.DEFAULT },
  };
}
