# SENTINEL SG — THREAT BRIEFING IMPLEMENTATION SPEC

**Owner**: Threat Briefing pillar developer (teammate)
**Project**: Sentinel SG — CODE_EXP 2026 Singapore Hackathon
**Submission deadline**: 11 June 2026
**Stack**: React (Create React App, JavaScript) + Express + MySQL (Aiven)
**Last updated**: June 2026

---

## ⚠️ CRITICAL — READ THIS FIRST

### Your scope is ONLY the Threat Briefing pillar

**DO NOT TOUCH OR MODIFY:**
- ❌ The Game pillar (Threat Arena, Battle screen, Codex, Training Modules, TAP Allocation, PVP, Customisation, Dictionary) — another teammate's work
- ❌ The AI Fact-Checker pillar (Upload, Analysing, Result screens, dual-agent backend) — another teammate's work
- ❌ The authentication system (login, signup, JWT, AuthContext) — already built
- ❌ The database schema for users, creatures, missions, battles, factcheck_history, etc. — already exists
- ❌ Any existing routes outside `/api/threats/*`
- ❌ The design system variables in `client/src/styles/variables.css` — use them as-is
- ❌ The Navbar, Footer, layout components — already built
- ❌ The Home dashboard, Codex, Dictionary, etc. — leave alone
- ❌ **DO NOT MODIFY `threatKnowledgeBase.js`** — you READ from it but never EDIT it

**YOU ARE BUILDING ONLY:**
- ✅ Backend routes for `/api/threats/*` (read-only endpoints)
- ✅ Backend controller for threat queries
- ✅ Frontend pages under `client/src/pages/Threats/`
- ✅ Reusable React components under `client/src/components/threats/`
- ✅ Frontend service file at `client/src/services/threatsService.js`
- ✅ Optional: `bookmarked_threats` table if you implement bookmarking

### Project context

Sentinel SG is a 3-pillar cyber-resilience platform for young Singaporeans:

1. **Threat Arena** (Game) — turn-based creature battler (NOT YOUR JOB)
2. **Trending Threats Board** — read-only intel feed (👈 YOUR JOB)
3. **AI Fact-Checker** — multi-modal scam analyzer (NOT YOUR JOB)

The auth, navbar, design system, and shared components are already built. You consume them; you don't change them.

### Strategic context for your pillar

The Threat Briefing pillar is the **information layer** of the platform. While the Game trains reflex through play and the Fact-Checker verifies on demand, the Threat Briefing keeps users **continuously informed** about what scams are hitting Singapore RIGHT NOW.

**Your pitch line:**
> "Other apps tell users about scams that happened. We show users what's happening — ranked by what's hitting Singapore THIS WEEK, sourced from SPF, ScamShield, and CSA."

---

## 📋 TABLE OF CONTENTS

