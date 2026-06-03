/**
 * Educational dialogue explaining WHY specific moves are effective or not.
 * Uses move ID + defender type for precise explanations.
 */

// Per-move explanations when hitting phantom-type (Phishmonger)
const ARMOR_VS_PHANTOM = {
  firewall: '🎓 ZERO-TRUST alone fails against phishing — scammers bypass firewalls by impersonating people you trust, not hacking systems.',
  encryption_shield: '🎓 2FA cannot stop phishing — if the scammer tricks you into entering your OTP on a fake site, 2FA is useless.',
  patch_update: '🎓 Patching does not protect against social engineering — phishing targets the human, not the software.',
  lockdown: '🎓 MONEY LOCK helps after you recognize a scam — but it cannot prevent you from unlocking it voluntarily under deception.',
  two_factor_auth: '🎓 OTPs fail against phishing — scammers capture your OTP in real-time via fake banking portals.',
  data_wipe: '🎓 Wiping your device does nothing against phishing — the scam happens on the scammer\'s fake website, not your phone.',
};

// Logic vs Toxic (why logic fails against manipulation)
const LOGIC_VS_TOXIC = {
  fact_check: '🎓 Pausing helps, but emotional manipulation bypasses rational thought — trolls exploit feelings, not logic.',
  cross_reference: '🎓 Verification struggles when the manipulation uses YOUR real data against you.',
  deep_research: '🎓 Research is slower than panic — by the time you Google, the urgency has already triggered action.',
  logical_refute: '🎓 Logic alone cannot counter emotional abuse — manipulation targets feelings, not reason.',
  source_verify: '🎓 Domain checking does not help against malware APKs that arrive via trusted platforms.',
  critical_analysis: '🎓 Pattern recognition weakens under emotional distress — trolls exploit vulnerability.',
  debunk_blast: '🎓 Fact-checking fails when the victim is emotionally overwhelmed and not reading clearly.',
};

// Logic vs Coercion (why logic fails against pressure)
const LOGIC_VS_COERCION = {
  fact_check: '🎓 Hard to pause and verify when someone claiming to be police says you are under arrest.',
  cross_reference: '🎓 Victims under threat do not think to verify — fear overrides critical thinking.',
  deep_research: '🎓 No time to research when the scammer says your visa will be cancelled in 1 hour.',
  logical_refute: '🎓 Consulting others is hard when the scammer tells you NOT to talk to anyone or face arrest.',
  source_verify: '🎓 Under extreme pressure, even trained people skip verification steps.',
  critical_analysis: '🎓 Pattern recognition fails under fear — coercion exploits the fight-or-flight response.',
  debunk_blast: '🎓 Cannot fact-check when paralysed by fear of arrest or deportation.',
};

// Forensic vs Phantom (why forensic IS effective — super effective)
const FORENSIC_VS_PHANTOM = {
  official_app_check: '🎓 Opening the real IRAS/OCBC app directly exposes the fake SMS — the real app shows no pending refund!',
  trace_route: '🎓 Checking the URL reveals .tk or .xyz domains — Singapore government only uses .gov.sg!',
  metadata_scan: '🎓 IMDA Sender ID Registry instantly exposes spoofed sender names — scammers cannot fake the registry.',
  audit_log: '🎓 Bank statements show no pending refund — the scammer\'s claim collapses under basic verification.',
  cross_reference: '🎓 Cross-referencing with official sources destroys the impersonation completely.',
  reverse_trace: '🎓 Digital forensics traces the scam back to its source — exposing the attacker.',
  expose_weakness: '🎓 Once you publicly identify the scam pattern, others become immune to the same trick.',
  incident_report: '🎓 Filing reports helps SPF track and dismantle phishing operations.',
};

// Network vs Coercion (why network IS effective)
const NETWORK_VS_COERCION = {
  scamshield_banish: '🎓 Reporting to ScamShield gets the number blocked — cutting off the scammer\'s communication channel!',
  community_alert: '🎓 Telling family members breaks the isolation — coercion loses power when victims have support!',
  vpn_shield: '🎓 Privacy protection makes you harder to target — scammers cannot pressure someone they cannot find.',
  mass_warn: '🎓 Calling 1799 gives you immediate professional support — the anti-scam hotline knows these tactics!',
  bandwidth_surge: '🎓 Mass reporting floods and shuts down the scammer\'s infrastructure.',
  speed_patch: '🎓 Quick response means banks can freeze transfers before the money leaves Singapore.',
  honeypot_trap: '🎓 Honeypots waste the scammer\'s time — every minute spent on a trap is a minute not scamming real victims.',
};

// Armor vs Toxic (why armor IS effective)
const ARMOR_VS_TOXIC = {
  firewall: '🎓 Zero-trust blocks malicious APK installs — if you never trust unknown app sources, trojans cannot install!',
  encryption_shield: '🎓 2FA prevents account takeover even if malware captures your password!',
  patch_update: '🎓 Updated OS blocks known malware signatures — the 2023 trojan APKs exploited unpatched Android vulnerabilities!',
  lockdown: '🎓 MONEY LOCK prevents unauthorized transfers even if a trojan has device access — it requires in-branch unlock!',
  two_factor_auth: '🎓 OTP verification blocks automated malware transfers — trojans cannot intercept hardware tokens!',
  data_wipe: '🎓 Remote wipe destroys malware completely — if your device is compromised, a clean slate is the nuclear option!',
};

