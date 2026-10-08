import { useEffect, useState } from 'react';

import { fetchProducts } from '../../api/productApi';
import { updateAdminProductStatus } from '../../api/adminApi';

function AdminProducts() {
  const [products, setProducts] = useState([]);
  useEffect(() => { fetchProducts({ limit: 50 }).then((data) => setProducts(data.products)).catch(() => {}); }, []);
  async function update(id, status) { await updateAdminProductStatus(id, status); setProducts((items) => items.map((item) => item.id === id ? { ...item, status } : item)); }
  return <section className="content-card wide-card"><h1>Products</h1>{products.map((product) => <article className="order-card" key={product.id}><strong>{product.name}</strong><p>{product.vendor.storeName} · {product.status}</p><button type="button" onClick={() => update(product.id, 'approved')}>Approve</button> <button type="button" className="secondary-button" onClick={() => update(product.id, 'rejected')}>Reject</button></article>)}</section>;
}

export default AdminProducts;
