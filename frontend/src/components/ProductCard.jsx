import { Link } from 'react-router-dom';

function ProductCard({ product }) {
  const price = product.discountPrice ?? product.price;

  return (
    <article className="product-card">
      {product.image ? <img src={product.image} alt="" /> : <div className="product-placeholder">No image</div>}
      <div>
        <p className="product-category">{product.category.name}</p>
        <h3><Link to={`/products/${product.id}`}>{product.name}</Link></h3>
        <p className="product-store">{product.vendor.storeName}</p>
        <strong>{price.toLocaleString()} BDT</strong>
        {product.discountPrice !== null && <del>{product.price.toLocaleString()} BDT</del>}
        <p className="product-rating">★ {product.averageRating.toFixed(1)} ({product.reviewCount})</p>
      </div>
    </article>
  );
}

export default ProductCard;
