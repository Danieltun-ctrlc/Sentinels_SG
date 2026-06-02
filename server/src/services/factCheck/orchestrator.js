/**
 * Fact-Check Orchestrator — Runs the full pipeline.
 */
const { retrieveThreats } = require('./retriever');
const { runDetector } = require('./detectorAgent');
const { runSkeptic } = require('./skepticAgent');
const { combineResults } = require('./consensusEngine');

async function analyseContent(content, options = {}) {
  const { imageData = null, videoFrames = null } = options;
  const startTime = Date.now();

  // Step 1: Retrieve matching threats from knowledge base
  const retrievedThreats = retrieveThreats(content);

  // Step 2: Run Detector Agent (with first frame or image)
  const detectorResult = await runDetector(content, retrievedThreats, imageData, { videoFrames });

  // Step 3: Run Skeptic Agent
  const skepticResult = await runSkeptic(content, retrievedThreats, detectorResult);

  // Step 4: Combine into final verdict
  const finalResult = combineResults(detectorResult, skepticResult, retrievedThreats);

  // Enforce minimum processing time for UX
  const elapsed = Date.now() - startTime;
  const minTime = parseInt(process.env.FACTCHECK_MIN_PROCESSING_TIME_MS) || 3000;
  if (elapsed < minTime) {
    await new Promise(r => setTimeout(r, minTime - elapsed));
  }

  return {
    ...finalResult,
    _totalProcessingMs: Date.now() - startTime,
    _retrievedThreatCount: retrievedThreats.length,
  };
}

module.exports = { analyseContent };
