import { createContext, useContext, useState, useEffect } from 'react';

const DEFAULTS = {
  masterVolume: 0.7,
  sfxVolume: 0.8,
  musicVolume: 0.5,
  muteAll: false,
  reduceAnimations: false,
  disableParticles: false,
  disableScreenShake: false,
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('sentinel_settings');
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
    } catch { return DEFAULTS; }
  });

  useEffect(() => {
    localStorage.setItem('sentinel_settings', JSON.stringify(settings));
  }, [settings]);

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) setSettings(s => ({ ...s, reduceAnimations: true }));
    const handler = (e) => { if (e.matches) setSettings(s => ({ ...s, reduceAnimations: true })); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const updateSetting = (key, value) => setSettings(s => ({ ...s, [key]: value }));

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
