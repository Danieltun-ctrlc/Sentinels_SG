export default function EmptyState({ icon = '📭', title, message }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>
      <h3 style={{ fontFamily: 'var(--font-header)', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
        {title || 'NOTHING HERE'}
      </h3>
      {message && <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{message}</p>}
    </div>
  );
}
