import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { fetchBrands, fetchCategories } from '../api/catalogApi';
import { fetchProducts } from '../api/productApi';
import ProductCard from './ProductCard';

function ProductBrowser({ title = 'All products', initialQuery = '', fixedCategoryId = '' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [error, setError] = useState('');
  const query = searchParams.get('q') ?? initialQuery;
  const categoryId = fixedCategoryId || searchParams.get('categoryId') || '';
  const brandId = searchParams.get('brandId') || '';
  const sort = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const page = Number(searchParams.get('page') || 1);

  useEffect(() => {
    Promise.all([fetchCategories(), fetchBrands()])
      .then(([categoryItems, brandItems]) => {
        setCategories(categoryItems);
        setBrands(brandItems);
      })
      .catch(() => setError('Filter options are temporarily unavailable.'));
  }, []);

  useEffect(() => {
    setError('');
    fetchProducts({
      q: query || undefined,
      categoryId: categoryId || undefined,
      brandId: brandId || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      sort,
      page,
      limit: 12,
    })
      .then((data) => {
        setProducts(data.products);
        setPagination(data.pagination);
      })
      .catch(() => setError('Products are temporarily unavailable.'));
  }, [categoryId, brandId, maxPrice, minPrice, page, query, sort]);

  function updateFilter(name, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(name, value);
    else next.delete(name);
    next.delete('page');
    setSearchParams(next);
  }

  return (
    <section className="content-card wide-card">
      <h1>{title}</h1>
      <div className="filter-row product-filters">
        <input aria-label="Search products" placeholder="Search products" value={query} onChange={(event) => updateFilter('q', event.target.value)} />
        <select aria-label="Category filter" value={categoryId} onChange={(event) => updateFilter('categoryId', event.target.value)} disabled={Boolean(fixedCategoryId)}>
          <option value="">All categories</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <select aria-label="Brand filter" value={brandId} onChange={(event) => updateFilter('brandId', event.target.value)}>
          <option value="">All brands</option>
          {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
        </select>
        <input aria-label="Minimum price" type="number" min="0" placeholder="Min price" value={minPrice} onChange={(event) => updateFilter('minPrice', event.target.value)} />
        <input aria-label="Maximum price" type="number" min="0" placeholder="Max price" value={maxPrice} onChange={(event) => updateFilter('maxPrice', event.target.value)} />
        <select aria-label="Sort products" value={sort} onChange={(event) => updateFilter('sort', event.target.value)}>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="popularity">Popularity</option>
          <option value="rating">Rating</option>
        </select>
      </div>
      <p className="result-summary">{pagination.total} products found</p>
      {error && <div className="error-message" role="alert">{error}</div>}
      <div className="product-grid">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
      {!error && products.length === 0 && <p>No products matched your filters.</p>}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button type="button" disabled={page <= 1} onClick={() => updateFilter('page', String(page - 1))}>Previous</button>
          <span>Page {page} of {pagination.pages}</span>
          <button type="button" disabled={page >= pagination.pages} onClick={() => updateFilter('page', String(page + 1))}>Next</button>
        </div>
      )}
    </section>
  );
}

export default ProductBrowser;
