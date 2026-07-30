import type { EffectiveEcardPolicy } from '../plans/services/plan-policy-resolver.service';

interface EcardWithAccentColors {
  hero: {
    primaryAccentColor: string | null;
    secondaryAccentColor: string | null;
  };
}

// Read-time only, never mutates stored data (mirrors hero-layout-fallback.util.ts's
// convention exactly) — falls back to null/null (theme-inherited) whenever the
// stored pair is no longer allowed: it doesn't match one of the resolved
// policy's own presets, and full custom-color access is no longer granted
// (e.g. after a downgrade, or a preset the pair used to match was removed
// from the plan).
export function resolveEffectiveAccentColors<
  TCard extends EcardWithAccentColors,
>(card: TCard, policy: EffectiveEcardPolicy): TCard {
  const { primaryAccentColor, secondaryAccentColor } = card.hero;
  if (!primaryAccentColor && !secondaryAccentColor) {
    return card;
  }

  const matchesPreset = policy.accentColorPresets.some(
    (preset) =>
      preset.primaryColor === primaryAccentColor &&
      preset.secondaryColor === secondaryAccentColor,
  );
  if (matchesPreset || policy.accentColorCustomizationAvailable) {
    return card;
  }

  return {
    ...card,
    hero: {
      ...card.hero,
      primaryAccentColor: null,
      secondaryAccentColor: null,
    },
  };
}
