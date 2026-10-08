import { useState } from 'react';
import { Link } from 'react-router-dom';

import CartItem from '../components/CartItem';
import { useCart } from '../context/CartContext';

function Cart() {
  const { cart, isLoading, updateItem, removeItem } = useCart();
  const [error, setError] = useState('');

  async function run(action) {
    setError('');
    try {
      await action();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update your cart.');
    }
  }

  if (isLoading) return <p className="route-status">Loading cart...</p>;

  return (
    <section className="content-card wide-card">
      <h1>Your cart</h1>
      {error && <div className="error-message" role="alert">{error}</div>}
      {!cart.items.length ? (
        <p>Your cart is empty. <Link to="/products">Browse products</Link></p>
      ) : (
        <>
          <div className="cart-list">
            {cart.items.map((item) => (
              <CartItem key={item.id} item={item} onUpdate={(id, quantity) => run(() => updateItem(id, quantity))} onRemove={(id) => run(() => removeItem(id))} />
            ))}
          </div>
          <aside className="cart-summary">
            <span>Items: {cart.itemCount}</span>
            <strong>Subtotal: {cart.subtotal.toLocaleString()} BDT</strong>
            <p>Delivery charges are calculated at checkout.</p>
            <Link className="primary-link" to="/checkout">Continue to checkout</Link>
          </aside>
        </>
      )}
    </section>
  );
}

export default Cart;
