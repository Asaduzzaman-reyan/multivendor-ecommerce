import { useEffect, useState } from 'react';

import { fetchBrands, fetchCategories } from '../../api/catalogApi';
import {
  createProduct,
  deleteProduct,
  fetchVendorProducts,
  updateProduct,
} from '../../api/productApi';

const emptyForm = {
  name: '',
  description: '',
  categoryId: '',
  brandId: '',
  brandName: '',
  price: '',
  discountPrice: '',
  stock: '',
  image: null,
  imageUrl: '',
};

function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  async function loadData() {
    try {
      const [productItems, categoryItems, brandItems] = await Promise.all([
        fetchVendorProducts(),
        fetchCategories(),
        fetchBrands(),
      ]);
      setProducts(productItems);
      setCategories(categoryItems);
      setBrands(brandItems);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load vendor products.');
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => () => {
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || '',
      categoryId: String(product.category.id),
      brandId: product.brand ? String(product.brand.id) : '',
      brandName: '',
      price: String(product.price),
      discountPrice: product.discountPrice === null ? '' : String(product.discountPrice),
      stock: String(product.stock),
      image: null,
      imageUrl: product.image || '',
    });
    setError('');
    setMessage('');
    setImagePreview(product.image || '');
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setImagePreview('');
  }

  function startNewProduct() {
    resetForm();
    document.getElementById('new-product')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    const payload = new FormData();
    payload.append('name', form.name);
    payload.append('description', form.description);
    payload.append('categoryId', String(Number(form.categoryId)));
    payload.append('brandId', form.brandId && form.brandId !== 'custom' ? form.brandId : '');
    payload.append('brandName', form.brandId === 'custom' ? form.brandName : '');
    payload.append('price', String(Number(form.price)));
    payload.append('discountPrice', form.discountPrice === '' ? '' : String(Number(form.discountPrice)));
    payload.append('stock', String(Number(form.stock)));
    if (form.image) payload.append('image', form.image);
    else if (form.imageUrl) payload.append('image', form.imageUrl);
    try {
      if (editingId) {
        await updateProduct(editingId, payload);
        setMessage('Product updated and submitted for approval.');
      } else {
        await createProduct(payload);
        setMessage('Product created and submitted for approval.');
      }
      resetForm();
      setProducts(await fetchVendorProducts());
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save product.');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      setProducts((current) => current.filter((product) => product.id !== id));
      if (editingId === id) resetForm();
      setMessage('Product deleted.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete product.');
    }
  }

  return (
    <section className="content-card wide-card">
      <div className="page-heading">
        <div>
          <h1>My products</h1>
          <p className="muted-text">Create products with complete pricing, inventory, category, brand, and image details.</p>
        </div>
        <button type="button" onClick={startNewProduct}>Add new product</button>
      </div>
      {error && <div className="error-message" role="alert">{error}</div>}
      {message && <div className="success-message" role="status">{message}</div>}
      <form id="new-product" className="review-form product-form" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Edit product' : 'Add product'}</h2>
        <label htmlFor="product-name">Name</label>
        <input id="product-name" name="name" value={form.name} onChange={updateField} maxLength="200" required />
        <label htmlFor="product-description">Description</label>
        <textarea id="product-description" name="description" value={form.description} onChange={updateField} />
        <label htmlFor="product-category">Category</label>
        <select id="product-category" name="categoryId" value={form.categoryId} onChange={updateField} required>
          <option value="">Select category</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <label htmlFor="product-brand">Brand</label>
        <select id="product-brand" name="brandId" value={form.brandId} onChange={updateField}>
          <option value="">No brand</option>
          <option value="custom">Create custom brand</option>
          {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
        </select>
        {form.brandId === 'custom' && (
          <>
            <label htmlFor="product-brand-name">Custom brand name</label>
            <input id="product-brand-name" name="brandName" value={form.brandName} onChange={updateField} maxLength="120" required />
          </>
        )}
        <label htmlFor="product-price">Price</label>
        <input id="product-price" name="price" type="number" min="0" step="0.01" value={form.price} onChange={updateField} required />
        <label htmlFor="product-discount-price">Discount price</label>
        <input id="product-discount-price" name="discountPrice" type="number" min="0" step="0.01" value={form.discountPrice} onChange={updateField} />
        <label htmlFor="product-stock">Stock</label>
        <input id="product-stock" name="stock" type="number" min="0" step="1" value={form.stock} onChange={updateField} required />
        <label htmlFor="product-image">Product image</label>
        <input
          id="product-image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(event) => {
            const file = event.target.files?.[0] || null;
            setForm((current) => ({ ...current, image: file }));
            if (file) setImagePreview(URL.createObjectURL(file));
          }}
        />
        <small className="muted-text">JPEG, PNG, WEBP, or GIF up to 5 MB.</small>
        {imagePreview && <img className="product-upload-preview" src={imagePreview} alt="Selected product preview" />}
        <div>
          <button type="submit">{editingId ? 'Save changes' : 'Create product'}</button>
          {editingId && <button type="button" className="secondary-button" onClick={resetForm}>Cancel</button>}
        </div>
      </form>
      <div>
        {products.map((product) => (
          <article className="order-card" key={product.id}>
            <strong>{product.name}</strong>
            <p>{product.stock} in stock · {product.status} · {product.price.toLocaleString()} BDT</p>
            <button type="button" onClick={() => startEdit(product)}>Edit</button>{' '}
            <button type="button" className="secondary-button" onClick={() => handleDelete(product.id)}>Delete</button>
          </article>
        ))}
        {!products.length && <p>No products found.</p>}
      </div>
    </section>
  );
}

export default VendorProducts;
