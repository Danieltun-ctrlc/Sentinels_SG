import './ReportBanner.css';

export default function ReportBanner() {
  return (
    <div className="report-banner">
      <div className="report-banner__inner">
        <span className="report-banner__icon">🛡️</span>
        <span className="report-banner__text">
          Suspect a scam? Report it now via <strong>ScamShield</strong> or call <strong>1799</strong>
        </span>
        <a
          href="https://www.scamshield.org.sg"
          target="_blank"
          rel="noopener noreferrer"
          className="report-banner__btn"
        >
          REPORT
        </a>
      </div>
    </div>
  );
}
