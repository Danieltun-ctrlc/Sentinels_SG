/**
 * RAG Retriever — matches user content against the threat knowledge base.
 */
const threatKnowledgeBase = require('../../data/threatKnowledgeBase');

function retrieveThreats(content, options = {}) {
  const { topN = 3, minScore = 5 } = options;
  if (!content || content.length < 5) return [];

  const contentLower = content.toLowerCase();
  const results = [];

  for (const threat of threatKnowledgeBase) {
    let score = 0;
    const matchedKeywords = [];

    // Keyword matching
    if (threat.keywords) {
      for (const kw of threat.keywords) {
        if (contentLower.includes(kw.toLowerCase())) {
          score += 10;
          matchedKeywords.push(kw);
        }
      }
      // Diversity bonus
      if (matchedKeywords.length > 1) score += matchedKeywords.length * 5;
    }

    // Sample text similarity (Jaccard)
    if (threat.sampleTexts) {
      for (const sample of threat.sampleTexts) {
        const sampleWords = new Set(sample.toLowerCase().split(/\s+/));
        const contentWords = new Set(contentLower.split(/\s+/));
        const intersection = [...sampleWords].filter(w => contentWords.has(w));
        const union = new Set([...sampleWords, ...contentWords]);
        const similarity = intersection.length / union.size;
        score += similarity * 20;
      }
    }

    // Regex pattern matching
    if (threat.patternRegex) {
      for (const pattern of threat.patternRegex) {
        try {
          const regex = new RegExp(pattern.replace(/^\/|\/[gimsu]*$/g, ''), 'i');
          if (regex.test(content)) score += 8;
        } catch (e) {}
      }
    }

    // Prevalence multiplier
    const prevMult = { CRITICAL: 1.5, HIGH: 1.3, MEDIUM: 1.1, LOW: 1.0 };
    score *= prevMult[threat.prevalence] || 1.0;

    // Recency boost
    if (threat.lastUpdated) {
      const daysSince = (Date.now() - new Date(threat.lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince <= 90) score *= 1.2;
    }

    if (score >= minScore) {
      results.push({ threat, score: Math.round(score), matchedKeywords });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topN);
}

module.exports = { retrieveThreats };
