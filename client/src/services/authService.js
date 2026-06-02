import api from './api';

const authService = {
  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  async signup({ username, email, password, displayName }) {
    const { data } = await api.post('/auth/signup', { username, email, password, displayName });
    return data;
  },

  async getMe() {
    const { data } = await api.get('/auth/me');
    return data.user;
  },
};

export default authService;
