import api from './axios';

export async function fetchCheckout() {
  const response = await api.get('/checkout');
  return response.data.checkout;
}

export async function previewCheckout(payload) {
  const response = await api.post('/checkout/preview', payload);
  return response.data.preview;
}
