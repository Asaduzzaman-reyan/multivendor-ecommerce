import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { addToCart, fetchCart, removeCartItem, updateCartItem } from '../api/cartApi';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [], subtotal: 0, itemCount: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setCart({ items: [], subtotal: 0, itemCount: 0 });
      return;
    }
    setIsLoading(true);
    fetchCart().then(setCart).finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  async function addItem(productId, quantity = 1) {
    const nextCart = await addToCart(productId, quantity);
    setCart(nextCart);
  }

  async function updateItem(itemId, quantity) {
    const nextCart = await updateCartItem(itemId, quantity);
    setCart(nextCart);
  }

  async function removeItem(itemId) {
    await removeCartItem(itemId);
    setCart((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== itemId),
    }));
    const refreshed = await fetchCart();
    setCart(refreshed);
  }

  const value = useMemo(() => ({
    cart, isLoading, addItem, updateItem, removeItem,
  }), [cart, isLoading]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside a CartProvider');
  return context;
}
