// Effectiveness multiplier: attacker type → defender type
export const TYPE_CHART = {
  // Defender types attacking
  logic:    { phantom: 1,   illusion: 1,   toxic: 0.5, coercion: 0.5, logic: 1, forensic: 1, network: 1, armor: 1 },
  forensic: { phantom: 2,   illusion: 1,   toxic: 1,   coercion: 1,   logic: 1, forensic: 1, network: 1, armor: 1 },
  network:  { phantom: 1,   illusion: 1,   toxic: 1,   coercion: 2,   logic: 1, forensic: 1, network: 1, armor: 1 },
  armor:    { phantom: 0.25, illusion: 1,   toxic: 2,   coercion: 1,   logic: 1, forensic: 1, network: 1, armor: 1 },
  // Attacker types attacking
  phantom:  { logic: 1,   forensic: 0.5, network: 1,   armor: 2,   phantom: 1, illusion: 1, toxic: 1, coercion: 1 },
  illusion: { logic: 1,   forensic: 0.5, network: 1,   armor: 1,   phantom: 1, illusion: 1, toxic: 1, coercion: 1 },
  toxic:    { logic: 2,   forensic: 1,   network: 1,   armor: 0.5, phantom: 1, illusion: 1, toxic: 1, coercion: 1 },
  coercion: { logic: 2,   forensic: 1,   network: 0.5, armor: 1,   phantom: 1, illusion: 1, toxic: 1, coercion: 1 },
};
