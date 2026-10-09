import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { fetchProduct } from '../api/productApi';
import { createReview, fetchReviews } from '../api/reviewApi';
import { addToWishlist, fetchWishlist, removeFromWishlist } from '../api/wishlistApi';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

function ProductDetails() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState({ reviews: [], distribution: {} });
  const [form, setForm] = useState({ orderId: '', rating: '5', comment: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [cartLoading, setCartLoading] = useState(false);

  useEffect(() => {
    const wishlistRequest = isAuthenticated ? fetchWishlist() : Promise.resolve(null);
    Promise.all([fetchProduct(id), fetchReviews(id), wishlistRequest])
      .then(([productData, reviewData, wishlistData]) => {
        setProduct(productData);
        setReviews(reviewData);
        setIsWishlisted(Boolean(wishlistData?.items.some((item) => item.productId === productData.id)));
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Product details are unavailable.'));
  }, [id, isAuthenticated]);

  async function handleWishlist() {
    setWishlistLoading(true);
    setError('');
    try {
      if (isWishlisted) {
        await removeFromWishlist(product.id);
        setIsWishlisted(false);
        setMessage('Removed from your wishlist.');
      } else {
        await addToWishlist(product.id);
        setIsWishlisted(true);
        setMessage('Added to your wishlist.');
      }

      async function handleAddToCart() {
        setCartLoading(true);
        setError('');
        setMessage('');
        try {
          await addItem(product.id, quantity);
          setMessage(`${quantity} item${quantity === 1 ? '' : 's'} added to your cart.`);
        } catch (requestError) {
          setError(requestError.response?.data?.message || 'Unable to add this product to your cart.');
        } finally {
          setCartLoading(false);
        }
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update your wishlist.');
    } finally {
      setWishlistLoading(false);
    }
  }

  async function handleReview(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await createReview(id, { ...form, orderId: Number(form.orderId), rating: Number(form.rating) });
      setReviews(await fetchReviews(id));
      setForm({ orderId: '', rating: '5', comment: '' });
      setMessage('Your verified review was submitted.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to submit review.');
    }
  }

  if (error && !product) return <section className="content-card"><div className="error-message">{error}</div></section>;
  if (!product) return <p className="route-status">Loading product...</p>;

  const price = product.discountPrice ?? product.price;
  return (
    <section className="content-card wide-card">
      <div className="product-detail">
        <div className="detail-image">{product.image ? <img src={product.image} alt={product.name} /> : 'No image'}</div>
        <div>
          <p className="product-category">{product.category.name}</p>
          <h1>{product.name}</h1>
          <p className="product-store">Sold by {product.vendor.storeName}</p>
          <p>{product.description}</p>
          <strong className="detail-price">{price.toLocaleString()} BDT</strong>
          {product.discountPrice !== null && <del>{product.price.toLocaleString()} BDT</del>}
          <p>★ {product.averageRating.toFixed(1)} ({product.reviewCount} reviews)</p>
          <p>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
          {isAuthenticated && product.stock > 0 ? (
            <div className="quantity-form">
              <label htmlFor="product-quantity">Quantity</label>
              <input
                id="product-quantity"
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={(event) => setQuantity(Math.max(1, Math.min(product.stock, Number(event.target.value) || 1)))}
              />
              <button type="button" onClick={handleAddToCart} disabled={cartLoading}>
                {cartLoading ? 'Adding...' : 'Add to cart'}
              </button>
            </div>
          ) : !isAuthenticated ? <p><Link to="/login">Log in</Link> to add this product to your cart.</p> : null}
          {isAuthenticated ? (
            <button type="button" onClick={handleWishlist} disabled={wishlistLoading}>
              {isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            </button>
          ) : <p><Link to="/login">Log in</Link> to save this product.</p>}
        </div>
      </div>
      <section className="review-section">
        <h2>Customer reviews</h2>
        <p>5★ {reviews.distribution[5] || 0} · 4★ {reviews.distribution[4] || 0} · 3★ {reviews.distribution[3] || 0} · 2★ {reviews.distribution[2] || 0} · 1★ {reviews.distribution[1] || 0}</p>
        {reviews.reviews.map((review) => (
          <article className="review-card" key={review.id}>
            <strong>{review.user.name}</strong> <span>★ {review.rating}</span>
            <p>{review.comment || 'No comment'}</p>
            <small>{review.createdAt}</small>
          </article>
        ))}
        {isAuthenticated ? (
          <form className="review-form" onSubmit={handleReview}>
            <h3>Write a verified review</h3>
            <label htmlFor="orderId">Delivered order ID</label>
            <input id="orderId" type="number" min="1" value={form.orderId} onChange={(event) => setForm({ ...form, orderId: event.target.value })} required />
            <label htmlFor="rating">Rating</label>
            <select id="rating" value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value })}>
              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
            </select>
            <label htmlFor="comment">Comment</label>
            <textarea id="comment" value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} />
            <button type="submit">Submit review</button>
          </form>
        ) : <p><Link to="/login">Log in</Link> to write a review after delivery.</p>}
        {message && <p className="success-message">{message}</p>}
        {error && <div className="error-message">{error}</div>}
      </section>
      <section className="home-section">
        <h2>Related products</h2>
        <div className="product-grid">{product.relatedProducts?.map((item) => <ProductCard key={item.id} product={item} />)}</div>
      </section>
    </section>
  );
}

export default ProductDetails;
