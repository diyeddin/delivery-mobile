import client from './client';

export const authApi = {
  login: async (email: string, password: string) => {
    const body = `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
    const res = await client.post('/auth/login', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return res.data;
  },

  signup: async (payload: { name: string; email: string; password: string }) => {
    const res = await client.post('/auth/signup', payload);
    return res.data;
  },
};
