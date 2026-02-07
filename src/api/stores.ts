import client from './client';

interface StoreQueryParams {
  limit?: number;
  offset?: number;
  sort_by?: string;
  category?: string;
  q?: string;
}

export const storesApi = {
  getAll: async (params: StoreQueryParams) => {
    const res = await client.get('/stores/', { params });
    return res.data;
  },

  getById: async (storeId: number) => {
    const res = await client.get(`/stores/${storeId}`);
    return res.data;
  },

  getReviews: async (storeId: number) => {
    const res = await client.get(`/stores/${storeId}/reviews`);
    return res.data;
  },

  submitReview: async (storeId: number, orderId: number, rating: number, comment: string) => {
    const res = await client.post(
      `/stores/${storeId}/review`,
      { rating, comment },
      { params: { order_id: orderId } }
    );
    return res.data;
  },
};
