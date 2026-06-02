import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import './FactCheckUpload.css';

export default function FactCheckUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [inputType, setInputType] = useState('screenshot'); // screenshot | message | audio | video
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) setFile(selected);
  };

  const handleAnalyse = () => {
    if (!file && !textInput.trim()) return;
    // Navigate to analysing screen with the input
    navigate('/factcheck/analysing', {
      state: { file, textInput, inputType }
    });
  };

  const canAnalyse = file || textInput.trim().length > 10;

  return (
    <div className="factcheck-upload animate-fade-in">
      {/* Header */}
      <div className="factcheck-upload__header">
        <Link to="/home" className="factcheck-upload__back">‹ HOME</Link>
        <h1 className="factcheck-upload__page-title">FACT CHECKING</h1>
      </div>

      {/* Title section */}
      <div className="factcheck-upload__title-section">
        <h2 className="factcheck-upload__title">THREAT ANALYSER</h2>
        <p className="factcheck-upload__subtitle">
          Upload a suspicious message, screenshot, audio, or video.<br />
          Two independent AI agents analyse it and issue a verified verdict.
        </p>
        <p className="factcheck-upload__privacy">
          🔒 PII automatically redacted on-device before upload · PDPA-compliant · No data stored after analysis
        </p>
      </div>

      {/* How It Works Pipeline */}
      <div className="factcheck-upload__pipeline">
        <h3 className="factcheck-upload__pipeline-title">HOW IT WORKS</h3>
        <div className="factcheck-upload__pipeline-flow">
          <div className="factcheck-upload__pipeline-step">
            <div className="factcheck-upload__pipeline-icon">📂</div>
            <span className="factcheck-upload__pipeline-label">YOUR FILE</span>
            <span className="factcheck-upload__pipeline-desc">Screenshot · Message<br/>Audio · Video</span>
          </div>
          <div className="factcheck-upload__pipeline-arrow">→</div>
          <div className="factcheck-upload__pipeline-step factcheck-upload__pipeline-step--agent1">
            <span className="factcheck-upload__pipeline-badge">AGENT 1</span>
            <span className="factcheck-upload__pipeline-agent-name">RAG SCOUT</span>
            <span className="factcheck-upload__pipeline-desc">Searches SPF ·<br/>ScamShield<br/>CSA · MAS · IMDA<br/>Returns closest threat<br/>match + confidence score.</span>
          </div>
          <div className="factcheck-upload__pipeline-arrow">→</div>
          <div className="factcheck-upload__pipeline-step factcheck-upload__pipeline-step--agent2">
            <span className="factcheck-upload__pipeline-badge">AGENT 2</span>
            <span className="factcheck-upload__pipeline-agent-name">VERIFIER</span>
            <span className="factcheck-upload__pipeline-desc">Independently cross-checks<br/>Agent 1's finding. Can<br/>escalate severity, cut confidence,<br/>or flag disagreement.</span>
            <span className="factcheck-upload__pipeline-check">✓</span>
          </div>
          <div className="factcheck-upload__pipeline-arrow">→</div>
          <div className="factcheck-upload__pipeline-step factcheck-upload__pipeline-step--result">
            <div className="factcheck-upload__pipeline-shield">D</div>
            <span className="factcheck-upload__pipeline-label">ANALYSIS CARD</span>
            <span className="factcheck-upload__pipeline-desc">Verdict · Red flags ·<br/>Defence advice ·<br/>Action buttons</span>
          </div>
        </div>
        <p className="factcheck-upload__pipeline-note">
          No verdict is ever 100% Safe. Both agents are biased toward caution by design. Always verify through official Singapore channels.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        className={`factcheck-upload__dropzone ${dragOver ? 'factcheck-upload__dropzone--active' : ''} ${file ? 'factcheck-upload__dropzone--has-file' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.txt,.mp4"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        {file ? (
          <div className="factcheck-upload__file-info">
            <span className="factcheck-upload__file-name">{file.name}</span>
            <span className="factcheck-upload__file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            <button className="factcheck-upload__file-remove" onClick={(e) => { e.stopPropagation(); setFile(null); }}>✕ Remove</button>
          </div>
        ) : (
          <>
            <span className="factcheck-upload__dropzone-icon">📎</span>
            <p className="factcheck-upload__dropzone-text">Drop your file here</p>
            <p className="factcheck-upload__dropzone-hint">or click to browse</p>
          </>
        )}
        <div className="factcheck-upload__type-tabs">
          {['screenshot', 'message', 'video'].map(t => (
            <button
              key={t}
              className={`factcheck-upload__type-tab ${inputType === t ? 'factcheck-upload__type-tab--active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setInputType(t); }}
            >
              {t === 'screenshot' ? '🖼️' : t === 'message' ? '💬' : '🎬'} {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <p className="factcheck-upload__dropzone-formats">PNG · JPG · PDF · MP4 · TXT — Max 20MB</p>
      </div>

      {/* Or paste text */}
      <textarea
        className="factcheck-upload__text-input"
        placeholder="Or paste suspicious text here..."
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        rows={3}
      />

      {/* Analyse Button */}
      <button
        className={`factcheck-upload__analyse-btn ${canAnalyse ? 'factcheck-upload__analyse-btn--active' : ''}`}
        onClick={handleAnalyse}
        disabled={!canAnalyse}
      >
        🔒 ANALYSE THREAT
      </button>
      <p className="factcheck-upload__timing">Both agents run sequentially · Typical time: 8-15 seconds</p>

      {/* Knowledge Base Sources */}
      <div className="factcheck-upload__sources">
        <div className="factcheck-upload__sources-header">
          <span className="factcheck-upload__sources-icon">📚</span>
          <span className="factcheck-upload__sources-title">KNOWLEDGE BASE</span>
          <span className="factcheck-upload__sources-meta">6 sources · updated weekly</span>
        </div>
        <div className="factcheck-upload__sources-list">
          <span className="factcheck-upload__source-pill">● SPF Anti-Scam Centre</span>
          <span className="factcheck-upload__source-pill">● ScamShield Database</span>
          <span className="factcheck-upload__source-pill">● CSA SingCERT Advisories</span>
          <span className="factcheck-upload__source-pill">● MAS Consumer Alerts</span>
          <span className="factcheck-upload__source-pill">● IMDA SMS Sender ID Registry</span>
          <span className="factcheck-upload__source-pill">● Bank Security Advisories</span>
        </div>
      </div>

      {/* Report Banner */}
      <div className="factcheck-upload__report-banner">
        <span className="factcheck-upload__report-icon">🚨</span>
        <span className="factcheck-upload__report-text">Seen a scam? Report it. Your report protects 5.9M Singaporeans.</span>
        <a href="https://www.scamshield.gov.sg" target="_blank" rel="noopener noreferrer" className="factcheck-upload__report-btn factcheck-upload__report-btn--pink">Report via ScamShield</a>
        <a href="tel:1799" className="factcheck-upload__report-btn">Call 1799</a>
      </div>
    </div>
  );
}
