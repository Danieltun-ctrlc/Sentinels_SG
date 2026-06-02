/**
 * Threats Controller — HTTP handlers for the Threat Briefing feature.
 */
const { rankThreats } = require('../services/threats/threatRanker');
const { searchThreats, filterThreats, sortThreats, buildSummary } = require('../services/threats/threatSearcher');
const { getStats } = require('../services/threats/threatStats');

// Family display colors for the UI
const FAMILY_COLORS = {
  illusion: '#FF6B6B',
  phantom: '#845EC2',
  toxic: '#FF9671',
  ghost: '#00C9A7',
  unknown: '#8E8E8E',
};

/**
 * GET /threats
 * Query params: family, category, prevalence, q, sort, limit, offset
 */
function getThreats(req, res) {
  try {
    const { family, category, prevalence, q, sort, limit, offset } = req.query;

    let threats = rankThreats();
    const total = threats.length;

    // Search
    if (q) {
      threats = searchThreats(q, threats);
    }

    // Filter
    threats = filterThreats(threats, { family, category, prevalence });

    // Sort
    threats = sortThreats(threats, sort || 'trending');

    const filtered = threats.length;

    // Pagination
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const offsetNum = Math.max(parseInt(offset) || 0, 0);
    threats = threats.slice(offsetNum, offsetNum + limitNum);

    // Build summaries
    const summaries = threats.map(buildSummary);

    res.json({ total, filtered, threats: summaries });
  } catch (err) {
    console.error('[Threats] getThreats error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve threats' });
  }
}

/**
 * GET /threats/trending
 * Returns top 10 threats by trending score.
 */
function getTrending(req, res) {
  try {
    const threats = rankThreats().slice(0, 10);
    const summaries = threats.map(buildSummary);
    res.json({ threats: summaries });
  } catch (err) {
    console.error('[Threats] getTrending error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve trending threats' });
  }
}

/**
 * GET /threats/stats
 * Returns aggregate statistics.
 */
function getStatsHandler(req, res) {
  try {
    const stats = getStats();
    res.json({ stats });
  } catch (err) {
    console.error('[Threats] getStats error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve threat statistics' });
  }
}

/**
 * GET /threats/:id
 * Returns full threat object by id.
 */
function getThreatById(req, res) {
  try {
    const { id } = req.params;
    const threats = rankThreats();
    const threat = threats.find(t => t.id === id);

    if (!threat) {
      return res.status(404).json({ error: 'Threat not found' });
    }

    res.json({ threat });
  } catch (err) {
    console.error('[Threats] getThreatById error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve threat' });
  }
}

/**
 * GET /threats/:id/related
 * Returns 3-5 related threats (same family or category, excluding self).
 */
function getRelated(req, res) {
  try {
    const { id } = req.params;
    const threats = rankThreats();
    const threat = threats.find(t => t.id === id);

    if (!threat) {
      return res.status(404).json({ error: 'Threat not found' });
    }

    // Find related by same family first, then same category
    let related = threats.filter(t =>
      t.id !== id && t.family === threat.family
    );

    // If not enough, add same category
    if (related.length < 5) {
      const categoryMatches = threats.filter(t =>
        t.id !== id &&
        t.category === threat.category &&
        !related.some(r => r.id === t.id)
      );
      related = [...related, ...categoryMatches];
    }

    // Take 3-5 (aim for 5, but at least 3 if available)
    related = related.slice(0, 5);

    const summaries = related.map(buildSummary);
    res.json({ related: summaries });
  } catch (err) {
    console.error('[Threats] getRelated error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve related threats' });
  }
}

/**
 * GET /threats/families
 * Returns list of families with counts and colors.
 */
function getFamilies(req, res) {
  try {
    const threats = rankThreats();
    const familyMap = {};

    threats.forEach(t => {
      const family = t.family || 'unknown';
      familyMap[family] = (familyMap[family] || 0) + 1;
    });

    const families = Object.entries(familyMap).map(([name, count]) => ({
      name,
      count,
      color: FAMILY_COLORS[name] || FAMILY_COLORS.unknown,
    }));

    families.sort((a, b) => b.count - a.count);

    res.json({ families });
  } catch (err) {
    console.error('[Threats] getFamilies error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve families' });
  }
}

/**
 * GET /threats/categories
 * Returns list of categories with counts.
 */
function getCategories(req, res) {
  try {
    const threats = rankThreats();
    const categoryMap = {};

    threats.forEach(t => {
      const category = t.category || 'unknown';
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });

    const categories = Object.entries(categoryMap).map(([name, count]) => ({
      name,
      count,
    }));

    categories.sort((a, b) => b.count - a.count);

    res.json({ categories });
  } catch (err) {
    console.error('[Threats] getCategories error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
}

module.exports = {
  getThreats,
  getTrending,
  getStats: getStatsHandler,
  getThreatById,
  getRelated,
  getFamilies,
  getCategories,
};
