/**
 * Threat Searcher — Search, filter, sort, and summarize threat entries.
 */
const { parseLossToSGD } = require('./threatRanker');

/**
 * Search threats by query string across multiple fields.
 */
function searchThreats(query, threats) {
  if (!query || typeof query !== 'string') return threats;

  const q = query.toLowerCase().trim();
  if (!q) return threats;

  return threats.filter(threat => {
    const fields = [
      threat.name,
      threat.description,
      threat.family,
      threat.category,
      ...(threat.keywords || []),
      ...(threat.redFlags || []),
    ];

    return fields.some(field =>
      field && typeof field === 'string' && field.toLowerCase().includes(q)
    );
  });
}

/**
 * Filter threats by family, category, and/or prevalence.
 */
function filterThreats(threats, { family, category, prevalence } = {}) {
  let filtered = threats;

  if (family) {
    const f = family.toLowerCase();
    filtered = filtered.filter(t => (t.family || '').toLowerCase() === f);
  }

  if (category) {
    const c = category.toLowerCase();
    filtered = filtered.filter(t => (t.category || '').toLowerCase() === c);
  }

  if (prevalence) {
    const p = prevalence.toUpperCase();
    filtered = filtered.filter(t => (t.prevalence || '').toUpperCase() === p);
  }

  return filtered;
}

/**
 * Sort threats by a given criterion.
 */
function sortThreats(threats, sortBy) {
  const sorted = [...threats];

  switch (sortBy) {
    case 'trending':
      sorted.sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));
      break;
    case 'recent':
      sorted.sort((a, b) => {
        const dateA = a.lastUpdated ? new Date(a.lastUpdated) : new Date(0);
        const dateB = b.lastUpdated ? new Date(b.lastUpdated) : new Date(0);
        return dateB - dateA;
      });
      break;
    case 'victims':
      sorted.sort((a, b) => (b.confirmedVictims || 0) - (a.confirmedVictims || 0));
      break;
    case 'losses':
      sorted.sort((a, b) => parseLossToSGD(b.estimatedLoss) - parseLossToSGD(a.estimatedLoss));
      break;
    case 'name':
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      break;
    default:
      // Default to trending
      sorted.sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));
  }

  return sorted;
}

/**
 * Build a lightweight summary of a threat entry.
 */
function buildSummary(threat) {
  return {
    id: threat.id || null,
    name: threat.name || '',
    family: threat.family || '',
    category: threat.category || '',
    prevalence: threat.prevalence || '',
    confirmedVictims: threat.confirmedVictims || 0,
    estimatedLoss: threat.estimatedLoss || 'Unknown',
    lastUpdated: threat.lastUpdated || null,
    shortDescription: (threat.description || '').slice(0, 200) + ((threat.description || '').length > 200 ? '...' : ''),
    trendingScore: threat.trendingScore || 0,
    redFlagCount: (threat.redFlags || []).length,
    sourceCount: (threat.sources || []).length,
  };
}

module.exports = { searchThreats, filterThreats, sortThreats, buildSummary };
