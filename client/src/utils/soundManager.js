/**
 * Centralised Sound Manager — Howler.js based.
 * Same public API as before. Handles mobile audio unlock automatically.
 */
import { Howl, Howler } from 'howler';

class SoundManager {
  constructor() {
    this.sounds = {};
    this.music = null;
    this.settings = { masterVolume: 0.7, sfxVolume: 0.8, musicVolume: 0.5, muteAll: false };
  }

  init() {
    // Howler handles AudioContext creation and mobile unlock automatically
    this.applyVolumes();
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.applyVolumes();
  }

  applyVolumes() {
    const vol = this.settings.muteAll ? 0 : this.settings.masterVolume;
    Howler.volume(vol);
  }

  async loadSound(name, url) {
    if (this.sounds[name]) return this.sounds[name];
    return new Promise((resolve) => {
      const howl = new Howl({
        src: [url],
        volume: this.settings.sfxVolume,
        preload: true,
        onload: () => resolve(howl),
        onloaderror: () => {
          console.warn(`[SoundManager] Failed to load: ${name} (${url})`);
          resolve(null);
        },
      });
      this.sounds[name] = howl;
    });
  }

  play(name, options = {}) {
    if (this.settings.muteAll) return;
    const howl = this.sounds[name];
    if (!howl) return;

    howl.volume((options.volume || 1) * (options.isMusic ? this.settings.musicVolume : this.settings.sfxVolume));
    howl.loop(options.loop || false);

    if (options.isMusic) {
      if (this.music) this.music.stop();
      this.music = howl;
    }

    howl.play();
    return howl;
  }

  stopMusic(fadeMs = 500) {
    if (!this.music) return;
    this.music.fade(this.music.volume(), 0, fadeMs);
    const ref = this.music;
    setTimeout(() => ref.stop(), fadeMs);
    this.music = null;
  }

  playQuick(url) {
    if (this.settings.muteAll) return;
    try {
      const howl = new Howl({
        src: [url],
        volume: this.settings.masterVolume * this.settings.sfxVolume,
      });
      howl.play();
    } catch (e) {}
  }
}

const soundManager = new SoundManager();
export default soundManager;
