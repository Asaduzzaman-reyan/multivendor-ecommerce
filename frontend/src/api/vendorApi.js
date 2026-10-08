import api from './axios';

export async function fetchVendorProfile() {
  const response = await api.get('/vendor/profile');
  return response.data.vendor;
}

export async function updateVendorProfile(payload) {
  const response = await api.put('/vendor/profile', payload);
  return response.data.vendor;
}

export async function fetchVendorOrders() {
  const response = await api.get('/vendor/orders');
  return response.data.orders;
}

export async function updateVendorOrderStatus(id, status) {
  const response = await api.put(`/vendor/orders/${id}/status`, { status });
  return response.data;
}

export async function fetchVendorStatistics() {
  const response = await api.get('/vendor/statistics');
  return response.data.statistics;
}
