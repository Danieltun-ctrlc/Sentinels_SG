/**
 * OpenRouter API Client — wraps fetch calls to OpenRouter's chat completion endpoint.
 */

async function callOpenRouter(messages, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  const model = options.model || process.env.OPENROUTER_MODEL_DETECTOR;

  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  const startTime = Date.now();

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:3000',
      'X-Title': process.env.OPENROUTER_APP_NAME || 'Sentinel SG',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 2000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const usage = data.usage || {};

  return {
    content,
    model: data.model || model,
    processingMs: Date.now() - startTime,
    tokenUsage: { input: usage.prompt_tokens || 0, output: usage.completion_tokens || 0 },
  };
}

module.exports = { callOpenRouter };
