import './PixelBorder.css';

export default function PixelBorder({ children, color = 'cyan', className = '' }) {
  return (
    <div className={`pixel-box pixel-box--${color} ${className}`}>
      {children}
    </div>
  );
}
