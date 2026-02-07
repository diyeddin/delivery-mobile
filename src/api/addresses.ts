import client from './client';

interface AddressPayload {
  label: string;
  address_line: string;
  instructions: string | null;
  is_default: boolean;
}

export const addressesApi = {
  getAll: async () => {
    const res = await client.get('/addresses/');
    return res.data;
  },

  getDefault: async () => {
    const res = await client.get('/addresses/default');
    return res.data;
  },

  create: async (payload: AddressPayload) => {
    const res = await client.post('/addresses/', payload);
    return res.data;
  },

  update: async (id: number, payload: Partial<AddressPayload>) => {
    const res = await client.patch(`/addresses/${id}`, payload);
    return res.data;
  },

  remove: async (id: number) => {
    const res = await client.delete(`/addresses/${id}`);
    return res.data;
  },

  setDefault: async (id: number) => {
    const res = await client.patch(`/addresses/${id}`, { is_default: true });
    return res.data;
  },
};
