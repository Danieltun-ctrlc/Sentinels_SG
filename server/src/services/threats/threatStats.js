/**
 * Threat Stats — Aggregate statistics from the threat knowledge base.
 */
const { rankThreats, parseLossToSGD } = require('./threatRanker');

/**
 * Returns aggregate statistics for the entire threat knowledge base.
 */
function getStats() {
  const threats = rankThreats();

  const totalThreats = threats.length;
  const totalVictims = threats.reduce((sum, t) => sum + (t.confirmedVictims || 0), 0);
  const totalLossNum = threats.reduce((sum, t) => sum + parseLossToSGD(t.estimatedLoss), 0);

  // Format total loss as display string
  const totalLossDisplay = totalLossNum >= 1_000_000
    ? `S$${(totalLossNum / 1_000_000).toFixed(1)} million`
    : `S$${totalLossNum.toLocaleString()}`;

  // By family
  const familyMap = {};
  threats.forEach(t => {
    const family = t.family || 'unknown';
    familyMap[family] = (familyMap[family] || 0) + 1;
  });
  const byFamily = Object.entries(familyMap).map(([name, count]) => ({
    name,
    count,
    percentage: Math.round((count / totalThreats) * 1000) / 10,
  }));

  // By prevalence
  const prevalenceMap = {};
  threats.forEach(t => {
    const level = (t.prevalence || 'UNKNOWN').toUpperCase();
    prevalenceMap[level] = (prevalenceMap[level] || 0) + 1;
  });
  const byPrevalence = Object.entries(prevalenceMap).map(([level, count]) => ({
    level,
    count,
  }));

  // By category
  const categoryMap = {};
  threats.forEach(t => {
    const cat = t.category || 'unknown';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const byCategory = Object.entries(categoryMap).map(([name, count]) => ({
    name,
    count,
  }));

  // Top 5 by victims
  const topByVictims = [...threats]
    .sort((a, b) => (b.confirmedVictims || 0) - (a.confirmedVictims || 0))
    .slice(0, 5)
    .map(t => ({
      id: t.id,
      name: t.name,
      confirmedVictims: t.confirmedVictims || 0,
    }));

  // Top 5 by losses
  const topByLosses = [...threats]
    .sort((a, b) => parseLossToSGD(b.estimatedLoss) - parseLossToSGD(a.estimatedLoss))
    .slice(0, 5)
    .map(t => ({
      id: t.id,
      name: t.name,
      estimatedLoss: t.estimatedLoss || 'Unknown',
      lossValue: parseLossToSGD(t.estimatedLoss),
    }));

  // Top 5 recently updated
  const recentlyUpdated = [...threats]
    .sort((a, b) => {
      const dateA = a.lastUpdated ? new Date(a.lastUpdated) : new Date(0);
      const dateB = b.lastUpdated ? new Date(b.lastUpdated) : new Date(0);
      return dateB - dateA;
    })
    .slice(0, 5)
    .map(t => ({
      id: t.id,
      name: t.name,
      lastUpdated: t.lastUpdated || null,
    }));

  return {
    totalThreats,
    totalVictims,
    totalLoss: {
      value: totalLossNum,
      display: totalLossDisplay,
    },
    byFamily,
    byPrevalence,
    byCategory,
    topByVictims,
    topByLosses,
    recentlyUpdated,
  };
}

module.exports = { getStats };
