/**
 * Detector Agent — First AI pass. Analyzes content with retrieved threat context.
 */
const { callOpenRouter } = require('./openRouterClient');

async function runDetector(content, retrievedThreats, imageData = null, options = {}) {
  const systemMessage = `You are Agent 1: The Detector in Sentinel SG's dual-agent scam analysis system for Singapore residents.

YOUR ROLE: Identify whether the content is a scam targeting Singapore residents.

CONFIDENCE CALIBRATION:
- 95-100: Definitive match with known threat
- 75-94: Strong indicators, very likely scam
- 50-74: Suspicious but ambiguous
- 25-49: Some concerning elements, probably benign
- 0-24: No scam indicators

OUTPUT FORMAT: Return ONLY valid JSON.
{
  "verdict": "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "confidence": <number 0-100>,
  "matchedThreatId": "<id or null>",
  "threatFamily": "phantom" | "illusion" | "toxic" | "coercion" | null,
  "redFlags": ["<specific concern>"],
  "reasoning": "<2-3 sentence analysis>",
  "singaporeContext": "<what makes this SG-specific>",
  "citedSources": ["<source names>"],
  "userShouldDo": ["<action items>"]
}`;

  // Build threat context
  let threatContext = '';
  if (retrievedThreats.length > 0) {
    threatContext = 'RETRIEVED SINGAPORE THREAT INTELLIGENCE:\n\n';
    retrievedThreats.forEach((r, i) => {
      const t = r.threat;
      threatContext += `MATCHED THREAT ${i + 1}: ${t.name}\n`;
      threatContext += `- Family: ${t.family || 'unknown'}\n`;
      threatContext += `- Prevalence: ${t.prevalence || 'unknown'}\n`;
      threatContext += `- Description: ${t.description || ''}\n`;
      if (t.redFlags) threatContext += `- Red Flags: ${t.redFlags.join('; ')}\n`;
      if (t.legitimacyContrast) threatContext += `- Legitimacy Contrast: ${t.legitimacyContrast}\n`;
      if (t.sources) threatContext += `- Sources: ${t.sources.map(s => s.name).join(', ')}\n`;
      threatContext += '\n';
    });
  } else {
    threatContext = 'NO MATCHES FOUND IN KNOWLEDGE BASE. Analyze using general Singapore scam knowledge.\n';
  }

  const userMessage = `${threatContext}\nUSER CONTENT TO ANALYZE:\n${content}\n\nReturn only JSON.`;

  const messages = [
    { role: 'system', content: systemMessage },
  ];

  // Handle image/video input
  if (imageData) {
    // Detect MIME type from base64 header
    let mimeType = 'image/png';
    if (imageData.startsWith('/9j/')) mimeType = 'image/jpeg';
    else if (imageData.startsWith('iVBOR')) mimeType = 'image/png';
    else if (imageData.startsWith('R0lGOD')) mimeType = 'image/gif';
    else if (imageData.startsWith('UklGR')) mimeType = 'image/webp';
    else if (imageData.startsWith('JVBER')) mimeType = 'application/pdf';

    // Build multimodal message with ALL available frames
    const contentParts = [];

    // If we have multiple video frames, send up to 5 evenly spaced
    const allFrames = options?.videoFrames || [imageData];
    const framesToSend = [];
    if (allFrames.length <= 5) {
      framesToSend.push(...allFrames);
    } else {
      // Pick 5 evenly spaced frames from the array
      const step = Math.floor(allFrames.length / 5);
      for (let i = 0; i < 5; i++) {
        framesToSend.push(allFrames[i * step]);
      }
    }

    for (const frame of framesToSend) {
      let frameMime = 'image/jpeg';
      if (frame.startsWith('iVBOR')) frameMime = 'image/png';
      else if (frame.startsWith('/9j/')) frameMime = 'image/jpeg';
      contentParts.push({
        type: 'image_url',
        image_url: { url: `data:${frameMime};base64,${frame}` }
      });
    }

    contentParts.push({
      type: 'text',
      text: userMessage + `\n\nThe user uploaded ${framesToSend.length > 1 ? framesToSend.length + ' frames from a video' : 'an image'}. Extract ALL visible text from EVERY frame and analyze the combined content as a potential scam. Pay attention to email content, URLs, sender names, message bodies visible in any frame.`
    });

    messages.push({ role: 'user', content: contentParts });
  } else {
    messages.push({ role: 'user', content: userMessage });
  }

  const response = await callOpenRouter(messages, {
    model: process.env.OPENROUTER_MODEL_DETECTOR,
    temperature: 0.2,
    maxTokens: 3000,
  });

  // Parse JSON from response
  let parsed;
  try {
    const cleaned = response.content.replace(/```json\n?|```\n?/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    // Fallback
    parsed = {
      verdict: 'MEDIUM',
      confidence: 50,
      matchedThreatId: null,
      threatFamily: null,
      redFlags: ['Unable to parse AI response fully'],
      reasoning: response.content.slice(0, 200),
      singaporeContext: '',
      citedSources: [],
      userShouldDo: ['Verify through official channels'],
    };
  }

  return {
    ...parsed,
    _modelUsed: response.model,
    _processingTimeMs: response.processingMs,
    _tokenUsage: response.tokenUsage,
  };
}

module.exports = { runDetector };
