import api from './axios';

export async function fetchWishlist() {
  const response = await api.get('/wishlist');
  return response.data;
}

export async function addToWishlist(productId) {
  const response = await api.post(`/wishlist/${productId}`);
  return response.data;
}

export async function removeFromWishlist(productId) {
  await api.delete(`/wishlist/${productId}`);
}
