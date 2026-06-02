import { useParams } from 'react-router-dom';

export default function CodexEntry() {
  const { entryId } = useParams();
  return (
    <div className="animate-fade-in">
      <h2 style={{ fontSize: '14px', color: 'var(--color-cyan)', marginBottom: '16px' }}>CODEX — {entryId}</h2>
      <p style={{ color: 'var(--color-text-muted)' }}>Creature detail — coming soon.</p>
    </div>
  );
}
