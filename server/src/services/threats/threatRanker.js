/**
 * Threat Ranker — Calculates trending scores for threat entries.
 *
 * Formula:
 *   Prevalence (40%) + Recency (30%) + Victims (20%) + Loss (10%)
 */
const THREAT_KNOWLEDGE_BASE = require('../../data/threatKnowledgeBase');

const PREVALENCE_SCORES = {
  CRITICAL: 100,
  HIGH: 75,
  MEDIUM: 50,
  LOW: 25,
};

/**
 * Parse an estimatedLoss string like "S$135.7 million" into a numeric SGD value.
 * Handles formats: "S$135.7 million", "S$10,600,000", "Unknown", etc.
 */
function parseLossToSGD(lossString) {
  if (!lossString || typeof lossString !== 'string') return 0;

  const cleaned = lossString.replace(/[,\s]/g, '').toLowerCase();

  // Match patterns like "s$135.7million" or "$135.7million"
  const millionMatch = cleaned.match(/s?\$?([\d.]+)million/);
  if (millionMatch) {
    return parseFloat(millionMatch[1]) * 1_000_000;
  }

  // Match patterns like "s$10600000" or "$10600000"
  const directMatch = cleaned.match(/s?\$?([\d.]+)/);
  if (directMatch) {
    const value = parseFloat(directMatch[1]);
    if (!isNaN(value)) return value;
  }

  return 0;
}

/**
 * Calculate recency score based on days since lastUpdated.
 */
function getRecencyScore(lastUpdated) {
  if (!lastUpdated) return 20;

  const now = new Date();
  const updated = new Date(lastUpdated);
  const daysDiff = Math.floor((now - updated) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 30) return 100;
  if (daysDiff <= 90) return 80;
  if (daysDiff <= 180) return 60;
  if (daysDiff <= 365) return 40;
  return 20;
}

/**
 * Rank all threats by trending score and return them sorted descending.
 */
function rankThreats() {
  const threats = THREAT_KNOWLEDGE_BASE;

  // Find max victims and max loss for normalization
  const maxVictims = Math.max(...threats.map(t => t.confirmedVictims || 0), 1);
  const maxLoss = Math.max(...threats.map(t => parseLossToSGD(t.estimatedLoss)), 1);

  const ranked = threats.map(threat => {
    const prevalenceScore = PREVALENCE_SCORES[(threat.prevalence || 'LOW').toUpperCase()] || 25;
    const recencyScore = getRecencyScore(threat.lastUpdated);
    const victimScore = ((threat.confirmedVictims || 0) / maxVictims) * 100;
    const lossScore = (parseLossToSGD(threat.estimatedLoss) / maxLoss) * 100;

    const trendingScore =
      prevalenceScore * 0.4 +
      recencyScore * 0.3 +
      victimScore * 0.2 +
      lossScore * 0.1;

    return {
      ...threat,
      trendingScore: Math.round(trendingScore * 100) / 100,
    };
  });

  ranked.sort((a, b) => b.trendingScore - a.trendingScore);
  return ranked;
}

module.exports = { rankThreats, parseLossToSGD };
