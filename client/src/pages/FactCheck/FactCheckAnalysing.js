import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './FactCheckAnalysing.css';

const PIPELINE_STAGES = [
  { label: 'Retrieving threat intelligence...', duration: 2000 },
  { label: 'Agent 1: RAG Scout analysing...', duration: 3000 },
  { label: 'Agent 2: Verifier cross-checking...', duration: 3000 },
  { label: 'Building consensus verdict...', duration: 2000 },
];

export default function FactCheckAnalysing() {
  const location = useLocation();
  const navigate = useNavigate();
  const { text, imageBase64, videoFrames } = location.state || {};

  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const resultRef = useRef(null);
  const animationDone = useRef(false);

  // Redirect to upload if no state
  useEffect(() => {
    if (!location.state) {
      navigate('/factcheck', { replace: true });
    }
  }, [location.state, navigate]);

  // Animate pipeline stages
  useEffect(() => {
    if (!location.state) return;

    const totalDuration = PIPELINE_STAGES.reduce((sum, s) => sum + s.duration, 0);
    let elapsed = 0;
    let stageIdx = 0;

    const interval = setInterval(() => {
      elapsed += 100;
      const pct = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(pct);

      // Advance stage
      let cumulative = 0;
      for (let i = 0; i < PIPELINE_STAGES.length; i++) {
        cumulative += PIPELINE_STAGES[i].duration;
        if (elapsed < cumulative) {
          stageIdx = i;
          break;
        }
        if (i === PIPELINE_STAGES.length - 1) stageIdx = i;
      }
      setCurrentStage(stageIdx);

      if (elapsed >= totalDuration) {
        clearInterval(interval);
        animationDone.current = true;
        // If API already done, navigate
        if (resultRef.current) {
          navigate('/factcheck/result/latest', { state: { result: resultRef.current } });
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [location.state, navigate]);

  // Call API
  useEffect(() => {
    if (!location.state) return;

    const payload = {};
    if (videoFrames && videoFrames.length > 0) {
      payload.videoFrames = videoFrames; // Array of base64 frames
      payload.imageBase64 = videoFrames[0]; // Primary frame
    } else if (imageBase64) {
      payload.imageBase64 = imageBase64;
    }
    if (text && text.trim()) {
      payload.text = text.trim();
    } else if (!imageBase64 && !videoFrames) {
      payload.text = '(No content provided)';
    }

    api.post('/factcheck/analyse', payload)
      .then((res) => {
        const result = res.data.result || res.data;
        resultRef.current = result;
        // If animation already done, navigate immediately
        if (animationDone.current) {
          navigate('/factcheck/result/latest', { state: { result } });
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Analysis failed. Please try again.');
      });
  }, [location.state, text, imageBase64, navigate]);

  if (error) {
    return (
      <div className="factcheck-analysing animate-fade-in">
        <div className="factcheck-analysing__error">
          <span className="factcheck-analysing__error-icon">⚠️</span>
          <h2 className="factcheck-analysing__error-title">ANALYSIS FAILED</h2>
          <p className="factcheck-analysing__error-msg">{error}</p>
          <button
            className="factcheck-analysing__retry-btn"
            onClick={() => navigate('/factcheck', { replace: true })}
          >
            ← TRY AGAIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="factcheck-analysing animate-fade-in">
      <div className="factcheck-analysing__container">
        {/* Header */}
        <div className="factcheck-analysing__header">
          <span className="factcheck-analysing__shield">🛡️</span>
          <h1 className="factcheck-analysing__title">THREAT ANALYSIS IN PROGRESS</h1>
          <p className="factcheck-analysing__subtitle">Two AI agents are cross-verifying your content</p>
        </div>

        {/* Pipeline Stages */}
        <div className="factcheck-analysing__stages">
          {PIPELINE_STAGES.map((stage, idx) => (
            <div
              key={idx}
              className={`factcheck-analysing__stage ${
                idx < currentStage ? 'factcheck-analysing__stage--done' : ''
              } ${idx === currentStage ? 'factcheck-analysing__stage--active' : ''}`}
            >
              <span className="factcheck-analysing__stage-indicator">
                {idx < currentStage ? '✓' : idx === currentStage ? '►' : '○'}
              </span>
              <span className="factcheck-analysing__stage-label">{stage.label}</span>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="factcheck-analysing__progress-container">
          <div className="factcheck-analysing__progress-bar">
            <div
              className="factcheck-analysing__progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="factcheck-analysing__progress-pct">{Math.round(progress)}%</span>
        </div>

        {/* Scanning animation */}
        <div className="factcheck-analysing__scan-lines">
          <div className="factcheck-analysing__scan-line" />
          <div className="factcheck-analysing__scan-line factcheck-analysing__scan-line--delayed" />
        </div>

        <p className="factcheck-analysing__note">
          Do not close this page. Typical analysis time: 8–15 seconds.
        </p>
      </div>
    </div>
  );
}
