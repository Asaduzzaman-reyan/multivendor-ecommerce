import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { fetchWishlist, removeFromWishlist } from '../api/wishlistApi';
import ProductCard from '../components/ProductCard';

function Wishlist() {
  const [wishlist, setWishlist] = useState({ items: [], count: 0 });
  const [error, setError] = useState('');

  async function loadWishlist() {
    try {
      setWishlist(await fetchWishlist());
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load your wishlist.');
    }
  }

  useEffect(() => {
    loadWishlist();
  }, []);

  async function handleRemove(productId) {
    try {
      await removeFromWishlist(productId);
      setWishlist((current) => ({
        items: current.items.filter((item) => item.productId !== productId),
        count: current.count - 1,
      }));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to remove wishlist item.');
    }
  }

  return (
    <section className="content-card wide-card">
      <h1>My wishlist</h1>
      {error && <div className="error-message" role="alert">{error}</div>}
      {!wishlist.items.length && !error && (
        <p>Your wishlist is empty. <Link to="/products">Browse products</Link> to save items for later.</p>
      )}
      <div className="product-grid">
        {wishlist.items.map((item) => (
          <div key={item.productId}>
            <ProductCard product={item} />
            <button type="button" onClick={() => handleRemove(item.productId)}>Remove from wishlist</button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Wishlist;
