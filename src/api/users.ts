import client from './client';

export const usersApi = {
  registerPushToken: async (token: string): Promise<void> => {
    await client.post('/users/me/push-token', { token });
  },
};
