import { ECardComponentType } from '../../generated/prisma/client';
import type { EffectiveEcardPolicy } from '../plans/services/plan-policy-resolver.service';

interface EcardWithComponents {
  components: Array<{ type: ECardComponentType }>;
}

// Whole-page availability is handled separately (404 before this runs) — this
// only drops components the effective policy doesn't currently whitelist,
// leaving the card's own data untouched (grandfathering applies to counts,
// not to what's rendered).
export function filterEcardComponentsByPolicy<
  TCard extends EcardWithComponents,
>(card: TCard, policy: EffectiveEcardPolicy): TCard {
  return {
    ...card,
    components: card.components.filter(
      (component) => policy.components[component.type],
    ),
  };
}
