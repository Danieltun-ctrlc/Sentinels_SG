import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CREATURES } from '../../../data/creatures';
import { MOVES } from '../../../data/moves';
import { initBattle, executePlayerMove, executeEnemyAI, isBattleOver, getActivePlayer } from '../../../engine/battleEngine';
import api from '../../../services/api';
import './PVPBattle.css';

/**
 * PVP Battle — 4 rounds, first to 3 wins.
 * Round 1: Player Defender 1 vs Opponent Attacker 1
 * Round 2: Player Attacker 1 vs Opponent Defender 1
 * Round 3: Player Defender 2 vs Opponent Attacker 2
 * Round 4: Player Attacker 2 vs Opponent Defender 2
 */

function getRoundMatchups(squad, opponentSquad) {
  return [
    { player: squad.defenders[0], enemy: opponentSquad.attackers[0], label: 'Your Defender 1 vs Their Attacker 1' },
    { player: squad.attackers[0], enemy: opponentSquad.defenders[0], label: 'Your Attacker 1 vs Their Defender 1' },
    { player: squad.defenders[1], enemy: opponentSquad.attackers[1], label: 'Your Defender 2 vs Their Attacker 2' },
    { player: squad.attackers[1], enemy: opponentSquad.defenders[1], label: 'Your Attacker 2 vs Their Defender 2' },
  ];
}

