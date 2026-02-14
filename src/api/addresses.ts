import client from './client';
import type { Address } from '../types';

interface AddressPayload {
  label: string;
  address_line: string;
  instructions: string | null;
  is_default: boolean;
}

export const addressesApi = {
  getAll: async (signal?: AbortSignal): Promise<Address[]> => {
    const res = await client.get('/addresses/', { signal });
    return res.data;
  },

  getDefault: async (signal?: AbortSignal): Promise<Address> => {
    const res = await client.get('/addresses/default', { signal });
    return res.data;
  },

  create: async (payload: AddressPayload): Promise<Address> => {
    const res = await client.post('/addresses/', payload);
    return res.data;
  },

  update: async (id: number, payload: Partial<AddressPayload>): Promise<Address> => {
    const res = await client.patch(`/addresses/${id}`, payload);
    return res.data;
  },

  remove: async (id: number): Promise<void> => {
    await client.delete(`/addresses/${id}`);
  },

  setDefault: async (id: number): Promise<Address> => {
    const res = await client.patch(`/addresses/${id}`, { is_default: true });
    return res.data;
  },
};
