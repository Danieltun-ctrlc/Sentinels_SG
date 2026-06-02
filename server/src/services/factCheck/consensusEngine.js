/**
 * Consensus Engine — Combines Detector and Skeptic into final verdict.
 */

const VERDICT_RANK = { SAFE: 0, LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

function combineResults(detector, skeptic, retrievedThreats) {
  const agentsAgreed = skeptic.agreeWithAgent1;

  let verdict, confidence;

  if (agentsAgreed) {
    verdict = skeptic.adjustedVerdict || detector.verdict;
    confidence = Math.min(99, Math.round((detector.confidence + skeptic.adjustedConfidence) / 2));
    if (skeptic.adjustedConfidence > detector.confidence) {
      confidence = skeptic.adjustedConfidence;
    }
  } else {
    // Use the MORE CAUTIOUS verdict
    const dRank = VERDICT_RANK[detector.verdict] || 2;
    const sRank = VERDICT_RANK[skeptic.adjustedVerdict] || 2;
    verdict = dRank >= sRank ? detector.verdict : skeptic.adjustedVerdict;
    confidence = Math.max(50, Math.min(detector.confidence, skeptic.adjustedConfidence) - 10);
  }

  // Combine red flags
  const allFlags = [...(detector.redFlags || []), ...(skeptic.additionalRedFlags || [])];
  const redFlags = [...new Set(allFlags)];

  // Combine sources
  const sourceNames = new Set(detector.citedSources || []);
  for (const r of retrievedThreats) {
    if (r.threat.sources) r.threat.sources.forEach(s => sourceNames.add(s.name));
  }

  // Build cited sources with URLs
  const citedSources = [];
  for (const r of retrievedThreats) {
    if (r.threat.sources) {
      for (const s of r.threat.sources) {
        if (!citedSources.find(c => c.name === s.name)) citedSources.push(s);
      }
    }
  }

  // Action items
  const userShouldDo = [...(detector.userShouldDo || [])];
  if (skeptic.finalRecommendation && !userShouldDo.includes(skeptic.finalRecommendation)) {
    userShouldDo.push(skeptic.finalRecommendation);
  }

  // Reporting channels from retrieved threats
  const reportingChannels = [
    { method: 'ScamShield App', action: 'Block & Report' },
    { method: 'Anti-Scam Hotline', action: 'Call 1799 (24/7)' },
  ];

  // Prevention tips from matched knowledge base threats
  const preventionTips = [];
  for (const r of retrievedThreats) {
    if (r.threat.preventionTips) {
      for (const tip of r.threat.preventionTips) {
        if (!preventionTips.includes(tip)) preventionTips.push(tip);
      }
    }
  }

  return {
    verdict,
    confidence,
    threatFamily: detector.threatFamily,
    threatSubcategory: detector.matchedThreatId ? retrievedThreats[0]?.threat?.name : null,
    matchedThreatId: detector.matchedThreatId,
    redFlags,
    reasoning: detector.reasoning + (skeptic.skepticReasoning ? ` ${skeptic.skepticReasoning}` : ''),
    singaporeContext: detector.singaporeContext,
    userShouldDo,
    preventionTips,
    citedSources,
    agentsAgreed,
    detectorView: detector,
    skepticView: skeptic,
    reportingChannels,
    _processingMs: (detector._processingTimeMs || 0) + (skeptic._processingTimeMs || 0),
    _modelsUsed: [detector._modelUsed, skeptic._modelUsed],
    _tokenUsage: {
      input: (detector._tokenUsage?.input || 0) + (skeptic._tokenUsage?.input || 0),
      output: (detector._tokenUsage?.output || 0) + (skeptic._tokenUsage?.output || 0),
    },
  };
}

module.exports = { combineResults };
