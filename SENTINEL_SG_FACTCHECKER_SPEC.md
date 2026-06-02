# SENTINEL SG — AI Fact-Checker Pillar Implementation Spec

**Companion to**: `SENTINEL_SG_SPEC.md` and `SENTINEL_SG_GAME_DEEP_DIVE.md`
**Purpose**: Complete implementation guide for the AI Fact-Checker pillar with OpenRouter + RAG
**For**: Kiro IDE / human developers
**Last updated**: June 2026

---

## ⚠️ READ THIS FIRST

This document is the **complete specification** for the AI Fact-Checker pillar of Sentinel SG. It uses:

- **OpenRouter** as the AI provider (not direct Claude API)
- **Keyword-based RAG** with a curated Singapore threat knowledge base
- **Dual-agent architecture** (Detector + Skeptic)
- **Plain JavaScript** — no TypeScript
- **Existing Express + MySQL backend** — no new infrastructure

The knowledge base content (`threatKnowledgeBase.js`) will be **populated from PDF source materials provided later**. For now, build the structure with placeholder data and the system will work once real data is added.

---

## 📋 TABLE OF CONTENTS

1. [Architecture Overview](#1-architecture-overview)
2. [OpenRouter Setup](#2-openrouter-setup)
3. [File Structure](#3-file-structure)
4. [Knowledge Base Structure](#4-knowledge-base-structure)
5. [Retrieval System](#5-retrieval-system)
6. [Detector Agent](#6-detector-agent)
7. [Skeptic Agent](#7-skeptic-agent)
8. [Consensus Engine](#8-consensus-engine)
9. [Preprocessing Pipeline](#9-preprocessing-pipeline)
10. [API Endpoints](#10-api-endpoints)
11. [Database Schema](#11-database-schema)
12. [Frontend Implementation](#12-frontend-implementation)
13. [Mock Mode](#13-mock-mode)
14. [Build Order](#14-build-order)
15. [Testing Checklist](#15-testing-checklist)

---

## 1. ARCHITECTURE OVERVIEW

### The Pipeline (top to bottom)

```
┌─────────────────────────────────────────────────────────────────┐
│  USER UPLOADS CONTENT                                             │
│  (text, image, URL)                                               │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│  [1] PREPROCESSING                                                │
│  - Extract text from images (OpenRouter Vision)                   │
│  - Fetch URL content (if URL input)                               │
│  - PII redaction (mask phones, NRIC, emails)                      │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│  [2] RAG RETRIEVAL                                                │
│  - Search threat knowledge base                                   │
│  - Keyword matching + scoring                                     │
│  - Return top 3 matching threats                                  │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│  [3] DETECTOR AGENT (AI call #1 via OpenRouter)                   │
│  - Receives: content + retrieved threats                          │
│  - Returns: initial verdict with citations                        │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│  [4] SKEPTIC AGENT (AI call #2 via OpenRouter)                    │
│  - Receives: content + threats + Detector's verdict               │
│  - Returns: agreement, adjusted verdict                           │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│  [5] CONSENSUS ENGINE                                             │
│  - Combine both responses                                         │
│  - Calculate final confidence                                     │
│  - Build user-facing verdict                                      │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│  [6] SAVE TO DATABASE                                             │
│  - Write to factcheck_history                                     │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│  [7] RETURN TO FRONTEND                                           │
│  - User sees verdict with cited Singapore sources                 │
└─────────────────────────────────────────────────────────────────┘
```

### Why this architecture wins for the demo

1. **RAG = real Singapore knowledge**: AI cites SPF/ScamShield/CSA sources, not generic warnings
2. **Dual-agent = trustworthy**: One AI can be wrong; two AIs disagreeing flags uncertainty
3. **OpenRouter = flexibility**: Can swap between Claude/GPT/Gemini without code changes
4. **Mock mode = demo-safe**: If API fails during pitch, fallback to pre-defined verdicts

---

## 2. OPENROUTER SETUP

### Why OpenRouter

OpenRouter is a unified API for many AI models. One API key, access to Claude, GPT-4, Gemini, and 100+ others. Your premium subscription gives you generous rate limits and free credits.

### Getting started

1. Sign up at https://openrouter.ai
2. Get your API key from https://openrouter.ai/keys
3. Decide which model to use as default

### Recommended models for this project

| Use case | Recommended model | Why |
|---|---|---|
| Detector + Skeptic (text analysis) | `anthropic/claude-3.5-sonnet` | Best reasoning, strong Singapore context |
| Image OCR (vision) | `anthropic/claude-3.5-sonnet` | Best vision quality |
| Budget alternative | `google/gemini-pro-1.5` | Cheaper, good quality |
| Free tier testing | `meta-llama/llama-3.1-70b-instruct:free` | Free, decent quality |

For your premium account, **use `anthropic/claude-3.5-sonnet` for both agents**. Best results.

### API format

it uses the openrouter sdk

import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({
  apiKey: "<OPENROUTER_API_KEY>"
});

// Stream the response to get reasoning tokens in usage
const stream = await openrouter.chat.send({
  model: "anthropic/claude-sonnet-4.6",
  messages: [
    {
      role: "user",
      content: "How many r's are in the word 'strawberry'?"
    }
  ],
  stream: true
});

let response = "";
for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    response += content;
    process.stdout.write(content);
  }

  // Usage information comes in the final chunk
  if (chunk.usage) {
    console.log("\nReasoning tokens:", chunk.usage.reasoningTokens);
  }
}
sample code

### Environment variables

Add these to `server/.env`:

```
# OpenRouter API
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL_DETECTOR=anthropic/claude-3.5-sonnet
OPENROUTER_MODEL_SKEPTIC=anthropic/claude-3.5-sonnet
OPENROUTER_MODEL_VISION=anthropic/claude-3.5-sonnet
OPENROUTER_SITE_URL=https://sentinel-sg.vercel.app
OPENROUTER_APP_NAME=Sentinel SG

# Fact-checker config
FACTCHECK_MODE=live
FACTCHECK_MAX_FILE_SIZE_MB=10
FACTCHECK_TIMEOUT_MS=30000
FACTCHECK_MIN_PROCESSING_TIME_MS=3000
```

### Required HTTP headers for OpenRouter

OpenRouter requires these headers on every request:

- `Authorization: Bearer YOUR_API_KEY`
- `HTTP-Referer: YOUR_APP_URL` (for ranking on openrouter.ai)
- `X-Title: YOUR_APP_NAME` (for ranking)
- `Content-Type: application/json`

---

## 3. FILE STRUCTURE

Create these files in your existing project structure:

```
server/src/
├── controllers/
│   └── factCheckController.js              # HTTP handler
├── routes/
│   └── factCheckRoutes.js                  # Route definitions
├── services/
│   └── factCheck/
│       ├── orchestrator.js                 # Main pipeline runner
│       ├── openRouterClient.js             # OpenRouter API wrapper
│       ├── preprocessor.js                 # OCR, URL fetch, PII redaction
│       ├── retriever.js                    # RAG retrieval logic
│       ├── detectorAgent.js                # Agent 1
│       ├── skepticAgent.js                 # Agent 2
│       ├── consensusEngine.js              # Combine agents
│       ├── mockProvider.js                 # Fallback for demo safety
│       └── prompts/
│           ├── detectorPrompt.js           # Detector prompt template
│           └── skepticPrompt.js            # Skeptic prompt template
├── data/
│   └── threatKnowledgeBase.js              # The RAG knowledge base
└── middleware/
    └── factCheckUpload.js                  # Multer for file uploads

client/src/
├── pages/
│   └── FactCheck/
│       ├── FactCheckUpload.js              # Screen 1: input
│       ├── FactCheckUpload.css
│       ├── FactCheckAnalysing.js           # Screen 2: loading
│       ├── FactCheckAnalysing.css
│       ├── FactCheckResult.js              # Screen 3: verdict
│       ├── FactCheckResult.css
│       ├── FactCheckHistory.js             # Optional: past analyses
│       └── FactCheckHistory.css
├── components/
│   └── factcheck/
│       ├── FileDropzone.js                 # Drag-drop file upload
│       ├── AgentPipeline.js                # Visual agent progress
│       ├── VerdictBanner.js                # Big verdict display
│       ├── RedFlagsList.js                 # Detected issues
│       ├── AgentComparison.js              # Side-by-side agent views
│       ├── SourceCitations.js              # Cited Singapore sources
│       ├── ActionButtons.js                # Report / Call 1799
│       └── DidYouKnow.js                   # Rotating facts
├── services/
│   └── factCheckService.js                 # Frontend API client
└── data/
    └── didYouKnowFacts.js                  # Loading screen facts
```

---

## 4. KNOWLEDGE BASE STRUCTURE

This is the heart of the RAG system.

### File: `server/src/data/threatKnowledgeBase.js`

Each entry follows this structure:

```javascript
{
  // === IDENTIFICATION ===
  id: 'unique_threat_id',                    // Snake_case, unique
  name: 'Human-Readable Threat Name',
  
  // === CATEGORIZATION ===
  category: 'phishing',                       // phishing | impersonation | investment_scam | etc
  family: 'phantom',                          // phantom | illusion | toxic | coercion
  
  // === RETRIEVAL FIELDS (for matching user content) ===
  keywords: [                                 // Keywords to match in user content
    'IRAS',
    'refund',
    'tax rebate',
    'verify your account',
    'unclaimed refund'
  ],
  sampleTexts: [                              // Example scam messages of this type
    'IRAS: You have an unclaimed refund of S$842. Click here to verify.',
    'Dear taxpayer, your refund of S$1,200 is pending. Verify within 24 hours.',
  ],
  patternRegex: [                             // Optional regex patterns
    '/S\\$\\d+/',                             // Singapore dollar amounts
    '/\\bclick here\\b/i',
  ],
  
  // === AI CONTEXT FIELDS (sent to agents) ===
  description: 'Detailed description of how this scam operates...',
  targetDemographic: 'Singapore taxpayers, especially elderly and first-time filers',
  redFlags: [
    'Sender ID claims "IRAS-GOV" but real IRAS uses "IRAS" or "IRASSG"',
    'Link uses non-.gov.sg domain',
    'Artificial urgency (24-48 hour deadline)',
    'Specific dollar amounts to seem legitimate',
    'Requests clicking external links (real IRAS never does this)'
  ],
  legitimacyContrast: 'Real IRAS communications: do NOT include clickable links for refunds; use sender IDs "IRAS" or "IRASSG"; refunds processed through MyTax Portal only',
  
  // === STATISTICS (for citations) ===
  prevalence: 'CRITICAL',                     // LOW | MEDIUM | HIGH | CRITICAL
  firstReported: '2026-04-15',
  lastUpdated: '2026-05-20',
  confirmedVictims: 1247,
  estimatedLoss: 'S$2.3 million',
  
  // === SOURCE CITATIONS ===
  sources: [
    {
      name: 'ScamShield Bulletin May 2026',
      organization: 'National Crime Prevention Council',
      url: 'https://www.scamshield.gov.sg/2026-scams-bulletins',
      date: '2026-05-01'
    },
    {
      name: 'SPF Annual Scams Brief 2025',
      organization: 'Singapore Police Force',
      url: 'https://www.police.gov.sg/Media-Room/Statistics',
      date: '2026-02-25'
    }
  ],
  
  // === USER ACTION ITEMS ===
  preventionTips: [
    'Open the official IRAS MyTax Portal directly, never via SMS link',
    'Verify the sender ID against IMDA Sender ID Registry',
    'Report to ScamShield app or call 1799',
    'Forward suspicious messages to ScamShield via WhatsApp +65 9-SCAMSHIELD'
  ],
  reportingChannels: [
    {
      method: 'ScamShield App',
      action: 'Report via Block & Report feature'
    },
    {
      method: 'Anti-Scam Hotline',
      action: 'Call 1799 (24/7)'
    },
    {
      method: 'WhatsApp',
      action: '+65 9-SCAMSHIELD'
    }
  ]
}
```

### Required threat categories (minimum 30 entries)

The knowledge base MUST cover these Singapore scam types. PDFs and source materials will be provided later for the actual data.

**Phantom Family (Impersonation/Phishing) — 8-10 entries**

1. `iras_refund_lure_2026` — IRAS Tax Refund Phishing
2. `ocbc_phishing_2021_pattern` — OCBC SMS Phishing (historical reference)
3. `dbs_phishing_modern` — DBS Bank Phishing variants
4. `uob_phishing_modern` — UOB Bank Phishing variants
5. `singpost_delivery_lure` — SingPost Delivery Phishing
6. `mom_workpass_scam` — MOM Work Pass Impersonation
7. `lta_parking_fine_scam` — LTA Parking Fine Phishing
8. `singpass_otp_phishing` — SingPass OTP Stealing
9. `customs_officer_impersonation` — Customs Officer Phishing
10. `ica_visa_threat` — ICA Visa-Related Phishing

**Illusion Family (Deepfakes/Voice Clones) — 4-6 entries**

11. `ai_voice_clone_family_emergency` — AI Voice Clone Scams
12. `deepfake_celebrity_investment` — Deepfake Investment Endorsements
13. `deepfake_government_official` — Deepfake Government Officials
14. `synthetic_romance_profile` — AI-Generated Romance Scam Profiles

**Toxic Family (Manipulation/Social Engineering) — 6-8 entries**

15. `fake_friend_call_scam` — "Hey, do you remember me?" calls
16. `whatsapp_friend_impersonation` — Hijacked WhatsApp accounts
17. `investment_group_tips_scam` — Crypto/stock tip group scams
18. `work_from_home_job_scam` — Fake remote job offers
19. `loan_shark_harassment` — Illegal moneylender harassment
20. `crypto_pump_dump` — Cryptocurrency pump-and-dump schemes
21. `romance_scam_traditional` — Long-form romance scams

**Coercion Family (Threats/Pressure) — 6-8 entries**

22. `police_impersonation_drug_allegation` — Fake police drug accusations
23. `police_impersonation_money_laundering` — Money laundering allegations
24. `bank_card_block_threat` — Fake bank card freeze threats
25. `sextortion_image_threat` — Sextortion / image-based abuse
26. `tech_support_takeover` — Fake tech support remote access
27. `kidnap_hoax_scam` — Fake kidnapping ransom calls

### Placeholder content note

Until PDFs are provided, populate each entry with:
- Realistic keywords based on the threat type
- Plausible Singapore-specific descriptions
- Standard red flags for that scam family
- Generic source placeholders that reference real Singapore agencies

**Mark each placeholder entry with `_placeholder: true` so they can be replaced when real data arrives.**

### Example placeholder entry

```javascript
{
  id: 'iras_refund_lure_2026',
  _placeholder: true,                         // FLAG FOR REPLACEMENT
  
  name: 'IRAS Refund Lure 2026',
  category: 'phishing',
  family: 'phantom',
  
  keywords: ['IRAS', 'refund', 'tax', 'unclaimed', 'verify', 'tax rebate'],
  sampleTexts: [
    'IRAS: You have an unclaimed tax refund of S$842. Click here to verify.',
  ],
  
  description: 'PLACEHOLDER: Scammers impersonate IRAS claiming the recipient has an unclaimed tax refund. Real data will be added from ScamShield PDF.',
  
  redFlags: [
    'Sender ID format suspicious',
    'Includes clickable link to claim refund',
    'Urgency-based language',
  ],
  
  prevalence: 'HIGH',
  firstReported: '2026-04-15',
  
  sources: [
    {
      name: 'ScamShield Monthly Bulletin (PLACEHOLDER)',
      organization: 'National Crime Prevention Council',
      url: 'https://www.scamshield.gov.sg/2026-scams-bulletins',
      date: '2026-05-01'
    }
  ],
  
  preventionTips: [
    'Verify via official IRAS MyTax Portal',
    'Never click links in tax-related SMS',
    'Report to ScamShield',
  ]
}
```

---

## 5. RETRIEVAL SYSTEM

### File: `server/src/services/factCheck/retriever.js`

Purpose: Given user content, find the top N most relevant threats from the knowledge base.

### Function signature

```javascript
/**
 * Retrieve the most relevant threats for the given content.
 * @param {string} content - The user's preprocessed content (text)
 * @param {object} options - { topN: 3, minScore: 5 }
 * @returns {Array<{threat, score, matchedKeywords}>}
 */
function retrieveThreats(content, options = {}) { ... }
```

### Scoring algorithm

For each threat in the knowledge base, calculate a relevance score:

**Base scoring:**
- For each keyword that appears in content (case-insensitive): **+10 points**
- For each unique keyword matched (deduplicated): **+5 points** (rewards diversity of matches)

**Sample text similarity bonus:**
- For each sample text, calculate Jaccard similarity with content
- Add `similarity * 20` (max +20 per sample)

**Pattern regex bonus:**
- For each regex that matches the content: **+8 points**

**Prevalence boost (multiplier on final score):**
- `CRITICAL` prevalence: × 1.5
- `HIGH` prevalence: × 1.3
- `MEDIUM` prevalence: × 1.1
- `LOW` prevalence: × 1.0

**Recency boost:**
- If `lastUpdated` is within last 90 days: × 1.2

### Filtering

After scoring all threats:
1. Filter out threats with score < `minScore` (default 5)
2. Sort by score descending
3. Return top `topN` (default 3)

### Output format

```javascript
[
  {
    threat: { /* full threat object */ },
    score: 87,
    matchedKeywords: ['IRAS', 'refund', 'verify'],
    matchedSamples: 1,
    matchedPatterns: 0
  },
  // ... up to topN
]
```

### Edge cases

- If content is empty: return `[]`
- If no threats meet minScore: return `[]` (Detector will note "no known matches")
- If content is very short (< 10 chars): use lower threshold
- Always handle keywords array being empty gracefully

---

## 6. DETECTOR AGENT

### File: `server/src/services/factCheck/detectorAgent.js`

Purpose: First AI pass. Analyzes content with retrieved threat context.

### Function signature

```javascript
/**
 * Run the Detector agent on user content.
 * @param {string} content - Preprocessed user content
 * @param {Array} retrievedThreats - Output from retriever
 * @param {object|null} imageData - Base64 image if image input
 * @returns {Promise<DetectorResult>}
 */
async function runDetector(content, retrievedThreats, imageData = null) { ... }
```

### Prompt template

The Detector prompt should be assembled from these parts:

**System message:**
```
You are Agent 1: The Detector in Sentinel SG's dual-agent scam analysis system 
for Singapore residents.

YOUR ROLE
Identify whether the content provided is a scam targeting Singapore residents. 
You have access to a curated knowledge base of current Singapore threats.

YOUR APPROACH
1. Compare the user's content against retrieved threats from the knowledge base
2. Identify specific red flags and matching patterns
3. Consider Singapore-specific context (currency, agencies, banks, services)
4. Provide a verdict with calibrated confidence
5. Cite the specific Singapore sources that inform your analysis

CONFIDENCE CALIBRATION (CRITICAL — DO NOT INFLATE)
- 95-100: Definitive match with known threat, exact pattern
- 75-94: Strong indicators, very likely scam, matches family patterns
- 50-74: Suspicious elements but ambiguous, requires user judgment
- 25-49: Some concerning elements, probably benign
- 0-24: No clear scam indicators, appears legitimate

OUTPUT FORMAT
Return ONLY valid JSON. No other text. No markdown code fences. Just the JSON object.

{
  "verdict": "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "confidence": <number 0-100>,
  "matchedThreatId": "<id from knowledge base or null>",
  "threatFamily": "phantom" | "illusion" | "toxic" | "coercion" | null,
  "threatSubcategory": "<specific scam name>",
  "redFlags": ["<specific concerning element>", ...],
  "reasoning": "<2-3 sentence analysis>",
  "singaporeContext": "<what makes this Singapore-specific>",
  "citedSources": ["<source names from retrieved threats>", ...],
  "userShouldDo": ["<specific action item>", ...]
}
```

**User message (assembled dynamically):**
```
RETRIEVED SINGAPORE THREAT INTELLIGENCE:

{{for each threat in retrievedThreats:}}

MATCHED THREAT {{index + 1}}: {{threat.name}}
- ID: {{threat.id}}
- Family: {{threat.family}}
- Prevalence: {{threat.prevalence}}
- Description: {{threat.description}}
- Known Red Flags:
{{for each flag in threat.redFlags:}}
  • {{flag}}
{{end}}
- Legitimacy Contrast: {{threat.legitimacyContrast}}
- Confirmed Singapore Victims: {{threat.confirmedVictims}}
- Sources: {{threat.sources.map(s => s.name).join(', ')}}

{{end}}

{{if retrievedThreats.length === 0:}}
NO MATCHES FOUND IN KNOWLEDGE BASE. Analyze the content using general 
Singapore scam knowledge.
{{end}}

USER CONTENT TO ANALYZE:
{{content}}

Analyze the user's content against the retrieved threats. Return only the JSON 
response as specified.
```

### For image input

If `imageData` is provided, the content message must be a multimodal message with both image and text:

```javascript
{
  role: 'user',
  content: [
    {
      type: 'image_url',
      image_url: {
        url: `data:image/jpeg;base64,${imageData.base64}`
      }
    },
    {
      type: 'text',
      text: '<the assembled user message above + "The user uploaded an image. Extract the text from the image and analyze it as a potential scam.">'
    }
  ]
}
```

OpenRouter uses OpenAI-compatible message format for images.

### Response handling

The detector should:
1. Parse the JSON response (strip any markdown fences if present)
2. Validate the verdict is one of the allowed values
3. Clamp confidence to 0-100
4. Default missing fields to safe values
5. If JSON is malformed, retry once with a stricter prompt

### Output format

```javascript
{
  verdict: 'HIGH',
  confidence: 87,
  matchedThreatId: 'iras_refund_lure_2026',
  threatFamily: 'phantom',
  threatSubcategory: 'IRAS Refund Lure 2026',
  redFlags: [
    'Sender ID format does not match official IRAS pattern',
    'Contains clickable refund link (real IRAS never does this)',
    'Specific dollar amount typical of phishing'
  ],
  reasoning: 'Content closely matches the IRAS Refund Lure 2026 pattern documented in ScamShield bulletins. The specific S$842 amount and click-link instruction are signature elements.',
  singaporeContext: 'IRAS (Inland Revenue Authority of Singapore) is the legitimate tax agency. Scammers exploit citizens unfamiliar with how real IRAS communications work.',
  citedSources: ['ScamShield Bulletin May 2026', 'SPF Annual Scams Brief 2025'],
  userShouldDo: [
    'Do NOT click any links in the message',
    'Open IRAS MyTax Portal directly via your browser',
    'Report this SMS to ScamShield via the app',
    'Call 1799 if you have already engaged with the scam'
  ],
  
  // Internal metadata (not shown to user)
  _rawResponse: '...',                       // The raw AI response
  _modelUsed: 'anthropic/claude-3.5-sonnet',
  _processingTimeMs: 2340,
  _tokenUsage: { input: 1234, output: 456 }
}
```

---

## 7. SKEPTIC AGENT

### File: `server/src/services/factCheck/skepticAgent.js`

Purpose: Second AI pass. Challenges Detector's analysis.

### Function signature

```javascript
/**
 * Run the Skeptic agent to verify Detector's verdict.
 * @param {string} content - Same content Detector saw
 * @param {Array} retrievedThreats - Same threats Detector saw
 * @param {object} detectorResult - Detector's full response
 * @returns {Promise<SkepticResult>}
 */
async function runSkeptic(content, retrievedThreats, detectorResult) { ... }
```

### Prompt template

**System message:**
```
You are Agent 2: The Skeptic in Sentinel SG's dual-agent scam analysis system.

YOUR ROLE
Independently verify Agent 1's (the Detector's) findings. Challenge their 
conclusions. Look for what they missed or overreacted to.

YOUR APPROACH
- Assume Agent 1 may have been too quick to judge (either too suspicious or 
  too trusting)
- Consider alternative, benign explanations for the content
- Check if Agent 1's red flags are actually red flags or false positives
- Look for additional context Agent 1 missed
- Be willing to disagree strongly if warranted
- If Agent 1 is correct, confidently confirm and possibly raise confidence

CRITICAL JUDGMENT
- If the content is legitimately ambiguous, LOWER confidence
- If you find evidence the content might be benign, NOTE IT
- If Agent 1 missed a stronger threat pattern, FLAG IT
- Always err on the side of caution for user safety

OUTPUT FORMAT
Return ONLY valid JSON. No other text. No markdown.

{
  "agreeWithAgent1": true | false,
  "adjustedVerdict": "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "adjustedConfidence": <number 0-100>,
  "agentOneStrengths": ["<what Agent 1 got right>", ...],
  "agentOneWeaknesses": ["<what Agent 1 missed or overreacted to>", ...],
  "additionalRedFlags": ["<new concerns>", ...],
  "alternativeExplanations": ["<benign interpretations to consider>", ...],
  "skepticReasoning": "<your independent 2-3 sentence analysis>",
  "finalRecommendation": "<what user should actually do>"
}
```

**User message:**
```
AGENT 1'S ANALYSIS:
{{JSON.stringify(detectorResult, null, 2)}}

RETRIEVED SINGAPORE THREATS (same as Agent 1 saw):
{{same retrieved threats as Detector}}

ORIGINAL USER CONTENT:
{{content}}

Independently analyze this. Challenge Agent 1 where warranted. Confirm where 
correct. Return only the JSON response.
```

### Output format

```javascript
{
  agreeWithAgent1: true,
  adjustedVerdict: 'HIGH',
  adjustedConfidence: 89,
  agentOneStrengths: [
    'Correctly identified the IRAS Refund Lure pattern match',
    'Cited the right ScamShield bulletin',
    'Caught the suspicious dollar amount'
  ],
  agentOneWeaknesses: [
    'Did not mention that the URL shortener (bit.ly) is itself a red flag'
  ],
  additionalRedFlags: [
    'Use of URL shortener obscures destination — common scam tactic'
  ],
  alternativeExplanations: [],
  skepticReasoning: 'Agent 1\'s analysis is sound. The content matches multiple signature elements of IRAS Refund Lure 2026. I confirm and slightly raise confidence based on the URL shortener observation.',
  finalRecommendation: 'Treat as confirmed scam. Do not engage. Report to ScamShield immediately.',
  
  _rawResponse: '...',
  _modelUsed: 'anthropic/claude-3.5-sonnet',
  _processingTimeMs: 2890,
  _tokenUsage: { input: 1567, output: 432 }
}
```

---

## 8. CONSENSUS ENGINE

### File: `server/src/services/factCheck/consensusEngine.js`

Purpose: Combine Detector and Skeptic responses into final user-facing verdict.

### Function signature

```javascript
/**
 * Combine both agent responses into final verdict.
 * @param {DetectorResult} detector
 * @param {SkepticResult} skeptic
 * @param {Array} retrievedThreats
 * @returns {ConsensusResult}
 */
function combineResults(detector, skeptic, retrievedThreats) { ... }
```

### Logic

**Verdict ranking (most to least cautious):**
```
CRITICAL > HIGH > MEDIUM > LOW > SAFE
```

**If agents agree:**
- Use Skeptic's adjusted verdict (it had the most context)
- Confidence = average of both confidences, capped at 99
- If Skeptic raised confidence above Detector: use Skeptic's
- Mark `agentsAgreed: true`

**If agents disagree:**
- Use the **MORE CAUTIOUS** verdict (always err toward warning the user)
- Confidence = MIN(detector.confidence, skeptic.adjustedConfidence) - 10
- Clamp confidence to minimum 50 (uncertain but not safe)
- Mark `agentsAgreed: false`

**Combining red flags:**
- Union of detector.redFlags and skeptic.additionalRedFlags
- Deduplicate

**Combining sources:**
- All sources cited by either agent
- Plus sources from all retrievedThreats
- Deduplicate by source name

**Building user action items:**
- Combine detector.userShouldDo and skeptic.finalRecommendation
- Order by importance: stop engaging → verify → report → recover

### Output format

```javascript
{
  // Final user-facing verdict
  verdict: 'HIGH',                          // SAFE | LOW | MEDIUM | HIGH | CRITICAL
  confidence: 88,
  threatFamily: 'phantom',
  threatSubcategory: 'IRAS Refund Lure 2026',
  matchedThreatId: 'iras_refund_lure_2026',
  
  // Display data
  redFlags: [...],                          // Combined and deduplicated
  reasoning: 'Combined reasoning paragraph',
  userShouldDo: [...],                      // Prioritized action items
  citedSources: [                           // Full source objects with URLs
    {
      name: 'ScamShield Bulletin May 2026',
      organization: 'National Crime Prevention Council',
      url: 'https://www.scamshield.gov.sg/2026-scams-bulletins'
    },
    // ...
  ],
  
  // Meta information
  agentsAgreed: true,
  
  // Both agent views (for "side-by-side" display)
  detectorView: { /* full detector result */ },
  skepticView: { /* full skeptic result */ },
  
  // Reporting channels
  reportingChannels: [
    { method: 'ScamShield App', action: 'Block & Report' },
    { method: 'Anti-Scam Hotline', action: 'Call 1799 (24/7)' }
  ],
  
  // Internal
  _processingMs: 8230,
  _modelsUsed: ['anthropic/claude-3.5-sonnet', 'anthropic/claude-3.5-sonnet'],
  _tokenUsage: { input: 2801, output: 888 },
  _retrievedThreatCount: 3
}
```

---

## 9. PREPROCESSING PIPELINE

### File: `server/src/services/factCheck/preprocessor.js`

Purpose: Normalize user input before analysis. Handle different input types.

### Function signature

```javascript
/**
 * Preprocess user input based on type.
 * @param {object} input - { type, text?, file?, url? }
 * @returns {Promise<{ processedContent, originalType, imageBase64? }>}
 */
async function preprocess(input) { ... }
```

### Input types

**Text input:**
```javascript
{ type: 'text', text: 'IRAS: You have an unclaimed refund...' }
```

Processing:
1. Trim whitespace
2. Apply PII redaction
3. Return as `processedContent`

**Image input:**
```javascript
{ type: 'image', file: { buffer, mimetype, originalname } }
```

Processing:
1. Validate file size (max 10MB)
2. Validate mimetype (image/jpeg, image/png, image/webp, image/gif)
3. Convert buffer to base64
4. Return base64 in `imageBase64` field
5. Set `processedContent` to placeholder (Claude Vision will extract text)

**URL input:**
```javascript
{ type: 'url', url: 'https://suspicious-site.com/iras-refund' }
```

Processing:
1. Validate URL format
2. Fetch the URL with axios (10-second timeout)
3. Extract text content from HTML (use a simple regex or cheerio if available)
4. Limit to first 5000 characters
5. Apply PII redaction
6. Return as `processedContent`
7. Include URL itself in context: "URL submitted: <url>\n\nContent extracted:\n<text>"

**Note**: For URL input, also check the URL itself for suspicious patterns (URL shorteners, non-.gov.sg domains claiming to be government, etc.)

### PII Redaction rules

Apply these regex replacements BEFORE sending to AI:

```javascript
function redactPII(text) {
  return text
    // Singapore phone (8 digits)
    .replace(/\b\d{8}\b/g, '[REDACTED_PHONE]')
    // Singapore phone with +65 prefix
    .replace(/\+?65[\s-]?\d{4}[\s-]?\d{4}/g, '[REDACTED_PHONE_SG]')
    // NRIC (S/T/F/G + 7 digits + letter)
    .replace(/\b[STFG]\d{7}[A-Z]\b/gi, '[REDACTED_NRIC]')
    // Credit card numbers
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[REDACTED_CARDNUM]')
    // Email addresses
    .replace(/\b[\w._%+-]+@[\w.-]+\.\w{2,}\b/g, '[REDACTED_EMAIL]')
    // Bank account numbers (10-16 consecutive digits)
    .replace(/\b\d{10,16}\b/g, '[REDACTED_ACCOUNT]');
}
```

**Important**: Redaction happens BEFORE the AI sees the content. The AI analyzes patterns and structure, not personal data.

### Output format

```javascript
{
  processedContent: 'Sanitized text content, max 5000 chars',
  originalType: 'text' | 'image' | 'url',
  imageBase64: '...' | null,
  imageMimeType: 'image/jpeg' | null,
  originalUrl: 'https://...' | null,
  redactionCount: 3,                        // Number of items redacted
  truncated: false                          // Was content cut?
}
```

---

## 10. API ENDPOINTS

### File: `server/src/routes/factCheckRoutes.js`

### Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/factcheck/analyse` 🔒 | Submit content for analysis |
| GET | `/api/factcheck/:id` 🔒 | Get a specific past analysis |
| GET | `/api/factcheck/history` 🔒 | Get user's analysis history |
| DELETE | `/api/factcheck/:id` 🔒 | Delete a past analysis |

### POST /api/factcheck/analyse

**Request:** `multipart/form-data`

Form fields:
- `inputType`: 'text' | 'image' | 'url'
- `text`: string (required if inputType='text' or 'url')
- `file`: File (required if inputType='image')

**Response (200):**
```javascript
{
  id: 123,                                  // factcheck_history.id
  verdict: 'HIGH',
  confidence: 88,
  threatFamily: 'phantom',
  threatSubcategory: 'IRAS Refund Lure 2026',
  matchedThreatId: 'iras_refund_lure_2026',
  redFlags: [...],
  reasoning: '...',
  userShouldDo: [...],
  citedSources: [...],
  agentsAgreed: true,
  detectorView: {...},
  skepticView: {...},
  reportingChannels: [...],
  processingTimeMs: 8230
}
```

**Error responses:**
- 400: Invalid input (missing required fields, wrong file type)
- 413: File too large (>10MB)
- 429: Rate limited (more than 10 per minute or 100 per day per user)
- 500: AI API error or internal failure
- 503: OpenRouter service unavailable

### GET /api/factcheck/history

**Query parameters:**
- `limit`: number (default 20, max 50)
- `offset`: number (default 0)

**Response (200):**
```javascript
{
  total: 47,
  analyses: [
    {
      id: 123,
      verdict: 'HIGH',
      confidence: 88,
      threatSubcategory: 'IRAS Refund Lure 2026',
      inputType: 'text',
      inputPreview: 'IRAS: You have an unclaimed...',
      createdAt: '2026-06-02T10:30:00Z'
    },
    // ...
  ]
}
```

### Rate limiting

Implement per-user rate limiting:
- **10 analyses per minute** per user
- **100 analyses per day** per user
- Use in-memory tracker (simple Map keyed by userId)
- Return 429 with `Retry-After` header when exceeded

For hackathon simplicity, an in-memory tracker is fine. For production, use Redis.

---

## 11. DATABASE SCHEMA

### Update `factcheck_history` table

Run this on your Aiven MySQL database:

```sql
USE sentinel_sg;

-- Drop existing table if it has wrong structure
-- DROP TABLE IF EXISTS factcheck_history;

CREATE TABLE IF NOT EXISTS factcheck_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  
  -- Input data
  input_type ENUM('text', 'image', 'url') NOT NULL,
  input_preview TEXT,                        -- First 500 chars of processed content
  file_name VARCHAR(255),                    -- For image uploads
  source_url VARCHAR(500),                   -- For URL submissions
  
  -- Verdict
  verdict VARCHAR(20) NOT NULL,              -- SAFE, LOW, MEDIUM, HIGH, CRITICAL
  confidence INT NOT NULL,                   -- 0-100
  threat_family VARCHAR(50),
  threat_subcategory VARCHAR(100),
  matched_threat_id VARCHAR(100),            -- ID from knowledge base
  
  -- Agent responses (full JSON)
  detector_result JSON,
  skeptic_result JSON,
  agents_agreed BOOLEAN DEFAULT TRUE,
  
  -- RAG metadata
  retrieved_threat_ids JSON,                 -- Array of matched threat IDs
  retrieved_threat_count INT DEFAULT 0,
  cited_sources JSON,                        -- Array of source citation objects
  
  -- Processing metadata
  processing_time_ms INT,
  detector_tokens_used JSON,                 -- { input, output }
  skeptic_tokens_used JSON,
  model_detector VARCHAR(100),
  model_skeptic VARCHAR(100),
  used_mock_mode BOOLEAN DEFAULT FALSE,
  
  -- Error tracking
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, created_at DESC),
  INDEX idx_verdict (verdict),
  INDEX idx_threat (matched_threat_id)
);
```

### Optional: Rate limit tracking table

If you want persistent rate limits (instead of in-memory):

```sql
CREATE TABLE IF NOT EXISTS factcheck_rate_limits (
  user_id INT NOT NULL,
  window_start TIMESTAMP NOT NULL,
  request_count INT DEFAULT 1,
  PRIMARY KEY (user_id, window_start),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

For hackathon, skip this — in-memory is fine.

---

## 12. FRONTEND IMPLEMENTATION

### Screen 1: FactCheckUpload

**Route**: `/factcheck`

**Required elements:**

1. **Header section:**
   - Title: "AI FACT-CHECKER" (large pixel font, green accent)
   - Subtitle: "Two AI agents. One verdict. Singapore-grounded."
   - Recent analysis count: "X analyses this week across Singapore"

2. **Tabbed input area:**
   - Tabs: TEXT / IMAGE / URL / AUDIO (audio = "Coming Soon", disabled)
   - Active tab content fills the panel below

3. **Text input mode:**
   - Large textarea for pasting content
   - Placeholder: "Paste suspicious SMS, WhatsApp message, email content..."
   - Character counter (max 5000)
   - Quick-fill example buttons:
     - "Try: IRAS Refund SMS"
     - "Try: OCBC Phishing"
     - "Try: Fake Friend Call Text"
   - Each example button fills the textarea with a sample scam for demo

4. **Image input mode:**
   - Drag-and-drop zone with cyan pixel border
   - "Drop screenshot here or click to upload"
   - Accepts: PNG, JPG, WEBP, GIF
   - Max size: 10MB
   - Image preview after upload with X to remove

5. **URL input mode:**
   - Text input for URL
   - Validation: must start with http:// or https://
   - Placeholder: "https://suspicious-site.com/..."
   - Note: "We'll fetch and analyze the page content"

6. **Audio input mode:**
   - Show "COMING SOON" overlay
   - Disabled button
   - Tease: "Voice clone detection arrives in v2"

7. **How It Works section (below input):**
   - Visual diagram showing the 4 stages: Preprocess → Detector → Skeptic → Verdict
   - Animated arrows between stages
   - Brief description under each stage

8. **Analyse button:**
   - Large, prominent, glowing green
   - Disabled until valid input
   - Text: "ANALYSE WITH AI"
   - Subtext: "Powered by Claude 3.5 Sonnet via OpenRouter"

9. **Recent analyses preview (bottom):**
   - Last 3-5 user's analyses as small cards
   - Quick "View" links

### Screen 2: FactCheckAnalysing

**Route**: `/factcheck/analysing/:tempId` (or use state)

**Critical UX requirement**: Even if API responds in 1 second, show this screen for **minimum 3 seconds** (use `FACTCHECK_MIN_PROCESSING_TIME_MS` env var). Pacing creates trust.

**Required elements:**

1. **Header:**
   - Title: "ANALYZING..."
   - Subtitle: rotates between "Two AI agents at work" / "Cross-verifying..." / "Checking Singapore threat databases"

2. **Pipeline visualization (centerpiece):**
   - 4 stages shown horizontally
   - Each stage has an icon, label, status
   - Stages light up sequentially:
     ```
     ✓ Preprocessing content       [DONE]
     ✓ Retrieving threat matches   [DONE]
     ⏳ Detector Agent analyzing...  [ACTIVE — pulsing]
     ◯ Skeptic Agent reviewing      [WAITING]
     ◯ Building consensus           [WAITING]
     ```

3. **Two AI agent avatars:**
   - Left: "DETECTOR" pixel art robot/brain
   - Right: "SKEPTIC" pixel art robot/brain
   - When active: pulsing glow, energy particles
   - When waiting: dimmed, idle
   - When done: green checkmark

4. **Did You Know rotator:**
   - Below the pipeline, large pixel-art card
   - Rotates Singapore-specific facts every 3-4 seconds
   - Fade transition between facts
   - Source: `client/src/data/didYouKnowFacts.js`

5. **Terminal-style log (optional polish):**
   - Below the agents, scrolling log of "thinking" messages
   - Typewriter effect
   - Examples:
     - "▸ Preprocessing user content..."
     - "▸ Searching threat database..."
     - "▸ Match found: IRAS Refund Lure 2026"
     - "▸ Querying Detector Agent..."
     - "▸ Querying Skeptic Agent..."

6. **Cancel button:**
   - Small, bottom of screen
   - Returns to upload screen

### Screen 3: FactCheckResult

**Route**: `/factcheck/result/:id`

This is the payoff. Make it dramatic.

**Required elements:**

1. **VERDICT BANNER (top, massive):**

   Color and styling based on verdict:
   - SAFE: Green, ✓ icon, "APPEARS SAFE"
   - LOW: Blue-grey, ⚠ icon, "LOW RISK"
   - MEDIUM: Amber, ⚠ icon, "SUSPICIOUS"
   - HIGH: Red, 🚨 icon, "LIKELY SCAM"
   - CRITICAL: Bright red with pulse animation, 🚨 icon, "CONFIRMED SCAM"

   Below the verdict:
   - Threat subcategory name (large, e.g. "IRAS Refund Lure 2026")
   - Confidence percentage with animated counter
   - "Confidence: 87%" with a progress bar

2. **Threat family badge:**
   - Coloured pill showing the family (Phantom/Illusion/Toxic/Coercion)
   - Brief description of what this family does

3. **Red Flags Detected section:**
   - List of specific red flags found
   - Each flag with a red ❌ or warning icon
   - Pixel-art styled bullet points

4. **What Both Agents Thought (side-by-side cards):**
   - Two columns:
     - DETECTOR's view (left, cyan accent)
     - SKEPTIC's view (right, magenta accent)
   - Each shows: their verdict, confidence, key reasoning
   - Below: "Agents AGREED" or "Agents DISAGREED" banner
   - If disagreed: emphasize lower confidence

5. **Recommended Actions section:**
   - Prioritized list of what to do
   - Each action has a button if applicable:
     - "Report to ScamShield" → opens https://www.scamshield.gov.sg
     - "Call 1799" → tel:1799 link
     - "Forward to ScamShield WhatsApp" → wa.me link
     - "Block sender" → instructions card

6. **Singapore Sources Cited:**
   - List of cited sources with clickable links
   - Each source shows: organization name, source name, date, URL
   - Pixel-style citation cards

7. **Original content preview:**
   - Collapsible "View original content" section
   - Shows the preprocessed (PII-redacted) content
   - Note: "Personal information automatically removed"

8. **Action buttons (bottom):**
   - "Analyze Another" → back to upload
   - "Share This Analysis" → copy link
   - "Save to History" (auto-done, just confirmation)

### Frontend service file

**File**: `client/src/services/factCheckService.js`

Functions to implement:
- `analyseFactCheck(input)` — submits to backend
- `getFactCheckById(id)` — retrieves past analysis
- `getFactCheckHistory(limit, offset)` — paginated history
- `deleteFactCheck(id)` — removes from history

All use the existing `api.js` axios instance with auth headers.

### Did You Know facts file

**File**: `client/src/data/didYouKnowFacts.js`

Array of 30-50 Singapore-specific facts. Examples:

```javascript
export const DID_YOU_KNOW_FACTS = [
  {
    fact: 'Singapore lost S$913.1 million to scams in 2025.',
    source: 'SPF Annual Scams Brief 2025'
  },
  {
    fact: '1 in 3 Singapore scam victims are aged 20-39.',
    source: 'SPF 2025 Statistics'
  },
  {
    fact: 'Real IRAS communications NEVER include clickable links to claim refunds.',
    source: 'IRAS Official Advisory'
  },
  {
    fact: 'ScamShield blocked over 21,000 scam numbers in 2025.',
    source: 'ScamShield Annual Report'
  },
  {
    fact: 'The OCBC SMS Phishing wave of 2021 stole S$13.7 million from 790 victims in just 43 days.',
    source: 'MAS Official Report'
  },
  // ... 30+ more facts
];
```

These will be populated more comprehensively when PDFs are provided.

---

## 13. MOCK MODE

### Why mock mode

**Demo safety.** If OpenRouter is down or your API key fails during the live demo, mock mode returns realistic verdicts based on keyword matching — no AI calls needed.

### Activation

Set env var: `FACTCHECK_MODE=mock` to enable.

When mock mode is active:
- Skip AI calls entirely
- Use keyword-based verdict generation
- Add `usedMockMode: true` to all responses
- Log warning to console: `[FACTCHECK] Running in MOCK mode`

### File: `server/src/services/factCheck/mockProvider.js`

### Mock logic

```
function generateMockVerdict(content, retrievedThreats):
  contentLower = content.toLowerCase()
  
  # Strong scam indicators
  scamScore = 0
  if matches /click here|verify your account|unclaimed refund/: scamScore += 30
  if matches /\bIRAS\b|\bOCBC\b|\bDBS\b/: scamScore += 20
  if matches /S\$\d+/: scamScore += 15
  if matches /\b(urgent|immediately|24 hours)\b/: scamScore += 15
  if matches /bit\.ly|tinyurl|goo\.gl/: scamScore += 25
  if retrievedThreats.length > 0: scamScore += 20 * retrievedThreats.length
  
  # Calculate verdict
  if scamScore >= 80: verdict = 'CRITICAL', confidence = 90
  elif scamScore >= 60: verdict = 'HIGH', confidence = 80
  elif scamScore >= 35: verdict = 'MEDIUM', confidence = 65
  elif scamScore >= 15: verdict = 'LOW', confidence = 45
  else: verdict = 'SAFE', confidence = 75
  
  # If we have a strong threat match, use it
  topThreat = retrievedThreats[0]?.threat
  
  return {
    verdict,
    confidence,
    threatFamily: topThreat?.family || null,
    threatSubcategory: topThreat?.name || 'Generic Pattern',
    matchedThreatId: topThreat?.id || null,
    redFlags: topThreat?.redFlags?.slice(0, 4) || ['Suspicious patterns detected'],
    reasoning: 'Mock analysis: matched against keyword patterns.',
    citedSources: topThreat?.sources || [],
    userShouldDo: topThreat?.preventionTips || ['Verify through official channels'],
    
    # Fake agent views for UI
    detectorView: { /* fake detector response */ },
    skepticView: { /* fake skeptic response */ },
    agentsAgreed: true,
    usedMockMode: true,
    _processingMs: 3500
  }
```

The orchestrator checks the env var:

```
async function orchestrate(input):
  if process.env.FACTCHECK_MODE === 'mock':
    processedContent = await preprocess(input)
    retrievedThreats = retrieveThreats(processedContent.processedContent)
    return generateMockVerdict(processedContent.processedContent, retrievedThreats)
  else:
    # Normal flow
    ...
```

### Demo strategy

Before the live demo:
1. Test in live mode the day before
2. Pre-warm the API with a test query
3. Have mock mode toggle ready
4. If anything feels off during demo: switch to mock mode

Mock mode is your insurance policy.

---

## 14. BUILD ORDER

Build in this exact sequence. Test after each phase.

### Phase 1: Foundation (1-2 hours)

1. Add environment variables to `.env` and `.env.example`
2. Update `factcheck_history` table schema in Aiven
3. Create file structure (empty files)
4. Install any new dependencies (multer if not already, axios already there)

### Phase 2: OpenRouter Client (1 hour)

5. Build `openRouterClient.js` with:
   - Base axios instance configured for OpenRouter
   - `callModel(messages, model, options)` function
   - Error handling and retries
   - Token usage tracking
   - Required headers (HTTP-Referer, X-Title)

### Phase 3: Knowledge Base (2-3 hours)

6. Create `threatKnowledgeBase.js` with 30+ placeholder entries
7. Each entry has minimal data marked with `_placeholder: true`
8. Cover all required categories (Phantom, Illusion, Toxic, Coercion)
9. Include the structure for sources, prevention tips, etc.

### Phase 4: Retriever (1-2 hours)

10. Build `retriever.js` with scoring algorithm
11. Test with sample inputs to verify correct threats are retrieved
12. Verify edge cases (empty content, no matches, etc.)

### Phase 5: Preprocessor (2 hours)

13. Build `preprocessor.js` with PII redaction
14. Handle text input
15. Handle image input (base64 conversion)
16. Handle URL input (axios fetch + text extraction)
17. Test all input types

### Phase 6: Agent Prompts (1-2 hours)

18. Write `detectorPrompt.js` template
19. Write `skepticPrompt.js` template
20. Build prompt assembly functions

### Phase 7: Detector Agent (2 hours)

21. Build `detectorAgent.js`
22. Handle text-only mode
23. Handle multimodal (image) mode
24. Parse JSON responses
25. Validate output structure
26. Test with sample inputs

### Phase 8: Skeptic Agent (1-2 hours)

27. Build `skepticAgent.js`
28. Use Detector's response as context
29. Test full Detector → Skeptic flow

### Phase 9: Consensus Engine (1 hour)

30. Build `consensusEngine.js`
31. Implement verdict combination logic
32. Implement confidence calculation
33. Deduplicate red flags and sources

### Phase 10: Mock Provider (1 hour)

34. Build `mockProvider.js`
35. Implement keyword-based scoring
36. Test mock mode end-to-end

### Phase 11: Orchestrator (1 hour)

37. Build `orchestrator.js`
38. Tie all components together
39. Add timing instrumentation
40. Add error handling

### Phase 12: API Endpoint (2 hours)

41. Build `factCheckController.js`
42. Handle multipart file uploads with multer
43. Implement rate limiting (in-memory)
44. Save to factcheck_history
45. Return formatted response

### Phase 13: Routes (30 minutes)

46. Build `factCheckRoutes.js`
47. Mount routes in main app
48. Add authentication middleware

### Phase 14: Frontend Upload Screen (2-3 hours)

49. Build `FactCheckUpload.js`
50. Implement tabbed input modes
51. Build file dropzone
52. Add quick-fill example buttons
53. Add "How It Works" diagram

### Phase 15: Frontend Analysing Screen (2-3 hours)

54. Build `FactCheckAnalysing.js`
55. Build pipeline visualization
56. Build agent avatar animations
57. Implement Did You Know rotator
58. Add minimum 3-second display logic

### Phase 16: Frontend Result Screen (3-4 hours)

59. Build `FactCheckResult.js`
60. Build verdict banner with color coding
61. Build red flags list
62. Build side-by-side agent comparison
63. Build action buttons
64. Build cited sources display
65. Build collapsible original content section

### Phase 17: Frontend History (1-2 hours)

66. Build `FactCheckHistory.js`
67. List past analyses
68. Click to view full result
69. Delete functionality

### Phase 18: Integration & Polish (2-3 hours)

70. Test full flow end-to-end
71. Test with all input types
72. Test rate limiting
73. Test mock mode
74. Polish animations
75. Mobile responsive checks

### Phase 19: Real Data Integration (when PDFs provided)

76. Replace placeholder threats with real data from PDFs
77. Remove `_placeholder: true` flags
78. Verify retrieval accuracy with real threats
79. Update Did You Know facts with real statistics

---

## 15. TESTING CHECKLIST

After implementation, verify each item:

### Backend tests

- [ ] OpenRouter API key works (test call succeeds)
- [ ] All required environment variables loaded
- [ ] Database schema updated correctly
- [ ] Retriever finds relevant threats for sample inputs
- [ ] Retriever returns empty array for unrelated content
- [ ] Preprocessor correctly redacts PII
- [ ] Preprocessor handles text input
- [ ] Preprocessor handles image input (base64 conversion)
- [ ] Preprocessor handles URL input (fetches content)
- [ ] Detector agent returns valid JSON
- [ ] Detector agent handles missing threat matches
- [ ] Skeptic agent receives Detector's response correctly
- [ ] Skeptic agent can disagree with Detector
- [ ] Consensus uses more cautious verdict when agents disagree
- [ ] Consensus lowers confidence when agents disagree
- [ ] Mock mode returns realistic verdicts without API calls
- [ ] Rate limiting blocks after 10 requests/minute
- [ ] All API calls saved to factcheck_history
- [ ] PII never appears in saved data

### Frontend tests

- [ ] Upload screen accepts text input
- [ ] Upload screen accepts image drag-and-drop
- [ ] Upload screen accepts URL input
- [ ] Audio tab shows "Coming Soon"
- [ ] Quick-fill example buttons work
- [ ] Analyse button disabled until valid input
- [ ] Analysing screen displays for minimum 3 seconds
- [ ] Pipeline visualization animates correctly
- [ ] Did You Know facts rotate
- [ ] Result screen shows correct verdict color
- [ ] Confidence percentage animates in
- [ ] Red flags list displays
- [ ] Both agent views visible side-by-side
- [ ] Action buttons link to correct URLs
- [ ] Source citations are clickable
- [ ] Original content collapsible section works
- [ ] History page lists past analyses
- [ ] Clicking history item shows full result

### Demo readiness

- [ ] Test with IRAS scam SMS
- [ ] Test with OCBC phishing screenshot
- [ ] Test with fake friend call message
- [ ] Test with safe message (e.g., real grocery list)
- [ ] Test mock mode toggle
- [ ] Time the full flow (under 15 seconds)
- [ ] Mobile responsive on real phone
- [ ] No console errors during demo flow

---

## 🔚 FINAL NOTES

### What makes this implementation strong for the demo

1. **RAG with cited sources** — judges immediately understand "AI that knows Singapore"
2. **Dual-agent verification** — shows engineering thinking beyond single API calls
3. **OpenRouter integration** — flexible, modern stack choice
4. **Mock mode safety net** — demo can never fail
5. **PII redaction** — privacy-conscious design
6. **Singapore-specific from the ground up** — not a generic scam checker

### Pitch line for the fact-checker

> "Other tools tell users WHAT a scam looks like. Sentinel SG's AI Fact-Checker uses RAG grounded in three Singapore sources—SPF, ScamShield, and CSA—to tell users about the EXACT scam hitting Singapore THIS WEEK. Two AI agents independently verify each verdict so you know when to trust the answer and when to be skeptical."

### What to do when PDFs arrive

When the source PDF materials are provided:

1. Extract threat information from each PDF
2. Convert into the `threatKnowledgeBase.js` entry format
3. Update each entry, removing `_placeholder: true`
4. Add real source URLs and dates
5. Add real victim counts and loss figures
6. Test retrieval with real Singapore scam examples
7. Update Did You Know facts with real statistics

### When something breaks

Common issues and fixes:

- **OpenRouter 401**: API key invalid or missing required headers
- **OpenRouter 429**: Rate limited, wait or upgrade plan
- **JSON parse errors**: Add stricter prompt or retry logic
- **Image too large**: Compress before sending or reject upload
- **Slow responses**: Use a smaller model for testing, switch back for demo
- **Threats not matching**: Lower the minScore in retriever options

### Maintenance after launch

- Update knowledge base monthly with new ScamShield bulletins
- Monitor agent disagreement rate (should be 10-20%)
- Watch token usage in OpenRouter dashboard
- Review false positives/negatives from user feedback

---

**END OF SPECIFICATION**

This document is complete and ready for implementation. Build phase-by-phase using Section 14 as your guide.
