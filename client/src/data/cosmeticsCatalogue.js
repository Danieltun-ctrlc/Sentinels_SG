/**
 * Cosmetics Catalogue — Client-side mirror
 * Used for instant UI rendering; server is source of truth for purchases.
 * Sprite paths: /sprites/customisation/{category_folder}/{item_id}.png
 */

const cosmeticsCatalogue = [
  // HEADGEAR
  { id: 'head_cyber_visor', name: 'Cyber Visor', category: 'headgear', rarity: 'common', price: 300, description: 'A basic HUD visor with threat-level overlay.', imagePath: '/sprites/customisation/headgear/head_cyber_visor.png' },
  { id: 'head_neural_crown', name: 'Neural Crown', category: 'headgear', rarity: 'uncommon', price: 750, description: 'Brainwave amplifier used by senior analysts.', imagePath: '/sprites/customisation/headgear/head_neural_crown.png' },
  { id: 'head_holo_hood', name: 'Holo Hood', category: 'headgear', rarity: 'rare', price: 1500, description: 'Projects a shifting holographic shroud around the wearer.', imagePath: '/sprites/customisation/headgear/head_holo_hood.png' },
  { id: 'head_firewall_helm', name: 'Firewall Helm', category: 'headgear', rarity: 'epic', price: 3000, description: 'Forged from decommissioned firewall cores. Radiates heat.', unlockRequirement: { type: 'mission', id: 'mission_03' }, imagePath: '/sprites/customisation/headgear/head_firewall_helm.png' },
  { id: 'head_zero_day_mask', name: 'Zero-Day Mask', category: 'headgear', rarity: 'legendary', price: 6000, description: 'Worn by those who survived a zero-day exploit firsthand.', unlockRequirement: { type: 'mission', id: 'mission_06' }, imagePath: '/sprites/customisation/headgear/head_zero_day_mask.png' },
  { id: 'head_pixel_cap', name: 'Pixel Cap', category: 'headgear', rarity: 'common', price: 250, description: 'Retro-styled cap with animated pixel art.', imagePath: '/sprites/customisation/headgear/head_pixel_cap.png' },

  // OUTFIT
  { id: 'outfit_sentinel_jacket', name: 'Sentinel Jacket', category: 'outfit', rarity: 'common', price: 400, description: 'Standard-issue jacket with reflective threat patches.', imagePath: '/sprites/customisation/outfits/outfit_sentinel_jacket.png' },
  { id: 'outfit_data_cloak', name: 'Data Cloak', category: 'outfit', rarity: 'uncommon', price: 800, description: 'Woven from recycled data streams. Shimmers in low light.', imagePath: '/sprites/customisation/outfits/outfit_data_cloak.png' },
  { id: 'outfit_phantom_suit', name: 'Phantom Suit', category: 'outfit', rarity: 'rare', price: 1800, description: 'Stealth-grade suit that bends light around the wearer.', imagePath: '/sprites/customisation/outfits/outfit_phantom_suit.png' },
  { id: 'outfit_breach_armor', name: 'Breach Armor', category: 'outfit', rarity: 'epic', price: 3500, description: 'Heavy plating salvaged from a breached server room.', unlockRequirement: { type: 'mission', id: 'mission_04' }, imagePath: '/sprites/customisation/outfits/outfit_breach_armor.png' },
  { id: 'outfit_quantum_robe', name: 'Quantum Robe', category: 'outfit', rarity: 'legendary', price: 7000, description: 'Exists in multiple states simultaneously. Mesmerising.', unlockRequirement: { type: 'tier', tier: 'Sentinel' }, imagePath: '/sprites/customisation/outfits/outfit_quantum_robe.png' },
  { id: 'outfit_neon_hoodie', name: 'Neon Hoodie', category: 'outfit', rarity: 'common', price: 350, description: 'Casual hoodie with glowing neon trim.', imagePath: '/sprites/customisation/outfits/outfit_neon_hoodie.png' },

  // ACCESSORIES
  { id: 'acc_usb_earring', name: 'USB Earring', category: 'accessories', rarity: 'common', price: 200, description: 'A dangling USB drive. Purely decorative... probably.', imagePath: '/sprites/customisation/accessories/acc_usb_earring.png' },
  { id: 'acc_crypto_chain', name: 'Crypto Chain', category: 'accessories', rarity: 'uncommon', price: 600, description: 'Blockchain-linked necklace that pulses with each new block.', imagePath: '/sprites/customisation/accessories/acc_crypto_chain.png' },
  { id: 'acc_threat_scanner', name: 'Threat Scanner', category: 'accessories', rarity: 'rare', price: 1200, description: 'Wrist-mounted scanner that highlights nearby threats.', imagePath: '/sprites/customisation/accessories/acc_threat_scanner.png' },
  { id: 'acc_holo_wings', name: 'Holo Wings', category: 'accessories', rarity: 'epic', price: 3200, description: 'Holographic wings that trail data particles.', unlockRequirement: { type: 'mission', id: 'mission_05' }, imagePath: '/sprites/customisation/accessories/acc_holo_wings.png' },
  { id: 'acc_infinity_gauntlet', name: 'Infinity Gauntlet', category: 'accessories', rarity: 'legendary', price: 7500, description: 'Contains fragments of every known encryption algorithm.', unlockRequirement: { type: 'tier', tier: 'Sentinel' }, imagePath: '/sprites/customisation/accessories/acc_infinity_gauntlet.png' },
  { id: 'acc_led_glasses', name: 'LED Glasses', category: 'accessories', rarity: 'common', price: 250, description: 'Scrolling LED text across the lenses. Customisable.', imagePath: '/sprites/customisation/accessories/acc_led_glasses.png' },

  // EFFECTS
  { id: 'fx_pixel_trail', name: 'Pixel Trail', category: 'effects', rarity: 'common', price: 300, description: 'Leaves a trail of dissolving pixels behind you.', imagePath: '/sprites/customisation/effects_front/fx_pixel_trail.png' },
  { id: 'fx_data_rain', name: 'Data Rain', category: 'effects', rarity: 'uncommon', price: 700, description: 'Matrix-style data rain cascades around your avatar.', imagePath: '/sprites/customisation/effects_back/fx_data_rain.png' },
  { id: 'fx_glitch_aura', name: 'Glitch Aura', category: 'effects', rarity: 'rare', price: 1500, description: 'Your avatar glitches and distorts at random intervals.', imagePath: '/sprites/customisation/effects_front/fx_glitch_aura.png' },
  { id: 'fx_lightning_field', name: 'Lightning Field', category: 'effects', rarity: 'epic', price: 2800, description: 'Crackling electricity arcs between your equipped items.', imagePath: '/sprites/customisation/effects_front/fx_lightning_field.png' },
  { id: 'fx_void_particles', name: 'Void Particles', category: 'effects', rarity: 'legendary', price: 5500, description: 'Dark matter particles orbit your avatar ominously.', unlockRequirement: { type: 'mission', id: 'mission_06' }, imagePath: '/sprites/customisation/effects_back/fx_void_particles.png' },
  { id: 'fx_sparkle_burst', name: 'Sparkle Burst', category: 'effects', rarity: 'common', price: 250, description: 'Cheerful sparkles pop around your avatar periodically.', imagePath: '/sprites/customisation/effects_front/fx_sparkle_burst.png' },

  // BADGE
  { id: 'badge_rookie', name: 'Rookie Badge', category: 'badge', rarity: 'common', price: 200, description: 'Everyone starts somewhere. Wear it with pride.', imagePath: '/sprites/customisation/badges/badge_rookie.png' },
  { id: 'badge_phish_hunter', name: 'Phish Hunter', category: 'badge', rarity: 'uncommon', price: 500, description: 'Awarded to those who can spot a phishing attempt instantly.', unlockRequirement: { type: 'mission', id: 'mission_01' }, imagePath: '/sprites/customisation/badges/badge_phish_hunter.png' },
  { id: 'badge_code_breaker', name: 'Code Breaker', category: 'badge', rarity: 'rare', price: 1200, description: 'For cracking the toughest encryption challenges.', unlockRequirement: { type: 'mission', id: 'mission_02' }, imagePath: '/sprites/customisation/badges/badge_code_breaker.png' },
  { id: 'badge_threat_elite', name: 'Threat Elite', category: 'badge', rarity: 'epic', price: 2500, description: 'Only the top threat analysts earn this distinction.', unlockRequirement: { type: 'mission', id: 'mission_05' }, imagePath: '/sprites/customisation/badges/badge_threat_elite.png' },
  { id: 'badge_sentinel_star', name: 'Sentinel Star', category: 'badge', rarity: 'legendary', price: 6500, description: 'The highest honour. A beacon in the digital darkness.', unlockRequirement: { type: 'tier', tier: 'Sentinel' }, imagePath: '/sprites/customisation/badges/badge_sentinel_star.png' },
  { id: 'badge_first_blood', name: 'First Blood', category: 'badge', rarity: 'uncommon', price: 500, description: 'Commemorates your first PvP victory.', imagePath: '/sprites/customisation/badges/badge_first_blood.png' },

  // BACKGROUND
  { id: 'bg_server_room', name: 'Server Room', category: 'background', rarity: 'common', price: 400, description: 'Rows of blinking servers stretch into the distance.', imagePath: '/sprites/customisation/backgrounds/bg_server_room.png' },
  { id: 'bg_neon_city', name: 'Neon City', category: 'background', rarity: 'uncommon', price: 800, description: 'A rain-soaked cyberpunk cityscape at night.', imagePath: '/sprites/customisation/backgrounds/bg_neon_city.png' },
  { id: 'bg_digital_void', name: 'Digital Void', category: 'background', rarity: 'rare', price: 1500, description: 'An endless expanse of floating code fragments.', imagePath: '/sprites/customisation/backgrounds/bg_digital_void.png' },
  { id: 'bg_quantum_realm', name: 'Quantum Realm', category: 'background', rarity: 'epic', price: 3000, description: 'Reality bends and warps in this unstable dimension.', unlockRequirement: { type: 'mission', id: 'mission_04' }, imagePath: '/sprites/customisation/backgrounds/bg_quantum_realm.png' },
  { id: 'bg_core_breach', name: 'Core Breach', category: 'background', rarity: 'legendary', price: 8000, description: 'The moment a system core ruptures. Frozen in time.', unlockRequirement: { type: 'mission', id: 'mission_06' }, imagePath: '/sprites/customisation/backgrounds/bg_core_breach.png' },
  { id: 'bg_matrix_grid', name: 'Matrix Grid', category: 'background', rarity: 'common', price: 350, description: 'Classic green-on-black grid. Never goes out of style.', imagePath: '/sprites/customisation/backgrounds/bg_matrix_grid.png' },
];

export default cosmeticsCatalogue;
