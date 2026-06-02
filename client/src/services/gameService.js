import api from './api';

const gameService = {
  async getCreatures() {
    const { data } = await api.get('/game/creatures');
    return data.creatures;
  },

  async getCreatureDetail(creatureId) {
    const { data } = await api.get(`/game/creatures/${creatureId}`);
    return data;
  },

  async getMissions() {
    const { data } = await api.get('/game/missions');
    return data.missions;
  },

  async saveBattle(battleData) {
    const { data } = await api.post('/game/battles', battleData);
    return data;
  },

  async completeMission(missionData) {
    const { data } = await api.post('/game/missions/complete', missionData);
    return data;
  },

  async allocateTap({ creatureId, hp, atk, def, spd }) {
    const { data } = await api.post('/game/tap/allocate', { creatureId, hp, atk, def, spd });
    return data;
  },

  async resetCreatureTap({ creatureId }) {
    const { data } = await api.post('/game/tap/reset', { creatureId });
    return data;
  },

  async setActiveAbility({ creatureId, abilityId }) {
    const { data } = await api.post('/game/ability/set', { creatureId, abilityId });
    return data;
  },

  async equipMoves({ creatureId, moves }) {
    const { data } = await api.post('/game/moves/equip', { creatureId, moves });
    return data;
  },
};

export default gameService;
