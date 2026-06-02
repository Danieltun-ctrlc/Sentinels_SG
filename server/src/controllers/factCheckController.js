/**
 * Fact-Check Controller — HTTP handlers for the analysis pipeline.
 */
const { analyseContent } = require('../services/factCheck/orchestrator');
const pool = require('../config/database');

async function analyse(req, res, next) {
  try {
    const { text, imageBase64, videoFrames } = req.body;

    if (!text && !imageBase64 && (!videoFrames || videoFrames.length === 0)) {
      return res.status(400).json({ error: 'No content provided. Send text, imageBase64, or videoFrames.' });
    }

    const content = text || '(User uploaded content for analysis)';
    const imageData = imageBase64 || (videoFrames && videoFrames[0]) || null;
    const result = await analyseContent(content, { imageData, videoFrames: videoFrames || null });

    // Save to history if user is authenticated
    if (req.userId) {
      try {
        await pool.execute(
          `INSERT INTO factcheck_history (user_id, file_type, file_name, verdict, confidence, threat_family, agents_agreed)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            req.userId,
            imageBase64 ? 'image' : 'text',
            content.slice(0, 100),
            result.verdict,
            result.confidence,
            result.threatFamily || null,
            result.agentsAgreed ? 1 : 0,
          ]
        );
      } catch (dbErr) {
        console.warn('[FactCheck] Failed to save history:', dbErr.message);
      }
    }

    res.json({ success: true, result });
  } catch (err) {
    console.error('[FactCheck] Analysis failed:', err.message);
    next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    const userId = req.userId;
    const [rows] = await pool.execute(
      'SELECT id, input_type, input_preview, verdict, confidence, created_at FROM factcheck_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [userId]
    );
    res.json({ history: rows });
  } catch (err) { next(err); }
}

module.exports = { analyse, getHistory };
