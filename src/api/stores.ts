import client from './client';
import type { Store, Review, PaginatedResponse } from '../types';

interface StoreQueryParams {
  limit?: number;
  offset?: number;
  sort_by?: string;
  category?: string;
  q?: string;
}

export const storesApi = {
  getAll: async (params: StoreQueryParams, signal?: AbortSignal): Promise<PaginatedResponse<Store>> => {
    const res = await client.get('/stores/', { params, signal });
    return res.data;
  },

  getById: async (storeId: number, signal?: AbortSignal): Promise<Store> => {
    const res = await client.get(`/stores/${storeId}`, { signal });
    return res.data;
  },

  getReviews: async (storeId: number, signal?: AbortSignal): Promise<Review[]> => {
    const res = await client.get(`/stores/${storeId}/reviews`, { signal });
    return res.data;
  },

  submitReview: async (storeId: number, orderId: number, rating: number, comment: string): Promise<Review> => {
    const res = await client.post(
      `/stores/${storeId}/review`,
      { rating, comment },
      { params: { order_id: orderId } }
    );
    return res.data;
  },
};
