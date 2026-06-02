import { useSettings } from '../../context/SettingsContext';
import './Particles.css';

export default function Particles() {
  const { settings } = useSettings();

  if (settings.disableParticles || settings.reduceAnimations) return null;

  return (
    <div className="particles-bg" aria-hidden="true">
      {Array.from({ length: 20 }).map((_, i) => (
        <span
          key={i}
          className="particles-bg__dot"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 15}s`,
            animationDuration: `${12 + Math.random() * 10}s`,
          }}
        />
      ))}
    </div>
  );
}