1. [What You're Building](#1-what-youre-building)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [File Structure](#3-file-structure)
4. [Data Source (Provided)](#4-data-source-provided)
5. [Database Schema (Optional)](#5-database-schema-optional)
6. [Backend — API Endpoints](#6-backend--api-endpoints)
7. [Backend — Ranking Algorithm](#7-backend--ranking-algorithm)
8. [Backend — Search & Filter Logic](#8-backend--search--filter-logic)
9. [Frontend — Listing Screen](#9-frontend--listing-screen)
10. [Frontend — Detail Screen](#10-frontend--detail-screen)
11. [Frontend — Stats Dashboard Screen](#11-frontend--stats-dashboard-screen)
12. [Frontend — Service Layer](#12-frontend--service-layer)
13. [Visual Design Requirements](#13-visual-design-requirements)
14. [Build Order](#14-build-order)
15. [Testing Checklist](#15-testing-checklist)
16. [Demo Day Strategy](#16-demo-day-strategy)

---

## 1. WHAT YOU'RE BUILDING

### Concept

The Threat Briefing pillar is a **read-only intelligence feed** showing what scams are currently hitting Singapore. It pulls from the same `threatKnowledgeBase.js` file the Fact-Checker uses (47 documented threats with real SPF/ScamShield/CSA data) but presents the data as a browsable, searchable, filterable threat board.

### Why this matters

The Fact-Checker is reactive — users go there when they're already suspicious. The Threat Briefing is **proactive** — it tells users what to LOOK OUT FOR before they encounter a scam.

It also serves as the platform's credibility anchor: when users see 47 real threats with real victim counts, real dollar losses, and real source citations, they trust the AI Fact-Checker's verdicts more.

### What you're building (3 screens)

**Screen 1: Trending Threats List** (`/threats`)
- Browsable card grid of all threats
- Ranked by "what's hot right now"
- Filter by family, category, prevalence
- Search functionality
- Stats summary at top

**Screen 2: Threat Detail Page** (`/threats/:id`)
- Deep dive on a single threat
- All red flags, prevention tips, sources
- Sample messages (so users learn to recognize)
- Action buttons (Report, Call 1799, Share)
- Related threats

**Screen 3: Stats Dashboard** (`/threats/dashboard`)
- High-level Singapore scam landscape
- Total losses by family
- Top threats this week
- Source attribution
- Pie charts and visualizations

### What "good" looks like

A user opens the Threat Briefing and immediately sees:

> 🚨 **TRENDING THREATS IN SINGAPORE**
>
> **#1 — Job Scam: Task-Based Commission Fraud** 🔥 CRITICAL
> 9,914 victims • S$135.7 million lost • Source: SPF 2023
> Pattern: Earn commission for liking posts, reviewing hotels...
>
> **#2 — Government Officials Impersonation (Physical Handover)** 🔥 CRITICAL
> Scammers impersonate ICA/SPF officers, demand cash pickup...
>
> **#3 — Concert Ticket Scam (Lady Gaga 2025)** ⚠️ HIGH
> Fake resale on social media, paid via PayNow, no tickets delivered...

That's the goal. Make users feel they're looking at a real, current threat intelligence dashboard.

---

## 2. TECH STACK & DEPENDENCIES

### What's already in the project

You don't need to install these — they're already there:
- `express`, `mysql2`, `bcrypt`, `jsonwebtoken`, `cors`, `dotenv`
- `react`, `react-router-dom`, `axios`
- All design system, AuthContext, routing, etc.

### What you need to install

**Nothing.** This pillar is read-only and uses pure JavaScript. No new dependencies.

### Optional (only if you want fancy charts on the dashboard)

If you want pie charts/bar charts on the Stats Dashboard:
```bash
cd client && npm install recharts
```

But you can build basic charts with CSS only. Recharts is optional polish.

---

## 3. FILE STRUCTURE

Create these files. Don't add files outside this list. Don't modify files not in this list.

### Backend files (all under `server/src/`)

```
server/src/
├── controllers/
│   └── threatsController.js                ← CREATE
├── routes/
│   └── threatsRoutes.js                    ← CREATE
└── services/
    └── threats/                            ← CREATE THIS WHOLE FOLDER
        ├── threatRanker.js                 ← Trending ranking logic
        ├── threatSearcher.js               ← Search and filter logic
        └── threatStats.js                  ← Aggregate statistics
```

### Frontend files (all under `client/src/`)

```
client/src/
├── pages/
│   └── Threats/                            ← CREATE THIS WHOLE FOLDER
│       ├── ThreatsList.js                  ← Screen 1: trending list
│       ├── ThreatsList.css
│       ├── ThreatDetail.js                 ← Screen 2: single threat
│       ├── ThreatDetail.css
│       ├── ThreatDashboard.js              ← Screen 3: stats overview
│       └── ThreatDashboard.css
├── components/
│   └── threats/                            ← CREATE THIS WHOLE FOLDER
│       ├── ThreatCard.js                   ← Card in listing grid
│       ├── ThreatCard.css
│       ├── ThreatFilters.js                ← Filter sidebar/topbar
│       ├── ThreatFilters.css
│       ├── ThreatSearchBar.js              ← Search input
│       ├── PrevalenceBadge.js              ← LOW/MED/HIGH/CRITICAL badge
│       ├── FamilyBadge.js                  ← Phantom/Illusion/etc badge
│       ├── ThreatStatsPanel.js             ← Stat summary cards
│       ├── ThreatStatsPanel.css
│       ├── RedFlagsList.js                 ← Specific red flags display
│       ├── SourceCitation.js               ← Source citation card
│       ├── PreventionTipsList.js           ← Prevention tips display
│       ├── RelatedThreats.js               ← Related threats panel
│       └── ScamMessageSample.js            ← Sample message display
├── services/
│   └── threatsService.js                   ← CREATE — axios calls to backend
└── data/
    └── (none needed — backend serves threatKnowledgeBase data)
```

### Existing files you'll need to UPDATE (carefully, just to register routes)

**`server/src/routes/index.js`** — add ONE line:
```javascript
// Add this require at top with other route requires
const threatsRoutes = require('./threatsRoutes');

// Add this with other router.use lines
router.use('/threats', threatsRoutes);
```

**`client/src/App.js`** — add the 3 new routes:
```javascript
// Add these imports
import ThreatsList from './pages/Threats/ThreatsList';
import ThreatDetail from './pages/Threats/ThreatDetail';
import ThreatDashboard from './pages/Threats/ThreatDashboard';

// Add these routes (public, no auth required for browsing)
<Route path="/threats" element={<ThreatsList />} />
<Route path="/threats/dashboard" element={<ThreatDashboard />} />
<Route path="/threats/:id" element={<ThreatDetail />} />
```

That's the ONLY changes you make to files outside the threats feature.

---

## 4. DATA SOURCE (PROVIDED)

### You use the same knowledge base as the Fact-Checker

The team lead has provided `threatKnowledgeBase.js` with **47 documented Singapore scams**. This file lives at `server/src/data/threatKnowledgeBase.js`.

**Important rules:**
- ✅ READ from this file in your backend
- ❌ DO NOT modify the data
- ❌ DO NOT create a duplicate copy
- ❌ DO NOT change the schema

If you need additional fields for your features (like bookmark count), add them via a separate database table — never modify the static data file.

### What's available in each entry

```javascript
{
  id: 'unique_threat_id',
  name: 'Human-readable name',
  category: 'phishing | impersonation | investment_scam | etc',
  family: 'phantom | illusion | toxic | coercion',
  keywords: [...],
  sampleTexts: [...],
  patternRegex: [...],
  description: '...',
  targetDemographic: '...',
  redFlags: [...],
  legitimacyContrast: '...',
  prevalence: 'LOW | MEDIUM | HIGH | CRITICAL',
  firstReported: '2023-01-01',
  lastUpdated: '2023-12-31',
  confirmedVictims: 9914,
  estimatedLoss: 'S$135.7 million',
  sources: [
    {
      name: 'Annual Scams and Cybercrime Brief 2023',
      organization: 'SPF',
      url: '',
      date: '2024-01-01'
    }
  ],
  preventionTips: [...],
  reportingChannels: [...]
}
```

### Coverage you have to work with

| Threat Family | Count | Coverage |
|---|---|---|
| Phantom | 20 | Government impersonation, bank phishing, agency lures |
| Illusion | 14 | Investments, jobs, e-commerce, concert tickets |
| Coercion | 8 | Police impersonation, ICA, money mule recruitment |
| Toxic | 5 | Malware, crypto pump schemes |

Categories: phishing (19), impersonation (11), e-commerce (8), job scams (5), investment scams (4).

### How to load it in code

```javascript
const THREAT_KNOWLEDGE_BASE = require('../data/threatKnowledgeBase');

console.log(`Loaded ${THREAT_KNOWLEDGE_BASE.length} threats`);
// Should log: Loaded 47 threats
```

---

## 5. DATABASE SCHEMA (OPTIONAL)

### Skip this for hackathon v1

The basic Threat Briefing pillar doesn't need a database — it's pure read-only from the static knowledge base. **You can skip this section entirely.**

### Only add tables if you implement these v2 features

**If you want bookmarking** (users save threats to revisit):

```sql
USE sentinel_sg;

CREATE TABLE IF NOT EXISTS bookmarked_threats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  threat_id VARCHAR(100) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_threat (user_id, threat_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
);
```

**If you want view tracking** (popularity / trending based on real views):

```sql
CREATE TABLE IF NOT EXISTS threat_views (
  id INT AUTO_INCREMENT PRIMARY KEY,
  threat_id VARCHAR(100) NOT NULL,
  user_id INT,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_threat_date (threat_id, viewed_at DESC),
  INDEX idx_user (user_id)
);
```

**Recommendation**: Skip both for hackathon. Add them post-launch if you have time. The static knowledge base is impressive enough for the demo.

---

## 6. BACKEND — API ENDPOINTS

### File: `server/src/routes/threatsRoutes.js`

### Endpoints (all public, no auth required for browsing)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/threats` | List threats with filters/search/sort |
| GET | `/api/threats/trending` | Top 10 trending threats |
| GET | `/api/threats/stats` | Aggregate statistics |
| GET | `/api/threats/families` | List all families with counts |
| GET | `/api/threats/categories` | List all categories with counts |
| GET | `/api/threats/:id` | Get full threat details |
| GET | `/api/threats/:id/related` | Get related threats (same family/category) |

### GET /api/threats

**Query parameters:**
- `family`: 'phantom' | 'illusion' | 'toxic' | 'coercion' (optional)
- `category`: any category string (optional)
- `prevalence`: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' (optional)
- `q`: search query string (optional)
- `sort`: 'trending' | 'recent' | 'victims' | 'losses' | 'name' (default: 'trending')
- `limit`: number (default 50, max 100)
- `offset`: number (default 0)

**Response (200):**
```javascript
{
  total: 47,
  filtered: 12,
  threats: [
    {
      id: 'job_scam_task_commission_2023',
      name: 'Job Scam – Task-Based Commission Fraud',
      family: 'illusion',
      category: 'job_scam',
      prevalence: 'CRITICAL',
      confirmedVictims: 9914,
      estimatedLoss: 'S$135.7 million',
      lastUpdated: '2023-12-31',
      shortDescription: 'First 200 chars of description...',
      trendingScore: 87,
      redFlagCount: 6,
      sourceCount: 1
    },
    // ... up to limit
  ]
}
```

Returns a **lightweight summary** for each threat — not the full data. Full details come from `/api/threats/:id`.

### GET /api/threats/trending

Convenience endpoint. Returns top 10 by trending score.

**Response (200):**
```javascript
{
  threats: [
    // Top 10 trending threats (same shape as list response items)
  ]
}
```

### GET /api/threats/:id

Returns the **full threat object** with all fields.

**Response (200):** The complete threat object from `threatKnowledgeBase.js`.

**Error responses:**
- 404 if threat ID doesn't exist

### GET /api/threats/:id/related

Returns 3-5 related threats based on:
1. Same family (highest priority)
2. Same category
3. Similar prevalence

**Response (200):**
```javascript
{
  related: [
    // 3-5 threat summaries
  ]
}
```

### GET /api/threats/stats

**Response (200):**
```javascript
{
  totalThreats: 47,
  totalVictims: 145632,                     // Sum of confirmedVictims
  totalLossSGD: 1342000000,                  // Sum parsed from estimatedLoss
  totalLossDisplay: 'S$1.34 billion',
  
  byFamily: {
    phantom: { count: 20, percentage: 42.5, displayName: 'Phantom (Impersonation)' },
    illusion: { count: 14, percentage: 29.8, displayName: 'Illusion (Fakes/Deepfakes)' },
    coercion: { count: 8, percentage: 17.0, displayName: 'Coercion (Threats/Pressure)' },
    toxic: { count: 5, percentage: 10.6, displayName: 'Toxic (Manipulation)' }
  },
  
  byPrevalence: {
    CRITICAL: 8,
    HIGH: 25,
    MEDIUM: 10,
    LOW: 4
  },
  
  byCategory: {
    phishing: 19,
    impersonation: 11,
    e_commerce: 8,
    job_scam: 5,
    investment_scam: 4
  },
  
  topByVictims: [
    { id: '...', name: '...', confirmedVictims: 9914 },
    // Top 5
  ],
  
  topByLosses: [
    { id: '...', name: '...', estimatedLoss: 'S$135.7 million', sgdValue: 135700000 },
    // Top 5
  ],
  
  sourcesAttribution: {
    'SPF': 28,
    'ScamShield': 12,
    'CSA': 5,
    'IRAS': 2
  },
  
  recentlyUpdated: [
    { id: '...', name: '...', lastUpdated: '2025-12-15' },
    // Top 5 most recent
  ]
}
```

### GET /api/threats/families

**Response (200):**
```javascript
{
  families: [
    {
      id: 'phantom',
      displayName: 'Phantom',
      subtitle: 'Impersonation & phishing',
      description: 'Scammers fake trusted identities — banks, government agencies, friends, employers.',
      count: 20,
      color: '#FF2E63',
      icon: 'phantom_icon'
    },
    {
      id: 'illusion',
      displayName: 'Illusion',
      subtitle: 'Fakes & deepfakes',
      description: 'Too-good-to-be-true offers, fake products, fabricated evidence.',
      count: 14,
      color: '#9333EA',
      icon: 'illusion_icon'
    },
    {
      id: 'toxic',
      displayName: 'Toxic',
      subtitle: 'Manipulation & malware',
      description: 'Exploits emotions, social pressure, malicious software.',
      count: 5,
      color: '#A3E635',
      icon: 'toxic_icon'
    },
    {
      id: 'coercion',
      displayName: 'Coercion',
      subtitle: 'Threats & pressure',
      description: 'Uses fear, urgency, and authority to force compliance.',
      count: 8,
      color: '#F97316',
      icon: 'coercion_icon'
    }
  ]
}
```

### GET /api/threats/categories

Similar to families but for categories (phishing, impersonation, e_commerce, etc.).

---

## 7. BACKEND — RANKING ALGORITHM

### File: `server/src/services/threats/threatRanker.js`

### Purpose

Calculate a "trending score" for each threat to rank what's hot right now.

### Trending score formula

For each threat, compute a score combining multiple signals:

**Prevalence score (40% weight):**
- CRITICAL: 100 points
- HIGH: 75 points
- MEDIUM: 50 points
- LOW: 25 points

**Recency score (30% weight):**

```
Days since lastUpdated:
- 0-30 days:    100 points
- 31-90 days:   80 points
- 91-180 days:  60 points
- 181-365 days: 40 points
- 365+ days:    20 points
```

**Victim impact score (20% weight):**

```
Normalize confirmedVictims to 0-100 scale based on the max in the dataset:
score = (threat.confirmedVictims / MAX_VICTIMS) * 100
```

**Loss impact score (10% weight):**

```
Parse estimatedLoss into SGD value
Normalize to 0-100 scale based on max losses in dataset
```

### Final calculation

```
trendingScore =
  (prevalenceScore * 0.40) +
  (recencyScore * 0.30) +
  (victimScore * 0.20) +
  (lossScore * 0.10)
```

Result is a number 0-100. Higher = more trending.

### Parsing estimatedLoss field

The `estimatedLoss` field is a string like `"S$135.7 million"` or `"S$2.3 billion"`. You need to parse it to a number for sorting:

```javascript
function parseLossToSGD(lossString) {
  if (!lossString) return 0;
  
  const match = lossString.match(/S?\$?(\d+(?:\.\d+)?)\s*(thousand|million|billion)?/i);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = (match[2] || '').toLowerCase();
  
  const multipliers = {
    'thousand': 1_000,
    'million': 1_000_000,
    'billion': 1_000_000_000
  };
  
  return value * (multipliers[unit] || 1);
}
```

### Implementation

```javascript
const THREAT_KNOWLEDGE_BASE = require('../../data/threatKnowledgeBase');

const PREVALENCE_SCORES = {
  CRITICAL: 100,
  HIGH: 75,
  MEDIUM: 50,
  LOW: 25
};

function getRecencyScore(lastUpdated) {
  if (!lastUpdated) return 20;
  
  const daysSince = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSince <= 30) return 100;
  if (daysSince <= 90) return 80;
  if (daysSince <= 180) return 60;
  if (daysSince <= 365) return 40;
  return 20;
}

function computeTrendingScore(threat, maxVictims, maxLoss) {
  const prevalenceScore = PREVALENCE_SCORES[threat.prevalence] || 25;
  const recencyScore = getRecencyScore(threat.lastUpdated);
  const victimScore = maxVictims > 0
    ? (threat.confirmedVictims / maxVictims) * 100
    : 0;
  const lossScore = maxLoss > 0
    ? (parseLossToSGD(threat.estimatedLoss) / maxLoss) * 100
    : 0;
  
  return (
    prevalenceScore * 0.40 +
    recencyScore * 0.30 +
    victimScore * 0.20 +
    lossScore * 0.10
  );
}

function rankThreats() {
  const maxVictims = Math.max(...THREAT_KNOWLEDGE_BASE.map(t => t.confirmedVictims || 0));
  const maxLoss = Math.max(...THREAT_KNOWLEDGE_BASE.map(t => parseLossToSGD(t.estimatedLoss)));
  
  return THREAT_KNOWLEDGE_BASE
    .map(threat => ({
      ...threat,
      trendingScore: computeTrendingScore(threat, maxVictims, maxLoss)
    }))
    .sort((a, b) => b.trendingScore - a.trendingScore);
}

module.exports = { rankThreats, computeTrendingScore, parseLossToSGD };
```

---

## 8. BACKEND — SEARCH & FILTER LOGIC

### File: `server/src/services/threats/threatSearcher.js`

### Purpose

Filter and search threats based on query parameters.

### Search function

Match against multiple fields:

```javascript
function searchThreats(query) {
  if (!query) return THREAT_KNOWLEDGE_BASE;
  
  const lower = query.toLowerCase();
  
  return THREAT_KNOWLEDGE_BASE.filter(threat => {
    // Match against name
    if (threat.name.toLowerCase().includes(lower)) return true;
    
    // Match against description
    if (threat.description.toLowerCase().includes(lower)) return true;
    
    // Match against keywords
    if (threat.keywords.some(k => k.toLowerCase().includes(lower))) return true;
    
    // Match against family
    if (threat.family.toLowerCase().includes(lower)) return true;
    
    // Match against category
    if (threat.category.toLowerCase().includes(lower)) return true;
    
    // Match against red flags
    if (threat.redFlags.some(rf => rf.toLowerCase().includes(lower))) return true;
    
    return false;
  });
}
```

### Filter function

```javascript
function filterThreats(threats, filters) {
  let result = threats;
  
  if (filters.family) {
    result = result.filter(t => t.family === filters.family);
  }
  
  if (filters.category) {
    result = result.filter(t => t.category === filters.category);
  }
  
  if (filters.prevalence) {
    result = result.filter(t => t.prevalence === filters.prevalence);
  }
  
  return result;
}
```

### Sort function

```javascript
function sortThreats(threats, sortBy = 'trending') {
  const sorted = [...threats];
  
  switch (sortBy) {
    case 'trending':
      return sorted.sort((a, b) => b.trendingScore - a.trendingScore);
    
    case 'recent':
      return sorted.sort((a, b) =>
        new Date(b.lastUpdated) - new Date(a.lastUpdated)
      );
    
    case 'victims':
      return sorted.sort((a, b) => b.confirmedVictims - a.confirmedVictims);
    
    case 'losses':
      return sorted.sort((a, b) =>
        parseLossToSGD(b.estimatedLoss) - parseLossToSGD(a.estimatedLoss)
      );
    
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    
    default:
      return sorted;
  }
}
```

### Lightweight summary builder

When returning the list, strip down each threat to a summary:

```javascript
function buildSummary(threat) {
  return {
    id: threat.id,
    name: threat.name,
    family: threat.family,
    category: threat.category,
    prevalence: threat.prevalence,
    confirmedVictims: threat.confirmedVictims,
    estimatedLoss: threat.estimatedLoss,
    lastUpdated: threat.lastUpdated,
    shortDescription: threat.description.substring(0, 200) + '...',
    trendingScore: threat.trendingScore,
    redFlagCount: threat.redFlags?.length || 0,
    sourceCount: threat.sources?.length || 0,
    keywords: threat.keywords?.slice(0, 5) || []  // Top 5 keywords for preview
  };
}
```

---

## 9. FRONTEND — LISTING SCREEN

### File: `client/src/pages/Threats/ThreatsList.js`

### Route: `/threats`

### Page layout

```
┌────────────────────────────────────────────────────────────────────┐
│ TOP BAR                                                              │
│ "TRENDING THREATS IN SINGAPORE" · Last updated stat                  │
│ Subtitle: "Live intel from SPF, ScamShield, and CSA"                 │
├────────────────────────────────────────────────────────────────────┤
│ STATS STRIP (4 cards horizontally)                                   │
│ [47 Threats] [145,632 Victims] [S$1.34B Lost] [4 Families]          │
├────────────────────────────────────────────────────────────────────┤
│ FILTER & SEARCH BAR                                                  │
│ [Search threats...] · Family: [All ▼] · Sort: [Trending ▼]          │
├────────────────────────────────────────────────────────────────────┤
│ FAMILY FILTER PILLS                                                  │
│ [All 47] [Phantom 20] [Illusion 14] [Coercion 8] [Toxic 5]          │
├────────────────────────────────────────────────────────────────────┤
│ THREATS GRID (3-column on desktop, 1-column mobile)                  │
│                                                                       │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                    │
│ │ #1 TRENDING │ │ #2          │ │ #3          │                    │
│ │ [Card]      │ │ [Card]      │ │ [Card]      │                    │
│ └─────────────┘ └─────────────┘ └─────────────┘                    │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                    │
│ │ #4          │ │ #5          │ │ #6          │                    │
│ │ [Card]      │ │ [Card]      │ │ [Card]      │                    │
│ └─────────────┘ └─────────────┘ └─────────────┘                    │
│                                                                       │
│ (Pagination at bottom)                                               │
└────────────────────────────────────────────────────────────────────┘
```

### Top stats strip (`ThreatStatsPanel` component)

Four prominent stat cards showing:

1. **Total Threats**: `47` (large number, label below)
2. **Total Victims**: `145,632` Singaporeans affected
3. **Total Losses**: `S$1.34 billion` lost
4. **Active Families**: `4` threat families

Each card:
- Pixel-art bordered card
- Large monospace number with subtle glow
- Small label below
- Amber accent for losses (matches the threats pillar color: `--color-threats: #FFB800`)

### Search bar

- Wide input at top
- Pixel-style border
- Placeholder: "Search by name, keyword, or pattern..."
- Live filter as user types (debounced 300ms)
- Clear button (X) when text present

### Family filter pills

Horizontal pill row showing:
- "All 47" (default selected)
- "Phantom 20" (magenta/pink color)
- "Illusion 14" (purple color)
- "Coercion 8" (red-orange color)
- "Toxic 5" (lime-yellow color)

Active pill has glow + brighter border. Click to filter.

### Sort dropdown

Options:
- 🔥 Trending Now (default)
- 📅 Most Recent
- 👥 Most Victims
- 💰 Highest Losses
- 🔤 Alphabetical

### Threat cards (`ThreatCard` component)

Each card displays:

```
┌────────────────────────────────────────┐
│ #1 TRENDING       [CRITICAL] [Phantom] │  ← Rank + badges
├────────────────────────────────────────┤
│                                          │
│ Job Scam – Task-Based Commission Fraud  │  ← Name (pixel font)
│                                          │
│ Earn commission for liking posts,        │  ← Short description
│ reviewing hotels... [continues]         │
│                                          │
├────────────────────────────────────────┤
│ 👥 9,914 victims                         │  ← Stats row
│ 💰 S$135.7 million lost                  │
│ 📅 Updated Dec 2023                      │
├────────────────────────────────────────┤
│ Keywords: online job, commission, ...   │  ← Top 5 keywords
├────────────────────────────────────────┤
│ [→ View Details]                         │  ← Click anywhere to navigate
└────────────────────────────────────────┘
```

**Card styling:**
- Pixel-style border in family color
- Hover: lift up 4px, glow intensifies, slight scale 1.02
- Click anywhere on card → navigate to `/threats/:id`
- Card has subtle inner glow matching family color
- "#1 TRENDING" badge in top-left corner (gold/amber)
- Prevalence badge (CRITICAL/HIGH/MEDIUM/LOW) with appropriate color
- Family badge (Phantom/Illusion/Toxic/Coercion) with family color

### Prevalence badges

| Prevalence | Color | Style |
|---|---|---|
| CRITICAL | Bright red `#FF3838` | Pulsing animation |
| HIGH | Red `#FF6B6B` | Static |
| MEDIUM | Amber `#FFB800` | Static |
| LOW | Grey `#9CA3AF` | Static |

### Family badges (use existing colors)

| Family | Color | Display Name |
|---|---|---|
| Phantom | `#FF2E63` | Phantom |
| Illusion | `#9333EA` | Illusion |
| Toxic | `#A3E635` | Toxic |
| Coercion | `#F97316` | Coercion |

### Loading state

While fetching:
- Show skeleton cards (greyed placeholders pulsing)
- 6 skeleton cards in the same grid layout

### Empty state

If filters return no results:
- Show pixel art "no results" icon
- Message: "No threats match your search"
- Button: "Clear Filters"

### Pagination

If more than 50 threats (won't happen with current data but plan for it):
- Numbered pagination at bottom
- Pixel-style buttons
- Show: `< 1 2 3 ... 10 >`

---

## 10. FRONTEND — DETAIL SCREEN

### File: `client/src/pages/Threats/ThreatDetail.js`

### Route: `/threats/:id`

### Page layout

```
┌────────────────────────────────────────────────────────────────────┐
│ [← Back to Threats]                                                  │
├────────────────────────────────────────────────────────────────────┤
│ HEADER (massive)                                                     │
│                                                                       │
│ [Phantom] [CRITICAL] [Phishing]                                      │
│ Job Scam – Task-Based Commission Fraud                               │
│ "Scammers offer victims online jobs..."                              │
│                                                                       │
│ 9,914 victims · S$135.7M lost · Reported since 2022                  │
├────────────────────────────────────────────────────────────────────┤
│ TWO COLUMN LAYOUT                                                    │
│                                                                       │
│ ┌─────────────────────────┐  ┌────────────────────────────────────┐│
│ │ LEFT: Main content       │  │ RIGHT: Sidebar                     ││
│ │                          │  │                                     ││
│ │ • Description            │  │ • Quick Stats                       ││
│ │ • Target Demographic     │  │ • Sources Cited                     ││
│ │ • Red Flags (list)       │  │ • Action Buttons                    ││
│ │ • Sample Messages        │  │ • Related Threats                   ││
│ │ • Legitimacy Contrast    │  │ • Share buttons                     ││
│ │ • Prevention Tips        │  │                                     ││
│ │ • Reporting Channels     │  │                                     ││
│ └─────────────────────────┘  └────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────┘
```

### Header section

**Top row badges (horizontal):**
- Family badge (Phantom)
- Prevalence badge (CRITICAL — with pulse)
- Category badge (Phishing)

**Title (massive):**
- Threat name in large pixel font
- Drop-shadow glow in family color

**Subtitle:**
- First sentence of description in italic
- Slightly muted color

**Stats row:**
- 👥 X victims
- 💰 X lost
- 📅 Reported since X
- 🔄 Last updated X

### Left column: Main content

**1. Description section**
- Title: "📋 OVERVIEW"
- Full description from knowledge base
- Pixel-bordered card

**2. Target Demographic**
- Title: "🎯 WHO IT TARGETS"
- The `targetDemographic` field from knowledge base
- Highlighted in amber

**3. Red Flags section (PROMINENT)**
- Title: "🚩 RED FLAGS — WHAT TO WATCH FOR"
- List of red flags from `redFlags` array
- Each flag in a pixel-style card with:
  - Red warning icon
  - Bold flag text
  - Hover effect
- Stagger-fade animation on load

**4. Sample Messages section (the IMPORTANT part)**
- Title: "💬 SAMPLE SCAM MESSAGES"
- Subtitle: "Real examples of how this scam appears"
- Each sample text from `sampleTexts` displayed in a chat-bubble style:
  - Phone/message app aesthetic
  - Monospace font
  - Pixel border
  - Annotation: "🚩 NOT a real message — example of scam pattern"
- This is the most educational element — users learn to recognize the scam

**5. Legitimacy Contrast**
- Title: "✅ HOW THE REAL VERSION DIFFERS"
- The `legitimacyContrast` field
- Green-bordered card
- Explains how to distinguish scam from legit

**6. Prevention Tips**
- Title: "🛡️ HOW TO PROTECT YOURSELF"
- Numbered list from `preventionTips`
- Each tip in pixel-styled card
- Cyan accent

**7. Reporting Channels**
- Title: "📢 WHERE TO REPORT"
- Cards for each reporting channel
- Each card:
  - Method name (e.g., "ScamShield App")
  - Action (e.g., "Block & Report")
  - Click → opens relevant link/tel: action

### Right sidebar (sticky on desktop)

**1. Quick Stats panel**
- Confirmed Victims: `9,914`
- Estimated Loss: `S$135.7 million`
- First Reported: `2022-01-01`
- Last Updated: `2023-12-31`
- Each stat with icon and value

**2. Sources Cited panel**
- Title: "📚 OFFICIAL SOURCES"
- For each source in `sources` array:
  - Organization (SPF, ScamShield, CSA, etc.)
  - Source name
  - Date
  - Link (clickable, opens in new tab)
  - If URL empty, use organization homepage from default map

**3. Action Buttons (sticky bottom of sidebar)**

Big prominent buttons:
- 🚨 **Report Similar Scam** → opens ScamShield link
- 📞 **Call Anti-Scam Hotline 1799** → `tel:1799`
- 💬 **WhatsApp ScamShield** → wa.me link (`+65 9-SCAMSHIELD`)
- 🔖 **Bookmark for Later** (if you implemented bookmarks)
- 📤 **Share This Threat** → copy URL or social share

**4. Related Threats**
- Title: "🔗 SIMILAR THREATS"
- 3-5 related threat cards (smaller version of ThreatCard)
- Click → navigate to that threat's detail page

### Default URL mapping for sources

Some sources have empty URLs. Use organization homepage as fallback:

```javascript
const ORG_DEFAULT_URLS = {
  'SPF': 'https://www.police.gov.sg',
  'ScamShield': 'https://www.scamshield.gov.sg',
  'CSA': 'https://www.csa.gov.sg',
  'MAS': 'https://www.mas.gov.sg',
  'IRAS': 'https://www.iras.gov.sg',
  'LTA': 'https://www.lta.gov.sg',
  'ICA': 'https://www.ica.gov.sg',
  'NCPC': 'https://www.ncpc.org.sg',
  'MOM': 'https://www.mom.gov.sg',
  'IMDA': 'https://www.imda.gov.sg'
};
```

### Animations

- Header section fades in from top
- Red flags slide in one-by-one (50ms stagger)
- Sample messages slide in from left
- Sources fade in stagger
- Related threats slide in from bottom

### Error states

- 404: "Threat not found" with link back to listing
- Network error: "Unable to load threat details" with retry button

---

## 11. FRONTEND — STATS DASHBOARD SCREEN

### File: `client/src/pages/Threats/ThreatDashboard.js`

### Route: `/threats/dashboard`

### Page layout

```
┌────────────────────────────────────────────────────────────────────┐
│ HEADER: "SINGAPORE THREAT LANDSCAPE"                                 │
│ "Live aggregate intelligence from 47 documented threats"             │
├────────────────────────────────────────────────────────────────────┤
│ HERO STATS (4 huge cards)                                            │
│ [47 Threats] [145,632 Victims] [S$1.34B Lost] [4 Families]          │
├────────────────────────────────────────────────────────────────────┤
│ TWO COLUMN LAYOUT                                                    │
│                                                                       │
│ ┌─────────────────────┐  ┌─────────────────────────────────────┐  │
│ │ Distribution by     │  │ Top Trending This Week               │  │
│ │ Family (pie chart)  │  │                                       │  │
│ │                     │  │ 1. Job Scam Commission                │  │
│ │ • Phantom 42%       │  │    9,914 victims, S$135.7M           │  │
│ │ • Illusion 30%      │  │                                       │  │
│ │ • Coercion 17%      │  │ 2. Government Officials Impersonation │  │
│ │ • Toxic 11%         │  │    ...                                │  │
│ │                     │  │                                       │  │
│ │                     │  │ 3-10. (continued list)                │  │
│ └─────────────────────┘  └─────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────┤
│ TOP 5 BY VICTIMS (horizontal bar chart)                              │
├────────────────────────────────────────────────────────────────────┤
│ TOP 5 BY FINANCIAL LOSS (horizontal bar chart)                       │
├────────────────────────────────────────────────────────────────────┤
│ SOURCES ATTRIBUTION                                                  │
│ Where our threat intel comes from:                                   │
│ • SPF: 28 entries                                                    │
│ • ScamShield: 12 entries                                             │
│ • CSA: 5 entries                                                     │
│ • IRAS: 2 entries                                                    │
├────────────────────────────────────────────────────────────────────┤
│ RECENTLY UPDATED (5 most recent threats)                             │
└────────────────────────────────────────────────────────────────────┘
```

### Hero stats (top)

4 huge pixel-bordered cards:
- 47 documented threats
- 145,632 confirmed victims (sum)
- S$1.34 billion in losses (parsed sum)
- 4 attack families

### Family distribution chart

**Without library (CSS-only):**
- Horizontal stacked bar
- Each segment colored by family
- Width proportional to count
- Labels show count and percentage

**With recharts (if you installed):**
- Pie chart with custom colors
- Tooltip on hover

### Top Trending list

Top 10 threats by trending score, displayed as a numbered list:

```
1. 🔥 Job Scam – Task-Based Commission Fraud
   CRITICAL · 9,914 victims · S$135.7M lost

2. 🚨 Government Officials Impersonation (Physical Handover)
   CRITICAL · X victims · X lost

3. ...
```

Click any item → navigate to detail page.

### Top by Victims (horizontal bar chart)

Top 5 threats by `confirmedVictims`:
- Pixel-style horizontal bars
- Bar width proportional to victim count
- Show absolute number at end of bar
- Color by family

### Top by Losses (horizontal bar chart)

Top 5 threats by parsed `estimatedLoss`:
- Same style as victims chart
- Display value in S$ millions/billions

### Sources Attribution

Visual breakdown of where intel comes from:
- For each organization (SPF, ScamShield, CSA, etc.)
- Show count and percentage
- Organization logo or pixel icon
- Tooltip explaining what they cover

### Recently Updated

Cards for the 5 most recently updated threats:
- Same card style as listing
- Sorted by `lastUpdated` desc
- Shows "Updated X days ago"

---

## 12. FRONTEND — SERVICE LAYER

### File: `client/src/services/threatsService.js`

```javascript
import api from './api';

/**
 * List threats with filters.
 */
export async function getThreats({
  family,
  category,
  prevalence,
  q,
  sort = 'trending',
  limit = 50,
  offset = 0
} = {}) {
  const params = { sort, limit, offset };
  if (family) params.family = family;
  if (category) params.category = category;
  if (prevalence) params.prevalence = prevalence;
  if (q) params.q = q;
  
  const response = await api.get('/threats', { params });
  return response.data;
}

/**
 * Get trending threats (convenience).
 */
export async function getTrendingThreats() {
  const response = await api.get('/threats/trending');
  return response.data;
}

/**
 * Get full threat details by ID.
 */
export async function getThreatById(id) {
  const response = await api.get(`/threats/${id}`);
  return response.data;
}

/**
 * Get related threats for a given threat.
 */
export async function getRelatedThreats(id) {
  const response = await api.get(`/threats/${id}/related`);
  return response.data;
}

/**
 * Get aggregate statistics.
 */
export async function getThreatStats() {
  const response = await api.get('/threats/stats');
  return response.data;
}

/**
 * Get families with counts.
 */
export async function getThreatFamilies() {
  const response = await api.get('/threats/families');
  return response.data;
}

/**
 * Get categories with counts.
 */
export async function getThreatCategories() {
  const response = await api.get('/threats/categories');
  return response.data;
}

export default {
  getThreats,
  getTrendingThreats,
  getThreatById,
  getRelatedThreats,
  getThreatStats,
  getThreatFamilies,
  getThreatCategories
};
```

Uses the existing `api.js` axios instance.

---

## 13. VISUAL DESIGN REQUIREMENTS

### Color palette for Threat Briefing

The Threats Briefing pillar uses **amber accent** as its primary color:

```css
--color-threats: #FFB800;        /* Amber/yellow */
--color-threats-dim: #BB8800;
--color-threats-glow: rgba(255, 184, 0, 0.5);
```

Use this for:
- Page accent on Threat screens
- "Trending" badges
- Loss amount highlights
- CTA buttons specific to this pillar

### Pixel-art aesthetic rules

This must match the cyberpunk pixel-art aesthetic of the rest of the app:

- ❌ NO rounded corners (sharp pixel edges)
- ❌ NO smooth gradients (use stepped or solid colors)
- ❌ NO modern shadow effects (use pixel-style hard shadows)
- ✅ Pixel-style borders (2px solid)
- ✅ Glow effects via multiple box-shadows
- ✅ Press Start 2P font for headers
- ✅ JetBrains Mono for numbers and stats
- ✅ Inter for body text

### Animations (use existing animation keyframes)

- `glowPulse` — pulsing glow on prevalence badges
- `floatUpFade` — for tooltips
- `crtFlicker` — occasional flicker on stats cards
- `scanlineDrift` — background scan lines

### Background atmosphere

The Threats Briefing pages can have a slightly different atmospheric feel from the Game/FactChecker:

- Slightly more "newsroom terminal" feel
- Scrolling tickers (optional polish)
- Amber-tinted scan lines
- Subtle data-stream visualization in background

### Responsive design

- Desktop: 3-column threat grid
- Tablet: 2-column threat grid
- Mobile: 1-column stack
- Sidebar (detail page): collapses below main content on mobile

---

## 14. BUILD ORDER

Build in this exact sequence. Test after each phase.

### Phase 1 — Foundation (1 hour)

- [ ] Verify `threatKnowledgeBase.js` exists at `server/src/data/`
- [ ] Verify you can load 47 threats: `console.log(THREAT_KNOWLEDGE_BASE.length)`
- [ ] Create empty folder structure for all files
- [ ] No new dependencies to install

### Phase 2 — Backend: Ranker (1 hour)

- [ ] Build `threatRanker.js`
- [ ] Implement `parseLossToSGD()` helper
- [ ] Implement `computeTrendingScore()` function
- [ ] Implement `rankThreats()` function
- [ ] Test: `rankThreats()[0]` should be a CRITICAL threat with recent date

### Phase 3 — Backend: Searcher (1 hour)

- [ ] Build `threatSearcher.js`
- [ ] Implement `searchThreats()` function
- [ ] Implement `filterThreats()` function
- [ ] Implement `sortThreats()` function
- [ ] Implement `buildSummary()` function
- [ ] Test with sample queries

### Phase 4 — Backend: Stats Service (1 hour)

- [ ] Build `threatStats.js`
- [ ] Implement aggregate calculations (totals, by family, by prevalence)
- [ ] Implement top-by-victims and top-by-losses
- [ ] Implement sources attribution
- [ ] Test output structure matches spec

### Phase 5 — Backend: Controller & Routes (2 hours)

- [ ] Build `threatsController.js` with all endpoint handlers
- [ ] Build `threatsRoutes.js` with route definitions
- [ ] Mount in `server/src/routes/index.js`
- [ ] Test all endpoints with Postman/curl:
  - GET `/api/threats` (with various filters)
  - GET `/api/threats/trending`
  - GET `/api/threats/:id`
  - GET `/api/threats/:id/related`
  - GET `/api/threats/stats`
  - GET `/api/threats/families`
  - GET `/api/threats/categories`

### Phase 6 — Frontend Service (30 min)

- [ ] Build `threatsService.js`
- [ ] All 7 functions
- [ ] Test from browser console

### Phase 7 — Frontend: Shared Components (2 hours)

- [ ] Build `PrevalenceBadge.js` (LOW/MEDIUM/HIGH/CRITICAL)
- [ ] Build `FamilyBadge.js` (Phantom/Illusion/Toxic/Coercion)
- [ ] Build `ThreatCard.js` (used in listing)
- [ ] Build `ThreatStatsPanel.js` (used in listing top)
- [ ] Test individually with sample data

### Phase 8 — Frontend: Listing Screen (3 hours)

- [ ] Build `ThreatsList.js` + CSS
- [ ] Implement top stats strip
- [ ] Implement search bar with debounced filtering
- [ ] Implement family filter pills
- [ ] Implement sort dropdown
- [ ] Implement threat grid (responsive)
- [ ] Loading states (skeleton cards)
- [ ] Empty state
- [ ] Pagination (if needed)
- [ ] Wire up to backend

### Phase 9 — Frontend: Detail Components (2 hours)

- [ ] Build `RedFlagsList.js`
- [ ] Build `ScamMessageSample.js`
- [ ] Build `PreventionTipsList.js`
- [ ] Build `SourceCitation.js`
- [ ] Build `RelatedThreats.js`

### Phase 10 — Frontend: Detail Screen (3 hours)

- [ ] Build `ThreatDetail.js` + CSS
- [ ] Header section with all badges
- [ ] Left column: description, target demo, red flags
- [ ] Middle: sample messages (chat-bubble style)
- [ ] Middle: legitimacy contrast, prevention tips, reporting channels
- [ ] Right sidebar: stats, sources, action buttons, related
- [ ] Wire up action buttons (Report, Call 1799, Share)
- [ ] Animations (stagger fade-in)

### Phase 11 — Frontend: Stats Dashboard (2-3 hours)

- [ ] Build `ThreatDashboard.js` + CSS
- [ ] Hero stats (4 huge cards)
- [ ] Family distribution chart
- [ ] Top Trending list
- [ ] Top by Victims bar chart
- [ ] Top by Losses bar chart
- [ ] Sources attribution
- [ ] Recently Updated cards

### Phase 12 — Route Registration (15 min)

- [ ] Register 3 routes in `client/src/App.js`:
  - `/threats` → ThreatsList
  - `/threats/dashboard` → ThreatDashboard
  - `/threats/:id` → ThreatDetail
- [ ] Test navigation between routes works

### Phase 13 — Polish (2-3 hours)

- [ ] Add animations to all screens
- [ ] Test mobile responsive
- [ ] Test all filter combinations
- [ ] Test all sort options
- [ ] Test deep linking to specific threats
- [ ] Test browser back button works correctly
- [ ] Fix any console errors
- [ ] Coordinate with team for consistent visual feel

### Phase 14 — Demo Prep (1 hour)

- [ ] Walk through demo flow
- [ ] Memorize 2-3 specific threats to highlight
- [ ] Practice search and filter on demo
- [ ] Test on demo laptop

---

## 15. TESTING CHECKLIST

### Backend tests

- [ ] Knowledge base loads 47 threats
- [ ] Trending ranker produces sensible top 10
- [ ] Trending score correctly weights prevalence + recency + victims + losses
- [ ] Search finds threats by name
- [ ] Search finds threats by keyword
- [ ] Search finds threats by red flag text
- [ ] Family filter works for all 4 families
- [ ] Category filter works
- [ ] Prevalence filter works
- [ ] Combined filters work (family + prevalence)
- [ ] All 5 sort options work
- [ ] Pagination respects limit and offset
- [ ] GET /api/threats/:id returns full threat object
- [ ] GET /api/threats/:id with invalid ID returns 404
- [ ] GET /api/threats/:id/related returns 3-5 related threats
- [ ] Stats aggregation totals are correct
- [ ] Loss parsing handles million/billion units correctly

### Frontend tests

- [ ] Listing page loads with 47 threats by default
- [ ] Stats strip shows correct numbers
- [ ] Search bar filters live as you type
- [ ] Family pill clicks correctly filter
- [ ] Sort dropdown reorders results
- [ ] Clicking threat card navigates to detail
- [ ] Detail page renders all sections
- [ ] Red flags display with stagger animation
- [ ] Sample messages look like real chat bubbles
- [ ] Sources are clickable (open in new tab)
- [ ] Action buttons trigger correct actions:
  - "Report" → opens ScamShield URL
  - "Call 1799" → triggers tel: link
  - "WhatsApp" → opens wa.me link
  - "Share" → copies URL to clipboard
- [ ] Related threats show 3-5 cards
- [ ] Related threat clicks navigate correctly
- [ ] Dashboard renders all sections
- [ ] Charts display data correctly
- [ ] Mobile responsive (single column)
- [ ] Loading states show skeleton cards
- [ ] Empty state shows when no results
- [ ] Browser back button works

### Demo readiness

- [ ] Test on demo laptop with full data
- [ ] Try searching for "IRAS" → should find IRAS phishing threat
- [ ] Filter Phantom → should show 20 threats
- [ ] Click trending #1 → see full detail
- [ ] Check sources are clickable
- [ ] Mobile responsive on phone
- [ ] No console errors

---

## 16. DEMO DAY STRATEGY

### Pre-demo checklist

The day before submission:

1. Test all 3 screens render correctly
2. Pre-pick 3 specific threats to highlight in demo
3. Test search and filter combinations
4. Charge laptop, test on demo internet
5. Memorize 3-4 stats to drop in the pitch

### Demo flow (60-90 seconds)

> "This is the Trending Threats Board. The intelligence layer of Sentinel SG."

[1] Land on listing page.

> "We've documented 47 active Singapore scams, ranked by what's trending right now. Look at this — Singapore lost over S$1.3 billion to these scams. 145,000+ victims documented."

[2] Click the family filter "Phantom".

> "We classify threats into 4 attack families. Phantom is the impersonation family — fake government officials, banks, friends. 20 documented patterns alone."

[3] Click trending #1.

> "Let's look at the top trending threat. Job scam — task-based commission fraud. 9,914 victims, S$135.7 million lost. Real numbers from the SPF Annual Brief."

[4] Scroll to sample messages.

> "Here are real examples of how this scam appears. We show users the exact patterns so they can recognize them."

[5] Scroll to sources.

> "Every threat is sourced. SPF, ScamShield, CSA. We don't make this stuff up — it's curated from official Singapore agencies."

[6] (Optional) Show dashboard.

> "And here's the bird's-eye view of the entire threat landscape. Family distribution, top by victims, top by losses, sources attribution."

### Key talking points

- **"47 documented active Singapore threats"** — concrete authoritative number
- **"S$1.3 billion in confirmed losses"** — gravitational stat
- **"Real victim counts from SPF data"** — proves credibility
- **"Sourced from SPF, ScamShield, CSA — three Singapore authorities"** — trust signal
- **"Updated continuously"** — implies live (even though static for hackathon)
- **"Same data powers the AI Fact-Checker"** — pillar synergy story

### The killer line

> "We don't just tell users that scams exist. We show them WHAT scams are hitting Singapore RIGHT NOW, with the exact patterns to look out for, sourced from the agencies they trust."

### If something goes wrong

- Backend down → static demo data
- Frontend bug → reload, try different threat
- Slow load → comment on data while it loads

---

## 🚫 FINAL REMINDER: STAY IN YOUR LANE

You are building **only** the Threat Briefing pillar.

**Files you touch:**
- New files in `server/src/services/threats/`, `server/src/controllers/threatsController.js`, `server/src/routes/threatsRoutes.js`
- New files in `client/src/pages/Threats/`, `client/src/components/threats/`, `client/src/services/threatsService.js`
- Optional: `bookmarked_threats` table (skip for v1)

**Files you DO NOT touch:**
- Anything related to Game pillar (Battle, Codex, Training, TAP, PVP, Customisation, Dictionary, Campaign Map, etc.)
- Anything related to AI Fact-Checker (Upload, Analysing, Result screens, dual-agent backend, factcheck service files)
- `threatKnowledgeBase.js` — READ from it, never EDIT it
- Existing auth files (login, signup, JWT middleware, AuthContext)
- Existing User, Battle, Mission, Creature, etc. models
- Existing routes outside `/api/threats/*`
- Existing design system CSS variables
- Existing Navbar, Footer, layout components
- The `users` table or any other existing table

**Files you EDIT (carefully, ONLY to register routes):**
- `server/src/routes/index.js` — add ONE line to mount threatsRoutes
- `client/src/App.js` — add 3 routes for the threat pages

If unsure whether something is in scope, **ask the team lead before modifying it**.

---

**END OF SPECIFICATION**

This document is your complete reference. Build phase-by-phase using Section 14. Test at every phase using Section 15. Demo with confidence using Section 16.

The Threats Briefing pillar is the most data-rich, visually impressive pillar to demo because every number is real Singapore intel. Make it look like a serious threat intelligence dashboard.

Good luck. 🛡️
