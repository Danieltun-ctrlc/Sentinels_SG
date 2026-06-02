import { useSettings } from '../../context/SettingsContext';
import './About.css';

export default function About() {
  const { settings, updateSetting } = useSettings();

  return (
    <div className="about animate-fade-in">
      <h2 className="about__title">ABOUT & SETTINGS</h2>

      <div className="about__section">
        <p className="about__text">
          Sentinel SG is a three-pillar cyber-resilience platform built for CODE_EXP 2026.
          Our mission: turn young Singaporeans into active online protectors.
        </p>
      </div>

      <div className="about__settings">
        <h3 className="about__settings-title">· AUDIO & DISPLAY SETTINGS</h3>

        <div className="about__setting-row">
          <label>Master Volume</label>
          <input type="range" min="0" max="1" step="0.1" value={settings.masterVolume}
            onChange={e => updateSetting('masterVolume', parseFloat(e.target.value))} />
          <span className="about__setting-val">{Math.round(settings.masterVolume * 100)}%</span>
        </div>

        <div className="about__setting-row">
          <label>Music Volume</label>
          <input type="range" min="0" max="1" step="0.1" value={settings.musicVolume}
            onChange={e => updateSetting('musicVolume', parseFloat(e.target.value))} />
          <span className="about__setting-val">{Math.round(settings.musicVolume * 100)}%</span>
        </div>

        <div className="about__setting-row">
          <label>SFX Volume</label>
          <input type="range" min="0" max="1" step="0.1" value={settings.sfxVolume}
            onChange={e => updateSetting('sfxVolume', parseFloat(e.target.value))} />
          <span className="about__setting-val">{Math.round(settings.sfxVolume * 100)}%</span>
        </div>

        <div className="about__setting-toggle">
          <label>Mute All</label>
          <button className={`about__toggle ${settings.muteAll ? 'about__toggle--on' : ''}`}
            onClick={() => updateSetting('muteAll', !settings.muteAll)}>
            {settings.muteAll ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="about__setting-toggle">
          <label>Reduce Animations</label>
          <button className={`about__toggle ${settings.reduceAnimations ? 'about__toggle--on' : ''}`}
            onClick={() => updateSetting('reduceAnimations', !settings.reduceAnimations)}>
            {settings.reduceAnimations ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="about__setting-toggle">
          <label>Disable Particles</label>
          <button className={`about__toggle ${settings.disableParticles ? 'about__toggle--on' : ''}`}
            onClick={() => updateSetting('disableParticles', !settings.disableParticles)}>
            {settings.disableParticles ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="about__setting-toggle">
          <label>Disable Screen Shake</label>
          <button className={`about__toggle ${settings.disableScreenShake ? 'about__toggle--on' : ''}`}
            onClick={() => updateSetting('disableScreenShake', !settings.disableScreenShake)}>
            {settings.disableScreenShake ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  );
}
