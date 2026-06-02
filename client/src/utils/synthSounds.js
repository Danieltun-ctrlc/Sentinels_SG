/**
 * Synthesized placeholder sounds using Howler.js.
 * Uses dynamically generated audio buffers via Howl for mobile compatibility.
 * Same public API as before — drop-in replacement.
 */
import { Howl, Howler } from 'howler';

// Generate a WAV data URI from oscillator parameters
function generateToneDataUri(freq, duration, type = 'square', volume = 0.15) {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.max(0, 1 - (t / duration) * 2); // decay
    let sample = 0;

    if (type === 'square') {
      sample = Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1;
    } else if (type === 'sine') {
      sample = Math.sin(2 * Math.PI * freq * t);
    } else if (type === 'sawtooth') {
      sample = 2 * ((freq * t) % 1) - 1;
    }

    buffer[i] = sample * envelope * volume;
  }

  return encodeWav(buffer, sampleRate);
}

function generateNoiseDataUri(duration, volume = 0.05) {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const envelope = Math.max(0, 1 - (i / numSamples) * 2);
    buffer[i] = (Math.random() * 2 - 1) * envelope * volume;
  }

  return encodeWav(buffer, sampleRate);
}

function encodeWav(samples, sampleRate) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const dataLength = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// Cache generated Howl instances
const cache = {};

function getHowl(key, src) {
  if (!cache[key]) {
    cache[key] = new Howl({ src: [src], volume: 1, preload: true });
  }
  return cache[key];
}

function playTone(freq, duration, type = 'square', volume = 0.15) {
  try {
    const key = `tone_${freq}_${duration}_${type}_${volume}`;
    if (!cache[key]) {
      const uri = generateToneDataUri(freq, duration, type, volume);
      cache[key] = new Howl({ src: [uri], format: ['wav'], volume: 1 });
    }
    cache[key].play();
  } catch (e) {}
}

function playNoise(duration, volume = 0.05) {
  try {
    const key = `noise_${duration}_${volume}`;
    if (!cache[key]) {
      const uri = generateNoiseDataUri(duration, volume);
      cache[key] = new Howl({ src: [uri], format: ['wav'], volume: 1 });
    }
    cache[key].play();
  } catch (e) {}
}

// ===========================
// UI SOUNDS
// ===========================

export function playClick() {
  playTone(800, 0.06, 'square', 0.1);
}

export function playHover() {
  playTone(1200, 0.03, 'sine', 0.05);
}

export function playSuccess() {
  playTone(523, 0.1, 'square', 0.12);
  setTimeout(() => playTone(659, 0.1, 'square', 0.12), 80);
  setTimeout(() => playTone(784, 0.15, 'square', 0.12), 160);
}

export function playError() {
  playTone(200, 0.15, 'sawtooth', 0.1);
  setTimeout(() => playTone(150, 0.2, 'sawtooth', 0.1), 100);
}

export function playToggle() {
  playTone(600, 0.05, 'square', 0.08);
}

export function playPageTransition() {
  playTone(400, 0.08, 'sine', 0.06);
  setTimeout(() => playTone(600, 0.06, 'sine', 0.06), 50);
}

// ===========================
// BATTLE SOUNDS
// ===========================

export function playBattleStart() {
  playTone(220, 0.15, 'square', 0.15);
  setTimeout(() => playTone(330, 0.15, 'square', 0.15), 150);
  setTimeout(() => playTone(440, 0.2, 'square', 0.18), 300);
  setTimeout(() => playTone(660, 0.3, 'square', 0.2), 450);
}

export function playPlayerAttack() {
  playNoise(0.08, 0.12);
  playTone(300, 0.1, 'sawtooth', 0.15);
}

export function playEnemyAttack() {
  playNoise(0.1, 0.1);
  playTone(200, 0.12, 'sawtooth', 0.12);
}

export function playSuperEffective() {
  playTone(880, 0.08, 'square', 0.15);
  setTimeout(() => playTone(1100, 0.08, 'square', 0.15), 60);
  setTimeout(() => playTone(1320, 0.12, 'square', 0.18), 120);
}

export function playNotEffective() {
  playTone(300, 0.15, 'sine', 0.08);
}

export function playCriticalHit() {
  playNoise(0.05, 0.15);
  playTone(600, 0.05, 'square', 0.2);
  setTimeout(() => playTone(900, 0.08, 'square', 0.2), 50);
}

export function playDamageTaken() {
  playTone(150, 0.1, 'sawtooth', 0.1);
  playNoise(0.06, 0.08);
}

export function playFaint() {
  playTone(400, 0.2, 'sine', 0.12);
  setTimeout(() => playTone(300, 0.2, 'sine', 0.1), 200);
  setTimeout(() => playTone(200, 0.3, 'sine', 0.08), 400);
}

export function playVictory() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => setTimeout(() => playTone(n, 0.2, 'square', 0.15), i * 150));
}

export function playDefeat() {
  playTone(300, 0.3, 'sawtooth', 0.1);
  setTimeout(() => playTone(200, 0.3, 'sawtooth', 0.08), 300);
  setTimeout(() => playTone(100, 0.5, 'sawtooth', 0.06), 600);
}

export function playMoveSelect() {
  playTone(700, 0.04, 'square', 0.08);
}

export function playStatusInflict() {
  playTone(250, 0.1, 'sawtooth', 0.1);
  setTimeout(() => playTone(350, 0.1, 'sawtooth', 0.1), 80);
}

export function playSwitchCreature() {
  playTone(500, 0.08, 'sine', 0.1);
  setTimeout(() => playTone(700, 0.08, 'sine', 0.1), 80);
}

// ===========================
// GAME SOUNDS
// ===========================

export function playTapAllocate() {
  playTone(900, 0.04, 'square', 0.1);
}

export function playUnlock() {
  playTone(440, 0.1, 'square', 0.12);
  setTimeout(() => playTone(660, 0.1, 'square', 0.12), 100);
  setTimeout(() => playTone(880, 0.15, 'square', 0.15), 200);
}

export function playMissionComplete() {
  playVictory();
}

export function playNotification() {
  playTone(1000, 0.06, 'sine', 0.08);
  setTimeout(() => playTone(1200, 0.06, 'sine', 0.08), 80);
}
