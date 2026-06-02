export const ABILITIES = {
  critical_thinker: {
    id: 'critical_thinker',
    name: 'Critical Thinker',
    description: 'Immune to ATK drops from status moves.',
    trigger: 'always_active',
  },
  cognitive_bias_detector: {
    id: 'cognitive_bias_detector',
    name: 'Cognitive Bias Detector',
    description: 'Incoming damage on Turn 1 reduced by 25%.',
    trigger: 'turn_1',
  },
  zero_trust: {
    id: 'zero_trust',
    name: 'Zero Trust',
    description: 'First attack received deals 50% less damage.',
    trigger: 'first_attack',
  },
  air_gapped: {
    id: 'air_gapped',
    name: 'Air-Gapped',
    description: 'Immune to Network-type status moves.',
    trigger: 'always_active',
  },
  viral_reach: {
    id: 'viral_reach',
    name: 'Viral Reach',
    description: 'Network-type attacks deal 20% more damage.',
    trigger: 'on_move',
  },
  spam_filter: {
    id: 'spam_filter',
    name: 'Spam Filter',
    description: 'Immune to first attack each battle.',
    trigger: 'first_attack',
  },
  packet_sniffer: {
    id: 'packet_sniffer',
    name: 'Packet Sniffer',
    description: 'Reveals enemy next move in battle log.',
    trigger: 'always_active',
  },
  data_backup: {
    id: 'data_backup',
    name: 'Data Backup',
    description: 'Restore 25% HP once when HP drops below 25%.',
    trigger: 'on_low_hp',
  },
  false_legitimacy: {
    id: 'false_legitimacy',
    name: 'False Legitimacy',
    description: 'On entry, defender ATK drops 1 stage.',
    trigger: 'on_entry',
  },
  synthetic_face: {
    id: 'synthetic_face',
    name: 'Synthetic Face',
    description: 'First attack type is hidden.',
    trigger: 'first_attack',
  },
  outrage_engine: {
    id: 'outrage_engine',
    name: 'Outrage Engine',
    description: 'Damage increases as defender HP drops.',
    trigger: 'damage_calc',
  },
  intimidation: {
    id: 'intimidation',
    name: 'Intimidation',
    description: 'On entry, defender ATK drops 1 stage.',
    trigger: 'on_entry',
  },
};
