import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { CREATURES } from '../../../data/creatures';
import LayeredCharacter from '../../../components/game/LayeredCharacter';
import api from '../../../services/api';
import { Howl } from 'howler';
import './BattleReveal.css';

// Synthesize VS sounds inline
function createRevealSounds() {
  const sampleRate = 22050;

  function generateWav(samples) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeStr = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
    writeStr(0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true);
    writeStr(8, 'WAVE'); writeStr(12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true); view.setUint16(34, 16, true);
    writeStr(36, 'data'); view.setUint32(40, samples.length * 2, true);
    let off = 44;
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true); off += 2;
    }
    return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
  }

  // Whoosh sound (player/opponent entrance)
  function makeWhoosh() {
    const dur = 0.4, n = Math.floor(sampleRate * dur), buf = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / sampleRate;
      const env = Math.max(0, 1 - t / dur) * 0.3;
      buf[i] = (Math.random() * 2 - 1) * env * (1 - t / dur);
    }
    return generateWav(buf);
  }

  // VS impact sound (dramatic hit)
  function makeVsImpact() {
    const dur = 0.6, n = Math.floor(sampleRate * dur), buf = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / sampleRate;
      const env = Math.exp(-t * 6) * 0.4;
      const freq = 150 - t * 100;
      buf[i] = (Math.sin(2 * Math.PI * freq * t) + (Math.random() * 2 - 1) * 0.3) * env;
    }
    return generateWav(buf);
  }

  // Rising tone (battle start)
  function makeRising() {
    const dur = 0.5, n = Math.floor(sampleRate * dur), buf = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / sampleRate;
      const freq = 300 + (t / dur) * 600;
      const env = Math.min(1, t * 10) * Math.max(0, 1 - t / dur) * 0.25;
      buf[i] = (Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1) * env;
    }
    return generateWav(buf);
  }

  return {
    whoosh: new Howl({ src: [makeWhoosh()], format: ['wav'] }),
    vsImpact: new Howl({ src: [makeVsImpact()], format: ['wav'] }),
    rising: new Howl({ src: [makeRising()], format: ['wav'] }),
  };
}

let revealSounds = null;
function getRevealSounds() {
  if (!revealSounds) revealSounds = createRevealSounds();
  return revealSounds;
}

export default function BattleReveal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { squad, opponent, matchId } = location.state || {};

  const [phase, setPhase] = useState('black');
  const [showSkip, setShowSkip] = useState(false);
  const [playerConfig, setPlayerConfig] = useState({ base_character: 'base_character_1' });
  const timeoutsRef = useRef([]);

  // Fetch player's customisation
  useEffect(() => {
    async function fetchCustomisation() {
      try {
        const res = await api.get('/shop/customisation');
        const cust = res.data.customisation || {};
        setPlayerConfig({
          base_character: cust.base || 'base_character_1',
          headgear: cust.headgear || null,
          outfit: cust.outfit || null,
          accessories: cust.accessories || null,
          effects_back: null,
          effects_front: cust.effects || null,
          badge: cust.badge || null,
          background: cust.background || null,
        });
      } catch (e) {
        // Fallback to default
      }
    }
    fetchCustomisation();
  }, []);

  useEffect(() => {
    if (!squad || !opponent) {
      navigate('/game/pvp/squad', { replace: true });
      return;
    }

    const schedule = (fn, delay) => {
      const id = setTimeout(fn, delay);
      timeoutsRef.current.push(id);
      return id;
    };

    // Phase timeline — stops at 'vs', waits for user click
    schedule(() => { setPhase('player'); getRevealSounds().whoosh.play(); }, 500);
    schedule(() => { setPhase('opponent'); getRevealSounds().whoosh.play(); }, 2000);
    schedule(() => { setPhase('vs'); getRevealSounds().vsImpact.play(); }, 3500);
    schedule(() => setShowSkip(true), 3500);

    const timeouts = timeoutsRef.current;
    return () => timeouts.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function goToBattle() {
    timeoutsRef.current.forEach(clearTimeout);
    getRevealSounds().rising.play();
    navigate('/game/pvp/battle', {
      state: { squad, opponent, matchId },
      replace: true,
    });
  }

  const playerSquadCreatures = squad ? [...squad.defenders, ...squad.attackers] : [];
  const opponentSquadCreatures = opponent ? [...opponent.squad.defenders, ...opponent.squad.attackers] : [];

  const showPlayer = phase === 'player' || phase === 'opponent' || phase === 'vs';
  const showOpponent = phase === 'opponent' || phase === 'vs';
  const showVs = phase === 'vs';
  const shake = phase === 'vs';

  return (
    <div className={`battle-reveal ${phase === 'black' ? 'battle-reveal--black' : ''} ${shake ? 'battle-reveal--shake' : ''}`} style={{ backgroundImage: phase !== 'black' ? "url('/assets/backgrounds/pvp_reveal_pg.jpg')" : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {/* Player side */}
      <div className={`battle-reveal__player ${showPlayer ? 'battle-reveal__player--enter' : ''}`}>
        <LayeredCharacter config={playerConfig} size="lg" animated />
        <div className="battle-reveal__info">
          <p className="battle-reveal__name">{user?.username || 'Player'}</p>
          <p className="battle-reveal__tier">{user?.tier || 'Analyst'}</p>
        </div>
        <div className="battle-reveal__squad-thumbs">
          {playerSquadCreatures.map(id => {
            const c = CREATURES[id];
            return c ? <img key={id} className="battle-reveal__thumb" src={c.sprite} alt={c.name} /> : null;
          })}
        </div>
        {showPlayer && <div className="battle-reveal__glow-cyan" />}
      </div>

      {/* Opponent side */}
      <div className={`battle-reveal__opponent ${showOpponent ? 'battle-reveal__opponent--enter' : ''}`}>
        <LayeredCharacter config={{ base_character: opponent?.customisation?.base || 'sentinel_default', ...(opponent?.customisation || {}) }} size="lg" animated />
        <div className="battle-reveal__info">
          <p className="battle-reveal__name">{opponent?.username || 'Opponent'}</p>
          <p className="battle-reveal__tier">{opponent?.tier || 'Analyst'}</p>
        </div>
        <div className="battle-reveal__squad-thumbs">
          {opponentSquadCreatures.map(id => {
            const c = CREATURES[id];
            return c ? <img key={id} className="battle-reveal__thumb" src={c.sprite} alt={c.name} /> : null;
          })}
        </div>
        {showOpponent && <div className="battle-reveal__glow-magenta" />}
      </div>

      {/* VS */}
      {showVs && (
        <>
          <div className="battle-reveal__vs battle-reveal__vs--enter">VS</div>
          <div className="battle-reveal__lightning" />
        </>
      )}

      {/* Battle Start */}
      {showVs && (
        <div className="battle-reveal__actions">
          <button className="battle-reveal__start-btn" onClick={goToBattle}>
            START BATTLE
          </button>
          <button className="battle-reveal__quit-btn" onClick={() => navigate('/game/pvp/squad', { replace: true })}>
            QUIT
          </button>
        </div>
      )}

      {/* Skip button (before VS phase) */}
      {showSkip && !showVs && (
        <button className="battle-reveal__skip" onClick={goToBattle}>
          SKIP →
        </button>
      )}
    </div>
  );
}
