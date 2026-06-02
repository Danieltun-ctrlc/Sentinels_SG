export default function LoadingSpinner({ text = 'LOADING...' }) {
  return (
    <div className="loading-screen">
      <div className="loading-screen__spinner"></div>
      <p className="pixel-text--sm">{text}</p>
    </div>
  );
}
