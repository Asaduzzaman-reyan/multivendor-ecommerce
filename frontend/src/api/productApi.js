import api from './axios';

export async function fetchProducts(params = {}) {
  const response = await api.get('/products', { params });
  return response.data;
}

export async function fetchProduct(id) {
  const response = await api.get(`/products/${id}`);
  return response.data.product;
}

export async function fetchVendorProducts() {
  const response = await api.get('/vendor/products');
  return response.data.products;
}

export async function createProduct(payload) {
  const response = await api.post('/vendor/products', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function updateProduct(id, payload) {
  const response = await api.put(`/vendor/products/${id}`, payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function deleteProduct(id) {
  await api.delete(`/vendor/products/${id}`);
}
