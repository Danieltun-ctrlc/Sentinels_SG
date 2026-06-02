import './Button.css';

export default function Button({ children, variant = 'primary', size = 'md', disabled, onClick, type = 'button', className = '' }) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
