import ProductCard from './ProductCard';

function ProductSection({ title, products }) {
  return (
    <section className="home-section">
      <h2>{title}</h2>
      <div className="product-grid">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
      {!products.length && <p>No products available yet.</p>}
    </section>
  );
}

export default ProductSection;
