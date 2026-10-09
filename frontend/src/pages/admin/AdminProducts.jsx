import { useEffect, useState } from 'react';

import { fetchAdminProducts, updateAdminProductStatus } from '../../api/adminApi';

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadProducts() {
    try {
      setError('');
      setProducts(await fetchAdminProducts());
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load products.');
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function update(id, status) {
    try {
      setError('');
      await updateAdminProductStatus(id, status);
      setProducts((items) => items.map((item) => item.id === id ? { ...item, status } : item));
      setMessage(`Product ${status}.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update product status.');
    }
  }

  return (
    <section className="content-card wide-card">
      <div className="page-heading">
        <div>
          <h1>Product approvals</h1>
          <p className="muted-text">Review vendor products, then approve or reject them before they appear in the marketplace.</p>
        </div>
        <button type="button" className="secondary-button" onClick={loadProducts}>Refresh</button>
      </div>
      {error && <div className="error-message" role="alert">{error}</div>}
      {message && <div className="success-message" role="status">{message}</div>}
      {products.length === 0 && <p className="muted-text">No products require review.</p>}
      {products.map((product) => (
        <article className="order-card" key={product.id}>
          <strong>{product.name}</strong>
          <p>{product.vendor.storeName} · Status: <strong>{product.status}</strong></p>
          <button type="button" onClick={() => update(product.id, 'approved')}>Approve</button>{' '}
          <button type="button" className="secondary-button" onClick={() => update(product.id, 'rejected')}>Reject</button>
        </article>
      ))}
    </section>
  );
}

export default AdminProducts;
