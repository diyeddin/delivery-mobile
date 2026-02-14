import client from './client';
import type { Order, OrderDetail, PlaceOrderResponse } from '../types';

export const ordersApi = {
  getMyOrders: async (signal?: AbortSignal): Promise<Order[]> => {
    const res = await client.get('/orders/me', { signal });
    return res.data;
  },

  getOrderDetails: async (orderId: number, signal?: AbortSignal): Promise<OrderDetail> => {
    const res = await client.get(`/orders/${orderId}`, { signal });
    return res.data;
  },

  placeOrder: async (payload: {
    delivery_address: string;
    items: { product_id: number; quantity: number }[];
    payment_method: string;
    note: string;
    store_id: number;
  }): Promise<PlaceOrderResponse> => {
    const res = await client.post('/orders/', payload);
    return res.data;
  },

  cancelOrder: async (orderId: number): Promise<Order> => {
    const res = await client.put(`/orders/${orderId}/cancel`);
    return res.data;
  },
};
