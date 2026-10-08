import api from './axios';

export async function fetchHome() {
  const response = await api.get('/home');
  return response.data;
}

export async function fetchPersonalizedHome() {
  const response = await api.get('/home/personalized');
  return response.data;
}

export async function fetchTrendingProducts(limit = 8) {
  const response = await api.get('/home/trending', { params: { limit } });
  return response.data;
}

export async function fetchNewArrivals(limit = 8) {
  const response = await api.get('/home/new-arrivals', { params: { limit } });
  return response.data;
}

export async function fetchBestSellingProducts(limit = 8) {
  const response = await api.get('/home/best-sellers', { params: { limit } });
  return response.data;
}

export async function fetchTopBrands(limit = 10) {
  const response = await api.get('/home/top-brands', { params: { limit } });
  return response.data;
}
