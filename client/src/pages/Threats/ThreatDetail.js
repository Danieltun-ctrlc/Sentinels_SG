import { useParams } from 'react-router-dom';

export default function ThreatDetail() {
  const { id } = useParams();
  return (
    <div className="animate-fade-in">
      <h2 style={{ fontSize: '14px', color: 'var(--color-amber)', marginBottom: '16px' }}>THREAT: {id}</h2>
      <p style={{ color: 'var(--color-text-muted)' }}>Threat detail page — coming soon.</p>
    </div>
  );
}
