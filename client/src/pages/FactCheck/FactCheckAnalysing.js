export default function FactCheckAnalysing() {
  return (
    <div className="animate-fade-in" style={{ textAlign: 'center', paddingTop: '80px' }}>
      <div className="loading-screen__spinner" style={{ margin: '0 auto 16px' }}></div>
      <h2 style={{ fontSize: '12px', color: 'var(--color-green)' }}>ANALYSING...</h2>
      <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>Two AI agents are cross-verifying your content.</p>
    </div>
  );
}
