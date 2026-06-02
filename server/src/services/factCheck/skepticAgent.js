/**
 * Skeptic Agent — Second AI pass. Challenges Detector's findings.
 */
const { callOpenRouter } = require('./openRouterClient');

async function runSkeptic(content, retrievedThreats, detectorResult) {
  const systemMessage = `You are Agent 2: The Skeptic in Sentinel SG's dual-agent scam analysis system.

YOUR ROLE: Independently verify Agent 1's findings. Challenge conclusions. Look for what they missed.

APPROACH:
- Assume Agent 1 may have been too quick to judge
- Consider benign explanations
- Check if red flags are actually false positives
- Be willing to disagree strongly if warranted
- If Agent 1 is correct, confirm and possibly raise confidence

OUTPUT FORMAT: Return ONLY valid JSON.
{
  "agreeWithAgent1": true | false,
  "adjustedVerdict": "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "adjustedConfidence": <number 0-100>,
  "agentOneStrengths": ["<what Agent 1 got right>"],
  "agentOneWeaknesses": ["<what Agent 1 missed>"],
  "additionalRedFlags": ["<new concerns>"],
  "alternativeExplanations": ["<benign interpretations>"],
  "skepticReasoning": "<2-3 sentence analysis>",
  "finalRecommendation": "<what user should do>"
}`;

  let threatContext = '';
  if (retrievedThreats.length > 0) {
    threatContext = retrievedThreats.map((r, i) => `THREAT ${i + 1}: ${r.threat.name} (${r.threat.prevalence})`).join('\n');
  }

  const userMessage = `AGENT 1'S ANALYSIS:\n${JSON.stringify(detectorResult, null, 2)}\n\nRETRIEVED THREATS:\n${threatContext}\n\nORIGINAL CONTENT:\n${content}\n\nIndependently analyze. Return only JSON.`;

  const response = await callOpenRouter(
    [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ],
    { model: process.env.OPENROUTER_MODEL_SKEPTIC, temperature: 0.3 }
  );

  let parsed;
  try {
    const cleaned = response.content.replace(/```json\n?|```\n?/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    parsed = {
      agreeWithAgent1: true,
      adjustedVerdict: detectorResult.verdict || 'MEDIUM',
      adjustedConfidence: detectorResult.confidence || 50,
      agentOneStrengths: [],
      agentOneWeaknesses: [],
      additionalRedFlags: [],
      alternativeExplanations: [],
      skepticReasoning: 'Unable to parse response. Deferring to Agent 1.',
      finalRecommendation: 'Verify through official channels.',
    };
  }

  return {
    ...parsed,
    _modelUsed: response.model,
    _processingTimeMs: response.processingMs,
    _tokenUsage: response.tokenUsage,
  };
}

module.exports = { runSkeptic };
