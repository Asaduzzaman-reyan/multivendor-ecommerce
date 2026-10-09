import api from './axios';

export async function fetchAdminStatistics() {
  const response = await api.get('/admin/statistics');
  return response.data.statistics;
}

export async function fetchAdminUsers() {
  const response = await api.get('/admin/users');
  return response.data.users;
}

export async function fetchAdminVendors() {
  const response = await api.get('/admin/vendors');
  return response.data.vendors;
}

export async function fetchAdminOrders() {
  const response = await api.get('/admin/orders');
  return response.data.orders;
}

export async function fetchAdminProducts() {
  const response = await api.get('/admin/products');
  return response.data.products;
}

export async function updateAdminVendorStatus(id, status) {
  const response = await api.put(`/admin/vendors/${id}/status`, { status });
  return response.data;
}

export async function updateAdminProductStatus(id, status) {
  const response = await api.put(`/admin/products/${id}/status`, { status });
  return response.data;
}

export async function updateAdminOrderStatus(id, status) {
  const response = await api.put(`/admin/orders/${id}/status`, { status });
  return response.data;
}

export async function fetchAdminCatalog(resource) {
  const response = await api.get(`/admin/${resource}`);
  return response.data[resource];
}

export async function createAdminCatalogItem(resource, payload) {
  const response = await api.post(`/admin/${resource}`, payload);
  return response.data[resource === 'categories' ? 'category' : 'brand'] || response.data;
}

export async function updateAdminCatalogItem(resource, id, payload) {
  const response = await api.put(`/admin/${resource}/${id}`, payload);
  return response.data[resource === 'categories' ? 'category' : 'brand'] || response.data;
}

export async function deleteAdminCatalogItem(resource, id) {
  await api.delete(`/admin/${resource}/${id}`);
}
