import api from './axios';

export async function simulatePayment(payload) {
  const response = await api.post('/payments/simulate', payload);
  return response.data.payment;
}
