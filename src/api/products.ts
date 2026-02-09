import client from './client';
import type { Product, PaginatedResponse } from '../types';

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
  getAll: async (params: ProductQueryParams, signal?: AbortSignal): Promise<PaginatedResponse<Product>> => {
    const res = await client.get('/products/', { params, signal });
    return res.data;
  },

  getById: async (productId: number, signal?: AbortSignal): Promise<Product> => {
    const res = await client.get(`/products/${productId}`, { signal });
    return res.data;
  },
};
