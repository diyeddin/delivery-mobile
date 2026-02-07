import client from './client';

export const ordersApi = {
  getMyOrders: async () => {
    const res = await client.get('/orders/me/');
    return res.data;
  },

  getOrderDetails: async (orderId: number) => {
    const res = await client.get(`/orders/${orderId}`);
    return res.data;
  },

  placeOrder: async (payload: {
    delivery_address: string;
    items: { product_id: number; quantity: number }[];
    payment_method: string;
    note: string;
    store_id: number;
  }) => {
    const res = await client.post('/orders/', payload);
    return res.data;
  },

  cancelOrder: async (orderId: number) => {
    const res = await client.put(`/orders/${orderId}/cancel`);
    return res.data;
  },
};
