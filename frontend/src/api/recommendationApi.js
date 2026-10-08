import api from './axios';

export async function fetchRecommendations(limit = 8) {
  const response = await api.get('/recommendations', { params: { limit } });
  return response.data;
}
