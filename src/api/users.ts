import client from './client';

export const usersApi = {
  registerPushToken: async (token: string) => {
    const res = await client.post('/users/me/push-token', { token });
    return res.data;
  },
};
