import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__left">
          <span className="footer__brand">SENTINEL SG</span>
          <span className="footer__tagline">Mission: Digital Shield</span>
        </div>
        <div className="footer__center">
          <span className="footer__item">CODE_EXP 2026</span>
          <span className="footer__sep">·</span>
          <span className="footer__item">Singapore</span>
          <span className="footer__sep">·</span>
          <span className="footer__item">Online Harms</span>
        </div>
        <div className="footer__right">
          <span className="footer__sources">SPF · ScamShield · CSA · MAS · IMDA</span>
        </div>
      </div>
    </footer>
  );
}