export default function PVPBattle() {
  const navigate = useNavigate();
  const location = useLocation();
  const { squad, opponent, matchId } = location.state || {};

  const [currentRound, setCurrentRound] = useState(0);
  const [battleState, setBattleState] = useState(null);
  const [roundResults, setRoundResults] = useState([]);
  const [playerWins, setPlayerWins] = useState(0);
  const [opponentWins, setOpponentWins] = useState(0);
  const [showRoundResult, setShowRoundResult] = useState(false);
  const [roundResultText, setRoundResultText] = useState('');
  const [matchOver, setMatchOver] = useState(false);
  const [visibleLog, setVisibleLog] = useState([]);
  const logRef = useRef(null);

  const matchups = squad && opponent ? getRoundMatchups(squad, opponent.squad) : [];

  // Initialize first round
  useEffect(() => {
    if (!squad || !opponent) {
      navigate('/game/pvp/squad', { replace: true });
      return;
    }
    startRound(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function startRound(roundIdx) {
    const matchup = matchups[roundIdx];
    if (!matchup) return;

    const state = initBattle(matchup.player, 50, matchup.enemy, 50, null, null, null);
    setBattleState(state);
    setVisibleLog(state.log);
    setCurrentRound(roundIdx);
    setShowRoundResult(false);
  }

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [visibleLog]);

  // Handle player move selection
  const handleMoveSelect = useCallback((moveId) => {
    if (!battleState || battleState.phase !== 'PLAYER_TURN') return;

    let state = executePlayerMove(battleState, moveId);
    setBattleState(state);
    setVisibleLog(state.log);

    // Check if battle ended after player move
    const result = isBattleOver(state);
    if (result) {
      handleRoundEnd(result);
      return;
    }

    // Enemy turn after short delay
    setTimeout(() => {
      let enemyState = executeEnemyAI(state);
      setBattleState(enemyState);
      setVisibleLog(enemyState.log);

      const enemyResult = isBattleOver(enemyState);
      if (enemyResult) {
        handleRoundEnd(enemyResult);
      }
    }, 1000);
  }, [battleState]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleRoundEnd(result) {
    const isWin = result === 'WIN';
    const newResults = [...roundResults, { round: currentRound + 1, result }];
    setRoundResults(newResults);

    const newPlayerWins = playerWins + (isWin ? 1 : 0);
    const newOpponentWins = opponentWins + (isWin ? 0 : 1);
    setPlayerWins(newPlayerWins);
    setOpponentWins(newOpponentWins);

    setRoundResultText(isWin ? 'ROUND WIN!' : 'ROUND LOSS');
    setShowRoundResult(true);

    // Check if match is over (first to 3 wins)
    if (newPlayerWins >= 3 || newOpponentWins >= 3 || newResults.length >= 4) {
      setMatchOver(true);
    }
  }

  async function handleNextRound() {
    if (matchOver) {
      const finalResult = playerWins >= opponentWins ? 'WIN' : 'LOSS';
      // Report match result to server
      try {
        await api.post('/pvp/match/complete', {
          matchId,
          result: finalResult,
          playerScore: playerWins,
          opponentScore: opponentWins,
        });
      } catch (err) {
        // Continue even if API fails
        console.error('Failed to report match result:', err);
      }

      navigate('/game/pvp/debrief', {
        state: {
          result: finalResult,
          playerScore: playerWins,
          opponentScore: opponentWins,
          roundResults,
          opponent,
          awarenessAwarded: finalResult === 'WIN' ? 150 : 25,
        },
        replace: true,
      });
    } else {
      startRound(currentRound + 1);
    }
  }

  if (!battleState) return null;

  const player = getActivePlayer(battleState);
  const enemy = battleState.enemy;
  const isPlayerTurn = battleState.phase === 'PLAYER_TURN';
  const matchup = matchups[currentRound];

  function getHpClass(hp, maxHp) {
    const pct = hp / maxHp;
    if (pct <= 0.25) return 'pvp-battle__hp-fill--critical';
    if (pct <= 0.5) return 'pvp-battle__hp-fill--low';
    return '';
  }

  return (
    <div className="pvp-battle animate-fade-in">
      {/* Round Header */}
      <div className="pvp-battle__round-header">
        <h2 className="pvp-battle__round-title">ROUND {currentRound + 1} of 4</h2>
        <p className="pvp-battle__round-matchup">{matchup?.label}</p>
        <p className="pvp-battle__score">
          <span className="pvp-battle__score-player">{playerWins}</span>
          {' - '}
          <span className="pvp-battle__score-opponent">{opponentWins}</span>
        </p>
      </div>

      {/* Battle Arena */}
      <div className="pvp-battle__arena">
        <div className="pvp-battle__creatures">
          {/* Player creature */}
          <div className="pvp-battle__creature">
            <img
              className="pvp-battle__creature-sprite"
              src={CREATURES[player.creatureId]?.spriteBack || CREATURES[player.creatureId]?.sprite}
              alt={player.name}
            />
            <span className="pvp-battle__creature-name">{player.name}</span>
            <span className="pvp-battle__creature-type">{player.type}</span>
            <div className="pvp-battle__hp-wrap">
              <div className="pvp-battle__hp-label">
                <span>HP</span>
                <span>{player.hp}/{player.maxHp}</span>
              </div>
              <div className="pvp-battle__hp-bar">
                <div
                  className={`pvp-battle__hp-fill ${getHpClass(player.hp, player.maxHp)}`}
                  style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Enemy creature */}
          <div className="pvp-battle__creature">
            <img
              className="pvp-battle__creature-sprite"
              src={CREATURES[enemy.creatureId]?.sprite}
              alt={enemy.name}
            />
            <span className="pvp-battle__creature-name">{enemy.name}</span>
            <span className="pvp-battle__creature-type">{enemy.type}</span>
            <div className="pvp-battle__hp-wrap">
              <div className="pvp-battle__hp-label">
                <span>HP</span>
                <span>{enemy.hp}/{enemy.maxHp}</span>
              </div>
              <div className="pvp-battle__hp-bar">
                <div
                  className={`pvp-battle__hp-fill ${getHpClass(enemy.hp, enemy.maxHp)}`}
                  style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Battle Log */}
        <div className="pvp-battle__log" ref={logRef}>
          {visibleLog.slice(-8).map((entry, i) => (
            <p key={i} className={`pvp-battle__log-entry pvp-battle__log-entry--${entry.type}`}>
              {entry.text}
            </p>
          ))}
        </div>

        {/* Move Buttons or Waiting */}
        {isPlayerTurn ? (
          <div className="pvp-battle__moves">
            {player.moves.map(moveId => {
              const move = MOVES[moveId];
              if (!move) return null;
              const pp = player.pp[moveId] ?? 0;
              return (
                <button
                  key={moveId}
                  className="pvp-battle__move-btn"
                  onClick={() => handleMoveSelect(moveId)}
                  disabled={pp <= 0}
                >
                  <span className="pvp-battle__move-name">{move.name}</span>
                  <span className="pvp-battle__move-info">
                    {move.category === 'attack' ? `PWR ${move.power}` : 'STATUS'} | PP {pp}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="pvp-battle__waiting">
            {opponent?.username || 'Opponent'} is choosing...
          </div>
        )}
      </div>

      {/* Round Result Overlay */}
      {showRoundResult && (
        <div className="pvp-battle__round-result">
          <p className={`pvp-battle__round-result-text ${roundResultText.includes('WIN') ? 'pvp-battle__round-result-text--win' : 'pvp-battle__round-result-text--loss'}`}>
            {roundResultText}
          </p>
          <p className="pvp-battle__round-result-sub">
            Score: {playerWins} - {opponentWins}
          </p>
          <button className="pvp-battle__next-btn" onClick={handleNextRound}>
            {matchOver ? 'VIEW RESULTS' : 'NEXT ROUND'}
          </button>
        </div>
      )}
    </div>
  );
}
