import { useParams } from 'react-router-dom';

export default function FactCheckResult() {
  const { id } = useParams();
  return (
    <div className="animate-fade-in">
      <h2 style={{ fontSize: '14px', color: 'var(--color-green)', marginBottom: '16px' }}>VERDICT — #{id}</h2>
      <p style={{ color: 'var(--color-text-muted)' }}>Result page — coming soon.</p>
    </div>
  );
}
