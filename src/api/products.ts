import client from './client';

interface ProductQueryParams {
  limit?: number;
  offset?: number;
  store_id?: number;
  sort_by?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  q?: string;
}

export const productsApi = {
  getAll: async (params: ProductQueryParams) => {
    const res = await client.get('/products/', { params });
    return res.data;
  },

  getById: async (productId: number) => {
    const res = await client.get(`/products/${productId}`);
    return res.data;
  },
};
