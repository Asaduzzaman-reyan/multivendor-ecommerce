import api from './axios';

export async function placeOrder(payload) {
  const response = await api.post('/orders', payload);
  return response.data.order;
}

export async function fetchOrders() {
  const response = await api.get('/orders');
  return response.data.orders;
}

export async function fetchOrder(id) {
  const response = await api.get(`/orders/${id}`);
  return response.data.order;
}