// Phantom vs Armor (why phantom beats armor — super effective)
const PHANTOM_VS_ARMOR = {
  sender_id_spoof: '🎓 Spoofed sender IDs bypass firewalls because the message looks legitimate to the system!',
  false_urgency: '🎓 Urgency pressure causes people to disable their own security measures voluntarily!',
  thread_injection: '🎓 Messages in existing bank threads bypass spam filters — the system thinks it is a real bank message!',
  ocbc_phish: '🎓 The fake refund link bypasses security because the victim voluntarily enters their credentials!',
};

// Toxic vs Logic (why toxic beats logic — super effective)
const TOXIC_VS_LOGIC = {
  gaslight: '🎓 False authority claims create panic that overrides critical thinking entirely!',
  pile_on: '🎓 Malware APKs exploit trust in app stores — even careful users download apps from familiar platforms!',
  doxxing_threat: '🎓 Image-based threats cause emotional shutdown — victims cannot think logically under shame and fear!',
};

// Coercion vs Logic (why coercion beats logic — super effective)
const COERCION_VS_LOGIC = {
  threats: '🎓 Fake police authority triggers instant compliance — even smart people freeze when threatened with arrest!',
  extortion: '🎓 Deportation threats exploit immigration anxiety — rational thought collapses under existential fear!',
  panic_pressure: '🎓 Money mule pressure creates urgency that bypasses all rational safeguards!',
  lateral_movement: '🎓 Silent network infiltration goes undetected by human logic — you cannot think away what you do not know exists!',
  data_exfiltration: '🎓 Mass data theft happens silently — critical thinking cannot protect against invisible attacks!',
};

const MOVE_EFFECTIVENESS_MAP = {
  // Not effective: armor vs phantom
  ...Object.fromEntries(Object.entries(ARMOR_VS_PHANTOM).map(([k, v]) => [`${k}_vs_phantom_not`, v])),
  // Not effective: logic vs toxic
  ...Object.fromEntries(Object.entries(LOGIC_VS_TOXIC).map(([k, v]) => [`${k}_vs_toxic_not`, v])),
  // Not effective: logic vs coercion
  ...Object.fromEntries(Object.entries(LOGIC_VS_COERCION).map(([k, v]) => [`${k}_vs_coercion_not`, v])),
  // Super effective: forensic vs phantom
  ...Object.fromEntries(Object.entries(FORENSIC_VS_PHANTOM).map(([k, v]) => [`${k}_vs_phantom_super`, v])),
  // Super effective: network vs coercion
  ...Object.fromEntries(Object.entries(NETWORK_VS_COERCION).map(([k, v]) => [`${k}_vs_coercion_super`, v])),
  // Super effective: armor vs toxic
  ...Object.fromEntries(Object.entries(ARMOR_VS_TOXIC).map(([k, v]) => [`${k}_vs_toxic_super`, v])),
  // Super effective: phantom vs armor
  ...Object.fromEntries(Object.entries(PHANTOM_VS_ARMOR).map(([k, v]) => [`${k}_vs_armor_super`, v])),
  // Super effective: toxic vs logic
  ...Object.fromEntries(Object.entries(TOXIC_VS_LOGIC).map(([k, v]) => [`${k}_vs_logic_super`, v])),
  // Super effective: coercion vs logic
  ...Object.fromEntries(Object.entries(COERCION_VS_LOGIC).map(([k, v]) => [`${k}_vs_logic_super`, v])),
};

/**
 * Get the educational dialogue for a specific move vs defender type.
 * @param {string} moveId - The move's ID
 * @param {string} defenderType - The defender creature's type
 * @param {number} effectiveness - The effectiveness multiplier
 * @returns {string|null}
 */
export function getEffectivenessDialogue(moveType, defenderType, effectiveness, moveId) {
  if (!moveId || !defenderType) return null;

  // Try specific move-based lookup first
  if (effectiveness >= 2) {
    const key = `${moveId}_vs_${defenderType}_super`;
    if (MOVE_EFFECTIVENESS_MAP[key]) return MOVE_EFFECTIVENESS_MAP[key];
  }
  if (effectiveness < 1) {
    const key = `${moveId}_vs_${defenderType}_not`;
    if (MOVE_EFFECTIVENESS_MAP[key]) return MOVE_EFFECTIVENESS_MAP[key];
  }

  // Fallback: generic type-based
  if (effectiveness >= 2) {
    if (moveType === 'forensic' && defenderType === 'phantom') return '🎓 Verification destroys impersonation — checking official sources shatters the disguise.';
    if (moveType === 'network' && defenderType === 'coercion') return '🎓 Community support crushes coercion — scammers lose power when victims are not alone.';
    if (moveType === 'armor' && defenderType === 'toxic') return '🎓 Security hardening blocks malware — patched devices with 2FA are immune.';
  }
  if (effectiveness < 1) {
    if (moveType === 'armor' && defenderType === 'phantom') return '🎓 Technical defenses alone fail against social engineering — the human is the target, not the system.';
    if (moveType === 'logic' && defenderType === 'toxic') return '🎓 Logic alone cannot counter emotional manipulation.';
    if (moveType === 'logic' && defenderType === 'coercion') return '🎓 Critical thinking fails under extreme fear and pressure.';
  }

  return null;
}
