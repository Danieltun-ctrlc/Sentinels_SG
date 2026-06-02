import { TYPE_CHART } from '../data/typeChart';

export function getEffectiveness(moveType, defenderType) {
  return TYPE_CHART[moveType]?.[defenderType] ?? 1;
}

export function getEffectivenessLabel(multiplier) {
  if (multiplier >= 2) return 'super-effective';
  if (multiplier > 1) return 'effective';
  if (multiplier < 0.5) return 'barely-effective';
  if (multiplier < 1) return 'not-very-effective';
  return 'neutral';
}
