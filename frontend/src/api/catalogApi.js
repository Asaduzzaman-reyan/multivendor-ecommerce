import api from './axios';

export async function fetchCategories() {
  const response = await api.get('/categories');
  return response.data.categories;
}

export async function fetchBrands() {
  const response = await api.get('/brands');
  return response.data.brands;
}

export async function createCategory(payload) {
  const response = await api.post('/categories', payload);
  return response.data.category;
}

export async function createBrand(payload) {
  const response = await api.post('/brands', payload);
  return response.data.brand;
}
