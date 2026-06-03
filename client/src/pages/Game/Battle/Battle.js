import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { initBattle, executePlayerMove, executeEnemyAI, isBattleOver, swapCreature, canSwap, getActivePlayer } from '../../../engine/battleEngine';
import { getEffectivenessDialogue } from '../../../data/effectivenessDialogue';
import { MISSIONS } from '../../../data/missions';
import { CREATURES } from '../../../data/creatures';
import MoveSelector from '../../../components/game/MoveSelector';
import TypewriterText from '../../../components/game/TypewriterText';
import BattleEffects from '../../../components/effects/BattleEffects';
import gameService from '../../../services/gameService';
import { useAuth } from '../../../context/AuthContext';
import { playBattleStart, playPlayerAttack, playEnemyAttack, playSuperEffective, playCriticalHit, playDamageTaken, playFaint, playVictory, playDefeat, playMoveSelect, playStatusInflict, playSwitchCreature } from '../../../utils/synthSounds';
import './Battle.css';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function Battle() {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const [battleState, setBattleState] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [enemyHit, setEnemyHit] = useState(false);
  const [playerHit, setPlayerHit] = useState(false);
  const [playerFainted, setPlayerFainted] = useState(false);
  const [playerBuff, setPlayerBuff] = useState(null); // 'up' or 'down'
  const [enemyBuff, setEnemyBuff] = useState(null);
  const [playerLunge, setPlayerLunge] = useState(false);
  const [enemyLunge, setEnemyLunge] = useState(false);
  const [impactFlash, setImpactFlash] = useState(null);
  const [playerExiting, setPlayerExiting] = useState(false);
  const [playerEntering, setPlayerEntering] = useState(false);
  const [hoveredMove, setHoveredMove] = useState(null);
  const [loading, setLoading] = useState(true);
  const [screenShake, setScreenShake] = useState(false);
  const [damageNum, setDamageNum] = useState(null);
  const [effectText, setEffectText] = useState(null);
  const [showVictory, setShowVictory] = useState(false);
  const [battleEffect, setBattleEffect] = useState(null);
  const [dialogueText, setDialogueText] = useState('');
  const [awaitingClick, setAwaitingClick] = useState(false);
  const enemyTurnProcessed = useRef(false);
  const openingDone = useRef(false);

  const role = location.state?.role || 'defender';
  const squadSelection = location.state?.squad || [];

  // Memoize particle positions so they don't re-randomize on re-render
  const particles = useMemo(() => {
    const colors = ['rgba(0,217,255,0.3)', 'rgba(255,46,99,0.25)', 'rgba(255,184,0,0.2)', 'rgba(0,217,255,0.2)', 'rgba(255,46,99,0.2)'];
    return Array.from({ length: 15 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${60 + Math.random() * 40}%`,
      background: colors[i % colors.length],
      animationDuration: `${6 + Math.random() * 9}s`,
      animationDelay: `${Math.random() * 8}s`,
      '--p-opacity': 0.1 + Math.random() * 0.2,
    }));
  }, []);

  // Click-to-advance: uses document event to avoid stale closure issues
  const waitForClick = () => {
    return new Promise((resolve) => {
      const handler = () => {
        document.removeEventListener('battle-advance', handler);
        resolve();
      };
      document.addEventListener('battle-advance', handler);
    });
  };

  const handleDialogueClick = () => {
    document.dispatchEvent(new Event('battle-advance'));
  };

  // Show one message, wait for typewriter to finish, then wait for click
  const showAndWait = async (text) => {
    if (!text) return;
    setDialogueText(text);
    setAwaitingClick(false);
    // Wait for typewriter to finish — fast speed, short minimum
    const typingTime = Math.max(600, (text.length / 40) * 1000);
    await delay(typingTime);
    setAwaitingClick(true);
    // Wait for user click
    await waitForClick();
    setAwaitingClick(false);
  };

  // Show multiple messages sequentially
  const showMessages = async (messages) => {
    for (const msg of messages) {
      if (!msg) continue;
      await showAndWait(msg);
    }
    setDialogueText('');
  };

  // Trigger buff/debuff animation on a side
  const flashBuff = (side, direction) => {
    if (side === 'player') { setPlayerBuff(direction); setTimeout(() => setPlayerBuff(null), 600); }
    else { setEnemyBuff(direction); setTimeout(() => setEnemyBuff(null), 600); }
  };

  // Initialize battle
  useEffect(() => {
    const mission = MISSIONS[missionId];
    if (!mission) { navigate('/game/campaign'); return; }

    async function loadBattle() {
      try {
        let playerCreatureId, enemyCreatureId;
        if (role === 'attacker') {
          playerCreatureId = squadSelection[0] || 'phishmonger';
          enemyCreatureId = 'verifox';
        } else {
          playerCreatureId = squadSelection[0] || 'verifox';
          enemyCreatureId = mission.bossId;
        }

        // Load all squad creatures' data
        const squadData = [];
        const creaturesToLoad = squadSelection.length > 0 ? squadSelection : [playerCreatureId];
        for (const cId of creaturesToLoad) {
          try {
            const d = await gameService.getCreatureDetail(cId);
            squadData.push({
              creatureId: d.creature.creature_id,
              level: d.creature.level || 50,
              hp_invested: d.creature.hp_invested || 0,
              atk_invested: d.creature.atk_invested || 0,
              def_invested: d.creature.def_invested || 0,
              spd_invested: d.creature.spd_invested || 0,
              activeAbility: d.activeAbility,
              equippedMoves: d.equippedMoves.map(m => m.moveId),
            });
          } catch (e) {
            squadData.push({ creatureId: cId, level: 50, hp_invested: 0, atk_invested: 0, def_invested: 0, spd_invested: 0 });
          }
        }

        const first = squadData[0];
        const state = initBattle(first.creatureId, first.level, enemyCreatureId, mission.bossLevel || 50, mission, first, squadData);

        // Override moves/ability for each squad member
        for (let i = 0; i < squadData.length; i++) {
          if (squadData[i].equippedMoves && squadData[i].equippedMoves.length > 0 && state.playerSquad[i]) {
            state.playerSquad[i].moves = squadData[i].equippedMoves;
            const { MOVES } = require('../../../data/moves');
            state.playerSquad[i].pp = {};
            squadData[i].equippedMoves.forEach(moveId => { state.playerSquad[i].pp[moveId] = MOVES[moveId]?.pp || 5; });
          }
          if (squadData[i].activeAbility && state.playerSquad[i]) {
            state.playerSquad[i].ability = squadData[i].activeAbility;
          }
        }
        state.player = state.playerSquad[0];

        setBattleState(state);
        playBattleStart();
        setAnimating(true); // Block moves during opening messages
        setLoading(false);
        // Show all opening messages with animations
        const openingMsgs = state.log.map(l => l.text);
        for (const msg of openingMsgs) {
          // Detect ability stat drops in opening
          if (msg.includes('lowered') || msg.includes('fell')) flashBuff('player', 'down');
          await showAndWait(msg);
        }
        setDialogueText('');
        // Mark opening done
        openingDone.current = true;
        // Always player's turn first now
        setAnimating(false);
        return;
      } catch (err) {
        const mission2 = MISSIONS[missionId];
        const pId = role === 'attacker' ? (squadSelection[0] || 'phishmonger') : (squadSelection[0] || 'verifox');
        const eId = role === 'attacker' ? 'verifox' : mission2.bossId;
        const state = initBattle(pId, 50, eId, mission2.bossLevel || 50, mission2, null, null);
        setBattleState(state);
        playBattleStart();
        setAnimating(true);
        setLoading(false);
        const openingMsgs2 = state.log.map(l => l.text);
        await showMessages(openingMsgs2);
        openingDone.current = true;
        setAnimating(false);
        return;
      }
      setLoading(false);
    }
    loadBattle();
  }, [missionId, navigate, role, squadSelection]);

  // Speed-based turn order is now handled inside handleMoveSelect
  // No need for enemy-first useEffect anymore

  const runEnemyTurn = async (currentState) => {
    setAnimating(true);
    await delay(500);

    const { MOVES } = require('../../../data/moves');
    const newState = executeEnemyAI(currentState);
    const enemyMoveId = newState.lastAction?.moveId;
    const enemyMove = enemyMoveId ? MOVES[enemyMoveId] : null;

    // Lunge animation BEFORE showing damage
    if (enemyMove?.category === 'attack') {
      setEnemyLunge(true);
      await delay(350);
      setEnemyLunge(false);
    } else if (enemyMove?.category === 'status') {
      flashBuff('player', 'down');
      await delay(300);
    }

    playEnemyAttack();

    // Trigger pixel-splash for enemy attack
    if (enemyMove?.category === 'attack') {
      setBattleEffect({ type: 'attack', side: 'enemy', moveType: enemyMove.type, isCrit: newState.lastAction?.isCrit || false, isSuper: (newState.lastAction?.effectiveness || 1) >= 2 });
    }

    // Now update state (HP drops, etc)
    setBattleState(newState);
    setPlayerHit(true);

    if (newState.lastAction?.damage > 0) {
      setImpactFlash('player');
      setTimeout(() => setImpactFlash(null), 300);
      const dmgType = newState.lastAction.isCrit ? 'crit' : 'normal';
      setDamageNum({ value: newState.lastAction.damage, type: dmgType, side: 'player' });
      setTimeout(() => setDamageNum(null), 800);
    }
    if (newState.lastAction?.isCrit) { playCriticalHit(); setScreenShake(true); setTimeout(() => setScreenShake(false), 300); }

    await delay(600);
    setPlayerHit(false);
    await delay(300);

    // Show messages
    const msgs = [];
    msgs.push(`${newState.enemy.name} used ${enemyMove?.name || 'an attack'}!`);
    if (newState.lastAction?.damage > 0) msgs.push(`${getActivePlayer(newState).name} took ${newState.lastAction.damage} damage!`);
    if (newState.lastAction?.effectiveness >= 2) msgs.push("It's super effective!");
    if (newState.lastAction?.effectiveness < 1) msgs.push("It's not very effective...");
    // Educational dialogue
    const eduMsg = getEffectivenessDialogue(enemyMove?.type, getActivePlayer(newState).type, newState.lastAction?.effectiveness || 1, enemyMoveId);
    if (eduMsg) msgs.push(eduMsg);
    if (enemyMove?.realMeaning) msgs.push(`⚠️ ${enemyMove.realMeaning}`);
    await showMessages(msgs);

    const result = isBattleOver(newState);
    if (result === 'LOSS') {
      setPlayerFainted(true);
      playFaint();
      await delay(800);
      playDefeat();
      await showAndWait('Mission failed...');
      await delay(500);
      navigate('/game/campaign');
      return;
    }

    setDialogueText('');
    setAnimating(false);
    enemyTurnProcessed.current = false;
  };

  const handleMoveSelect = async (moveId) => {
    if (animating || !battleState || battleState.phase !== 'PLAYER_TURN') return;
    setAnimating(true);
    enemyTurnProcessed.current = true;

    const { MOVES } = require('../../../data/moves');
    const move = MOVES[moveId];

    // === PLAYER ACTS ===
    const afterPlayer = await executePlayerTurnUI(battleState, moveId, move);
    if (!afterPlayer) return; // battle ended (win)

    // === ENEMY ACTS ===
    await executeEnemyTurnUI(afterPlayer);
  };

  // === HELPER: Execute player's move with animations ===
  const executePlayerTurnUI = async (currentState, moveId, move) => {
    const { MOVES } = require('../../../data/moves');
    await delay(200);

    if (move?.category === 'attack') {
      setPlayerLunge(true);
      await delay(350);
      setPlayerLunge(false);
    } else if (move?.category === 'status' && move?.effect?.target === 'self') {
      flashBuff('player', 'up');
      await delay(300);
    } else if (move?.category === 'status') {
      flashBuff('enemy', 'down');
      await delay(300);
    }

    playPlayerAttack();
    if (move?.category === 'attack') {
      setBattleEffect({ type: 'attack', side: 'player', moveType: move.type, isCrit: false, isSuper: false });
    }

    let newState = executePlayerMove(currentState, moveId);
    setBattleState(newState);
    setEnemyHit(true);

    if (newState.lastAction?.isCrit || newState.lastAction?.effectiveness >= 2) {
      setBattleEffect(prev => prev ? { ...prev, isCrit: newState.lastAction.isCrit, isSuper: newState.lastAction.effectiveness >= 2 } : null);
    }
    if (newState.lastAction?.damage > 0) {
      setImpactFlash('enemy');
      setTimeout(() => setImpactFlash(null), 300);
      const dmgType = newState.lastAction.isCrit ? 'crit' : newState.lastAction.effectiveness >= 2 ? 'super' : newState.lastAction.effectiveness < 1 ? 'resist' : 'normal';
      setDamageNum({ value: newState.lastAction.damage, type: dmgType, side: 'enemy' });
      setTimeout(() => setDamageNum(null), 800);
    }
    if (newState.lastAction?.isCrit) { playCriticalHit(); setScreenShake(true); setTimeout(() => setScreenShake(false), 300); }
    if (newState.lastAction?.effectiveness >= 2) { playSuperEffective(); setEffectText('SUPER EFFECTIVE!'); setTimeout(() => setEffectText(null), 1200); }
    if (newState.lastAction?.effectiveness < 1 && newState.lastAction?.damage > 0) { setEffectText('NOT VERY EFFECTIVE...'); setTimeout(() => setEffectText(null), 1200); }

    await delay(500);
    setEnemyHit(false);

    const playerMsgs = [];
    playerMsgs.push(`${getActivePlayer(newState).name} used ${move?.name || moveId}!`);
    if (newState.lastAction?.missed) {
      playerMsgs.push(`${getActivePlayer(newState).name} is DECEIVED and missed!`);
    } else if (newState.lastAction?.damage > 0) {
      playerMsgs.push(`${newState.enemy.name} took ${newState.lastAction.damage} damage!`);
      if (newState.lastAction?.effectiveness >= 2) playerMsgs.push("It's super effective!");
      if (newState.lastAction?.effectiveness < 1) playerMsgs.push("It's not very effective...");
      if (newState.lastAction?.isCrit) playerMsgs.push("Critical hit!");
      // Educational dialogue explaining WHY the matchup works
      const eduDialogue = getEffectivenessDialogue(move?.type, newState.enemy.type, newState.lastAction.effectiveness, moveId);
      if (eduDialogue) playerMsgs.push(eduDialogue);
    }
    const prevLogLen = currentState.log.length;
    const newLogs = newState.log.slice(prevLogLen);
    for (const l of newLogs) {
      if (l.type === 'stat') { playerMsgs.push(l.text); if (l.text.includes('fell')) flashBuff('enemy', 'down'); if (l.text.includes('rose')) flashBuff('player', 'up'); }
      if (l.type === 'status') { playerMsgs.push(l.text); flashBuff('enemy', 'down'); }
      if (l.type === 'ability') playerMsgs.push(l.text);
    }
    if (move?.realMeaning) playerMsgs.push(`💡 ${move.realMeaning}`);
    await showMessages(playerMsgs);

    const result = isBattleOver(newState);
    if (result === 'WIN') {
      playVictory();
      setShowVictory(true);
      await delay(2000);
      try {
        await gameService.saveBattle({ battleType: 'PVE', missionId, result: 'WIN', turnsTaken: newState.turn, battleLog: [] });
        await gameService.completeMission({ missionId, role, rank: newState.turn <= 5 ? 'S' : newState.turn <= 8 ? 'A' : 'B', turnsTaken: newState.turn, damageTakenPct: Math.floor(((getActivePlayer(newState).maxHp - getActivePlayer(newState).hp) / getActivePlayer(newState).maxHp) * 100) });
        await refreshUser();
      } catch (e) { console.error('[Battle] Failed to save victory:', e); }
      navigate(`/game/pve/${missionId}/debrief`, { state: { result: 'WIN', turns: newState.turn } });
      return null; // signals battle ended
    }
    return newState;
  };

  // === HELPER: Execute enemy turn with animations (after player) ===
  const executeEnemyTurnUI = async (currentState) => {
    const { MOVES } = require('../../../data/moves');
    await delay(400);

    const enemyState = executeEnemyAI(currentState);
    const enemyMoveId = enemyState.lastAction?.moveId;
    const enemyMove = enemyMoveId ? MOVES[enemyMoveId] : null;

    if (enemyMove?.category === 'attack') {
      setEnemyLunge(true); await delay(350); setEnemyLunge(false);
    } else if (enemyMove?.category === 'status' && enemyMove?.effect?.target === 'self') {
      flashBuff('enemy', 'up'); await delay(300);
    } else if (enemyMove?.category === 'status') {
      flashBuff('player', 'down'); await delay(300);
    }

    playEnemyAttack();
    if (enemyMove?.category === 'attack') {
      setBattleEffect({ type: 'attack', side: 'enemy', moveType: enemyMove.type, isCrit: enemyState.lastAction?.isCrit || false, isSuper: (enemyState.lastAction?.effectiveness || 1) >= 2 });
    }

    const activePlayer = getActivePlayer(currentState);
    const creatureChanged = getActivePlayer(enemyState).creatureId !== activePlayer.creatureId;
    const result2 = isBattleOver(enemyState);

    if (creatureChanged || result2 === 'LOSS') {
      const intermediateState = JSON.parse(JSON.stringify(currentState));
      const oldCreature = intermediateState.playerSquad[intermediateState.activePlayerIndex];
      oldCreature.hp = 0; oldCreature.fainted = true;
      intermediateState.enemy = enemyState.enemy;
      intermediateState.lastAction = enemyState.lastAction;
      intermediateState.log = enemyState.log;
      intermediateState.turn = enemyState.turn;
      setBattleState(intermediateState);
    } else {
      setBattleState(enemyState);
    }

    setPlayerHit(true);
    if (enemyState.lastAction?.damage > 0) {
      setImpactFlash('player'); setTimeout(() => setImpactFlash(null), 300);
      const dmgType = enemyState.lastAction.isCrit ? 'crit' : enemyState.lastAction.effectiveness >= 2 ? 'super' : 'normal';
      setDamageNum({ value: enemyState.lastAction.damage, type: dmgType, side: 'player' });
      setTimeout(() => setDamageNum(null), 800);
    }
    if (enemyState.lastAction?.isCrit) { playCriticalHit(); setScreenShake(true); setImpactFlash('screen'); setTimeout(() => { setScreenShake(false); setImpactFlash(null); }, 300); }
    if (enemyState.lastAction?.effectiveness >= 2) { playSuperEffective(); setEffectText('SUPER EFFECTIVE!'); setTimeout(() => setEffectText(null), 1200); }

    await delay(600);
    setPlayerHit(false);
    await delay(400);

    const prevLogLen2 = currentState.log.length;
    const newEnemyLogs = enemyState.log.slice(prevLogLen2);
    const enemyMsgs = [];
    enemyMsgs.push(`${currentState.enemy.name} used ${enemyMove?.name || enemyMoveId || 'an attack'}!`);
    if (enemyState.lastAction?.missed) {
      enemyMsgs.push(`${currentState.enemy.name} is DECEIVED and missed!`);
    } else if (enemyState.lastAction?.damage > 0) {
      enemyMsgs.push(`${activePlayer.name} took ${enemyState.lastAction.damage} damage!`);
      if (enemyState.lastAction?.effectiveness >= 2) enemyMsgs.push("It's super effective!");
      if (enemyState.lastAction?.effectiveness < 1) enemyMsgs.push("It's not very effective...");
      // Educational dialogue for enemy attacks
      const eduDialogue = getEffectivenessDialogue(enemyMove?.type, activePlayer.type, enemyState.lastAction.effectiveness, enemyMoveId);
      if (eduDialogue) enemyMsgs.push(eduDialogue);
    }
    for (const l of newEnemyLogs) {
      if (l.type === 'stat') { enemyMsgs.push(l.text); if (l.text.includes('fell')) flashBuff('player', 'down'); if (l.text.includes('rose')) flashBuff('enemy', 'up'); }
      if (l.type === 'status') { enemyMsgs.push(l.text); flashBuff('player', 'down'); }
      if (l.type === 'ability') enemyMsgs.push(l.text);
    }
    if (enemyMove?.realMeaning) enemyMsgs.push(`⚠️ ${enemyMove.realMeaning}`);
    await showMessages(enemyMsgs);

    if (result2 === 'LOSS') {
      setPlayerFainted(true); playFaint(); await delay(800);
      await showAndWait(`${activePlayer.name} fainted!`);
      playDefeat(); await showAndWait('All creatures have fainted... Mission failed.');
      await delay(500); navigate('/game/campaign'); return;
    }

    if (creatureChanged) {
      setPlayerFainted(true); playFaint(); await delay(800);
      await showAndWait(`${activePlayer.name} fainted!`);
      setPlayerFainted(false); setBattleState(enemyState);
      setPlayerEntering(true); await delay(500); setPlayerEntering(false);
      await showAndWait(`${getActivePlayer(enemyState).name} enters the battle!`);
    }

    // Force phase to PLAYER_TURN for next turn
    setBattleState(prev => ({ ...prev, phase: 'PLAYER_TURN' }));
    setDialogueText('');
    setAnimating(false);
    enemyTurnProcessed.current = false;
  };

  // === HELPER: Enemy acts first (when enemy is faster) ===
  const executeEnemyFirstUI = async (currentState) => {
    const { MOVES } = require('../../../data/moves');
    const enemyState = executeEnemyAI(currentState);
    const enemyMoveId = enemyState.lastAction?.moveId;
    const enemyMove = enemyMoveId ? MOVES[enemyMoveId] : null;

    if (enemyMove?.category === 'attack') {
      setEnemyLunge(true); await delay(350); setEnemyLunge(false);
    } else if (enemyMove?.category === 'status' && enemyMove?.effect?.target === 'self') {
      flashBuff('enemy', 'up'); await delay(300);
    } else if (enemyMove?.category === 'status') {
      flashBuff('player', 'down'); await delay(300);
    }

    playEnemyAttack();
    if (enemyMove?.category === 'attack') {
      setBattleEffect({ type: 'attack', side: 'enemy', moveType: enemyMove.type, isCrit: enemyState.lastAction?.isCrit || false, isSuper: (enemyState.lastAction?.effectiveness || 1) >= 2 });
    }

    const activePlayer = getActivePlayer(currentState);
    const creatureChanged = getActivePlayer(enemyState).creatureId !== activePlayer.creatureId;
    const result2 = isBattleOver(enemyState);

    if (creatureChanged || result2 === 'LOSS') {
      const intermediateState = JSON.parse(JSON.stringify(currentState));
      const oldCreature = intermediateState.playerSquad[intermediateState.activePlayerIndex];
      oldCreature.hp = 0; oldCreature.fainted = true;
      intermediateState.enemy = enemyState.enemy;
      intermediateState.lastAction = enemyState.lastAction;
      intermediateState.turn = enemyState.turn;
      setBattleState(intermediateState);
    } else {
      setBattleState(enemyState);
    }

    setPlayerHit(true);
    if (enemyState.lastAction?.damage > 0) {
      setImpactFlash('player'); setTimeout(() => setImpactFlash(null), 300);
      const dmgType = enemyState.lastAction.isCrit ? 'crit' : 'normal';
      setDamageNum({ value: enemyState.lastAction.damage, type: dmgType, side: 'player' });
      setTimeout(() => setDamageNum(null), 800);
    }
    if (enemyState.lastAction?.isCrit) { playCriticalHit(); setScreenShake(true); setTimeout(() => setScreenShake(false), 300); }

    await delay(600);
    setPlayerHit(false);
    await delay(300);

    const enemyMsgs = [];
    enemyMsgs.push(`${currentState.enemy.name} used ${enemyMove?.name || 'an attack'}!`);
    if (enemyState.lastAction?.damage > 0) enemyMsgs.push(`${activePlayer.name} took ${enemyState.lastAction.damage} damage!`);
    if (enemyState.lastAction?.effectiveness >= 2) enemyMsgs.push("It's super effective!");
    if (enemyMove?.realMeaning) enemyMsgs.push(`⚠️ ${enemyMove.realMeaning}`);
    await showMessages(enemyMsgs);

    if (result2 === 'LOSS') {
      setPlayerFainted(true); playFaint(); await delay(800);
      await showAndWait(`${activePlayer.name} fainted!`);
      playDefeat(); await showAndWait('All creatures fainted... Mission failed.');
      await delay(500); navigate('/game/campaign'); return null;
    }

    if (creatureChanged) {
      setPlayerFainted(true); playFaint(); await delay(800);
      await showAndWait(`${activePlayer.name} fainted!`);
      setPlayerFainted(false); setBattleState(enemyState);
      setPlayerEntering(true); await delay(500); setPlayerEntering(false);
      await showAndWait(`${getActivePlayer(enemyState).name} enters the battle!`);
    }

    return enemyState;
  };

  if (loading) {
    return (
      <div className="battle">
        <div className="loading-screen">
          <div className="loading-screen__spinner"></div>
          <p className="pixel-text--sm">LOADING BATTLE...</p>
        </div>
      </div>
    );
  }

  if (!battleState) return null;
  const mission = MISSIONS[missionId];
  const activePlayer = getActivePlayer(battleState);
  const enemy = battleState.enemy;
  const playerHpPct = Math.max(0, (activePlayer.hp / activePlayer.maxHp) * 100);
  const enemyHpPct = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
  const playerHpColor = playerHpPct > 50 ? 'var(--color-green)' : playerHpPct > 25 ? 'var(--color-amber)' : 'var(--color-red)';
  const enemyHpColor = enemyHpPct > 50 ? 'var(--color-green)' : enemyHpPct > 25 ? 'var(--color-amber)' : 'var(--color-red)';

  return (
    <div className={`battle ${screenShake ? 'battle--shake' : ''}`}>
      {/* Victory overlay */}
      {showVictory && (
        <div className="battle__victory-overlay">
          <div className="battle__confetti"></div>
          <div className="battle__confetti"></div>
          <div className="battle__confetti"></div>
          <div className="battle__confetti"></div>
          <div className="battle__confetti"></div>
          <div className="battle__confetti"></div>
          <div className="battle__confetti"></div>
          <div className="battle__confetti"></div>
          <span className="battle__victory-text">VICTORY</span>
        </div>
      )}

      {/* TOP BAR */}
      <div className="battle__topbar">
        <span className="battle__mission-name">▶ {mission?.name || 'BATTLE'}</span>
        <span className="battle__turn">TURN {battleState.turn}</span>
        <span className={`battle__phase-indicator ${battleState.phase === 'PLAYER_TURN' && !animating ? 'battle__phase-indicator--player' : animating && dialogueText ? 'battle__phase-indicator--click' : animating ? 'battle__phase-indicator--animating' : 'battle__phase-indicator--enemy'}`}>
          {battleState.phase === 'PLAYER_TURN' && !animating ? '▶ YOUR TURN' : animating && awaitingClick ? '▼ CLICK' : animating ? '⏳ ...' : '▶ ENEMY'}
        </span>
      </div>

      {/* BATTLE ARENA — both creatures in one area */}
      <div className="battle__arena">
        {/* Atmosphere layers */}
        <div className="battle__arena-grid"></div>
        {/* City silhouette */}
        <div className="battle__city">
          <svg className="battle__city-svg" viewBox="0 0 1000 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,120 L0,90 L30,90 L30,60 L45,60 L45,50 L50,50 L50,60 L65,60 L65,90 L100,90 L100,70 L110,70 L110,40 L115,40 L115,30 L120,30 L120,40 L125,40 L125,70 L150,70 L150,85 L200,85 L200,55 L210,55 L210,35 L220,35 L220,55 L230,55 L230,85 L280,85 L280,65 L290,65 L290,45 L295,45 L295,20 L300,20 L300,45 L305,45 L305,65 L320,65 L320,80 L380,80 L380,50 L390,50 L390,30 L400,30 L400,15 L405,15 L405,30 L410,30 L410,50 L420,50 L420,80 L470,80 L470,70 L500,70 L500,45 L510,45 L510,25 L515,25 L515,45 L520,45 L520,70 L560,70 L560,85 L600,85 L600,60 L610,60 L610,35 L620,35 L620,20 L625,20 L625,35 L630,35 L630,60 L650,60 L650,75 L700,75 L700,55 L720,55 L720,40 L725,40 L725,25 L730,25 L730,40 L735,40 L735,55 L760,55 L760,80 L800,80 L800,65 L830,65 L830,50 L840,50 L840,35 L845,35 L845,50 L850,50 L850,65 L880,65 L880,85 L920,85 L920,70 L940,70 L940,55 L950,55 L950,70 L970,70 L970,90 L1000,90 L1000,120 Z" fill="#080D18" stroke="rgba(0,217,255,0.12)" strokeWidth="0.5"/>
            {/* Window lights */}
            <rect x="115" y="34" width="2" height="2" fill="rgba(0,217,255,0.5)"/>
            <rect x="295" y="24" width="2" height="2" fill="rgba(255,46,99,0.4)"/>
            <rect x="405" y="18" width="2" height="2" fill="rgba(0,217,255,0.6)"/>
            <rect x="515" y="28" width="2" height="2" fill="rgba(255,184,0,0.4)"/>
            <rect x="625" y="24" width="2" height="2" fill="rgba(0,217,255,0.5)"/>
            <rect x="725" y="28" width="2" height="2" fill="rgba(255,46,99,0.5)"/>
            <rect x="845" y="38" width="2" height="2" fill="rgba(0,217,255,0.4)"/>
          </svg>
        </div>
        {/* Energy lines */}
        <div className="battle__energy-lines">
          <div className="battle__energy-line battle__energy-line--1"></div>
          <div className="battle__energy-line battle__energy-line--2"></div>
          <div className="battle__energy-line battle__energy-line--3"></div>
        </div>
        <div className="battle__particles">
          {particles.map((p, i) => (
            <div key={i} className="battle__particle" style={p} />
          ))}
        </div>
        <div className="battle__scanlines"></div>
        <div className="battle__crt-flicker"></div>

        {/* Layered move effects */}
        <BattleEffects effect={battleEffect} onComplete={() => setBattleEffect(null)} />

        {effectText && <div className={`battle__effect-text ${effectText.includes('NOT') ? 'battle__effect-text--weak' : ''}`}>{effectText}</div>}
        {impactFlash && <div className={`battle__impact battle__impact--${impactFlash}`}></div>}

        {/* Enemy (nameplate left, sprite right) */}
        <div className="battle__enemy-area">
          <div className="battle__nameplate battle__nameplate--enemy">
            <div className="battle__nameplate-row">
              <span className="battle__nameplate-name">{enemy.name}</span>
              <span className="battle__nameplate-level">Lv.{enemy.level}</span>
            </div>
            {enemy.statusEffects && enemy.statusEffects.length > 0 && (
              <div className="battle__status-badges">
                {enemy.statusEffects.map((s, i) => (
                  <span key={i} className={`battle__status-badge battle__status-badge--${s.type.toLowerCase()}`}>
                    {s.type.slice(0, 3)}
                  </span>
                ))}
              </div>
            )}
            <div className="battle__nameplate-hp">
              <div className="battle__hp-track">
                <div className={`battle__hp-fill ${enemyHpPct <= 25 ? 'battle__hp-fill--critical' : ''}`} style={{ width: `${enemyHpPct}%`, background: enemyHpColor }}></div>
              </div>
              <span className="battle__hp-text">{enemy.hp}/{enemy.maxHp}</span>
            </div>
          </div>
          <div className={`battle__sprite ${enemyHit ? 'battle__sprite--hit' : ''} ${enemyBuff === 'up' ? 'battle__sprite--buff-up' : ''} ${enemyBuff === 'down' ? 'battle__sprite--buff-down' : ''} ${enemyLunge ? 'battle__sprite--lunge-left' : ''}`}>
            {enemy.sprite ? <img src={enemy.sprite} alt={enemy.name} /> : <span style={{ fontSize: '80px' }}>👾</span>}
            <div className="battle__platform battle__platform--enemy"></div>
          </div>
          {damageNum && damageNum.side === 'enemy' && <span className={`battle__dmg battle__dmg--${damageNum.type}`}>{damageNum.value}</span>}
        </div>

        {/* Player (sprite left, nameplate right) */}
        <div className="battle__player-area">
          <div className={`battle__sprite ${playerHit ? 'battle__sprite--hit' : ''} ${playerFainted ? 'battle__sprite--fainted' : ''} ${playerBuff === 'up' ? 'battle__sprite--buff-up' : ''} ${playerBuff === 'down' ? 'battle__sprite--buff-down' : ''} ${playerLunge ? 'battle__sprite--lunge-right' : ''} ${playerExiting ? 'battle__sprite--exit-left' : ''} ${playerEntering ? 'battle__sprite--enter-left' : ''}`}>
            {activePlayer.spriteBack ? <img src={activePlayer.spriteBack} alt={activePlayer.name} /> : <span style={{ fontSize: '80px' }}>🛡️</span>}
            <div className="battle__platform battle__platform--player"></div>
          </div>
          <div className="battle__nameplate battle__nameplate--player">
            <div className="battle__nameplate-row">
              <span className="battle__nameplate-name">{activePlayer.name}</span>
              <span className="battle__nameplate-level">Lv.{activePlayer.level}</span>
            </div>
            {activePlayer.statusEffects && activePlayer.statusEffects.length > 0 && (
              <div className="battle__status-badges">
                {activePlayer.statusEffects.map((s, i) => (
                  <span key={i} className={`battle__status-badge battle__status-badge--${s.type.toLowerCase()}`}>
                    {s.type.slice(0, 3)}
                  </span>
                ))}
              </div>
            )}
            <div className="battle__nameplate-hp">
              <div className="battle__hp-track">
                <div className={`battle__hp-fill ${playerHpPct <= 25 ? 'battle__hp-fill--critical' : ''}`} style={{ width: `${playerHpPct}%`, background: playerHpColor }}></div>
              </div>
              <span className="battle__hp-text">{activePlayer.hp}/{activePlayer.maxHp}</span>
            </div>
          </div>
          {damageNum && damageNum.side === 'player' && <span className={`battle__dmg battle__dmg--${damageNum.type}`}>{damageNum.value}</span>}
        </div>
      </div>

      {/* DIALOGUE BOX */}
      <div className={`battle__dialogue ${!dialogueText && battleState.phase === 'PLAYER_TURN' && !animating ? 'battle__dialogue--waiting' : ''}`} onClick={handleDialogueClick}>
        {dialogueText ? (
          <TypewriterText text={dialogueText} speed={45} />
        ) : (
          <p className="battle__dialogue-text">{battleState.phase === 'PLAYER_TURN' && !animating ? 'What will you do?' : ''}</p>
        )}
        {awaitingClick && <span className="battle__dialogue-cursor">▼</span>}
      </div>

      {/* MOVE GRID */}
      <div className="battle__moves-zone">
        {battleState.phase === 'PLAYER_TURN' && !animating ? (
          <>
            <div className="battle__moves-grid">
              <MoveSelector moves={activePlayer.moves} pp={activePlayer.pp} onSelect={handleMoveSelect} disabled={animating} onHover={setHoveredMove} />
            </div>
            <div className="battle__side-actions">
              {/* Move info panel — compact */}
              {hoveredMove ? (
                <div className="battle__move-info battle__move-info--has-move" style={{ '--move-type-color': (() => { const { MOVES } = require('../../../data/moves'); const m = MOVES[hoveredMove]; const tc = { logic: '#00D9FF', forensic: '#10F981', network: '#3B82F6', armor: '#C0C8D6', phantom: '#FF2E63', illusion: '#9333EA', toxic: '#A3E635', coercion: '#F97316' }; return tc[m?.type] || '#00D9FF'; })() }}>
                  {(() => {
                    const { MOVES } = require('../../../data/moves');
                    const m = MOVES[hoveredMove];
                    if (!m) return null;
                    return (<>
                      <span className="battle__move-info-name">{m.name}</span>
                      <div className="battle__move-info-badges">
                        <span className="battle__move-info-type-badge">{m.type.toUpperCase()}</span>
                        <span className={`battle__move-info-cat-badge battle__move-info-cat-badge--${m.category}`}>
                          {m.category === 'attack' ? '⚔ ATK' : '✦ STS'}
                        </span>
                        {m.power > 0 && <span className="battle__move-info-stat-inline">PWR {m.power}</span>}
                        <span className="battle__move-info-stat-inline">PP {m.pp}</span>
                      </div>
                      <span className="battle__move-info-desc">{m.description}</span>
                      {m.realMeaning && <span className="battle__move-info-meaning-text">💡 {m.realMeaning}</span>}
                    </>);
                  })()}
                </div>
              ) : (
                <div className="battle__move-info battle__move-info--empty">
                  <span className="battle__move-info-hint">HOVER A MOVE<br/>FOR DETAILS</span>
                </div>
              )}}
              {canSwap(battleState) && (
                <button className="battle__swap-btn" onClick={async () => {
                  if (animating) return;
                  setAnimating(true);
                  enemyTurnProcessed.current = true;
                  const otherIdx = battleState.playerSquad.findIndex((c, i) => i !== battleState.activePlayerIndex && !c.fainted);
                  if (otherIdx === -1) { setAnimating(false); return; }
                  playSwitchCreature();

                  // Exit animation — current creature leaves
                  setPlayerExiting(true);
                  await delay(500);
                  setPlayerExiting(false);

                  // Swap state
                  const swapped = swapCreature(battleState, otherIdx);
                  setBattleState(swapped);

                  // Enter animation — new creature comes in
                  setPlayerEntering(true);
                  await delay(500);
                  setPlayerEntering(false);

                  const newName = getActivePlayer(swapped).name;
                  await showAndWait(`Go, ${newName}!`);

                  // Enemy turn
                  await delay(300);
                  playEnemyAttack();
                  const { MOVES } = require('../../../data/moves');
                  const es = executeEnemyAI(swapped);
                  const eMoveId = es.lastAction?.moveId;
                  const eMove = eMoveId ? MOVES[eMoveId] : null;

                  // Check if the swapped-in creature was one-shot (engine auto-swapped back)
                  const swappedInCreature = swapped.playerSquad[swapped.activePlayerIndex];
                  const creatureWasKilled = es.activePlayerIndex !== swapped.activePlayerIndex;

                  // If creature was killed, show intermediate state with it at 0 HP first
                  if (creatureWasKilled) {
                    const intermediateState = JSON.parse(JSON.stringify(swapped));
                    intermediateState.playerSquad[swapped.activePlayerIndex].hp = 0;
                    intermediateState.playerSquad[swapped.activePlayerIndex].fainted = true;
                    intermediateState.enemy = es.enemy;
                    intermediateState.lastAction = es.lastAction;
                    intermediateState.turn = es.turn;
                    setBattleState(intermediateState);
                  } else {
                    setBattleState(es);
                  }

                  setPlayerHit(true);
                  if (es.lastAction?.damage > 0) {
                    const dt = es.lastAction.isCrit ? 'crit' : es.lastAction.effectiveness >= 2 ? 'super' : 'normal';
                    setDamageNum({ value: es.lastAction.damage, type: dt, side: 'player' });
                    setTimeout(() => setDamageNum(null), 800);
                  }
                  if (es.lastAction?.isCrit) { playCriticalHit(); setScreenShake(true); setTimeout(() => setScreenShake(false), 300); }
                  await delay(600);
                  setPlayerHit(false);
                  await delay(300);

                  const eMsgs = [];
                  eMsgs.push(`${es.enemy.name} used ${eMove?.name || 'an attack'}!`);
                  if (es.lastAction?.damage > 0) eMsgs.push(`${swappedInCreature.name} took ${es.lastAction.damage} damage!`);
                  if (es.lastAction?.effectiveness >= 2) eMsgs.push("It's super effective!");
                  if (eMove?.realMeaning) eMsgs.push(`⚠️ ${eMove.realMeaning}`);
                  await showMessages(eMsgs);

                  // Handle faint of swapped-in creature
                  if (creatureWasKilled) {
                    setPlayerFainted(true);
                    playFaint();
                    await delay(800);
                    await showAndWait(`${swappedInCreature.name} fainted!`);
                    setPlayerFainted(false);

                    // Check if game over (all fainted)
                    const swapResult = isBattleOver(es);
                    if (swapResult === 'LOSS') {
                      playDefeat(); await showAndWait('All creatures fainted... Mission failed.'); await delay(500);
                      navigate('/game/campaign'); return;
                    }

                    // Show the next creature entering
                    setBattleState(es);
                    setPlayerEntering(true);
                    await delay(500);
                    setPlayerEntering(false);
                    await showAndWait(`${getActivePlayer(es).name} enters the battle!`);
                  } else {
                    // Check if the swapped-in creature fainted (LOSS)
                    const swapResult = isBattleOver(es);
                    if (swapResult === 'LOSS') {
                      setPlayerFainted(true); playFaint(); await delay(800);
                      await showAndWait(`${getActivePlayer(es).name} fainted!`);
                      playDefeat(); await showAndWait('All creatures fainted... Mission failed.'); await delay(500);
                      navigate('/game/campaign'); return;
                    }
                  }

                  setDialogueText('');
                  setAnimating(false);
                  enemyTurnProcessed.current = false;
                }}>
                  SWITCH
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="battle__moves-grid">
            <MoveSelector moves={activePlayer.moves} pp={activePlayer.pp} onSelect={() => {}} disabled={true} />
          </div>
        )}
      </div>
    </div>
  );
}

