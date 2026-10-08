import { useEffect, useState } from 'react';

import {
  createAdminCatalogItem,
  deleteAdminCatalogItem,
  fetchAdminCatalog,
  updateAdminCatalogItem,
} from '../../api/adminApi';

const emptyForm = { name: '', description: '', image: '', logo: '' };

function AdminCatalog() {
  const [resource, setResource] = useState('categories');
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadItems() {
    try {
      setItems(await fetchAdminCatalog(resource));
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || `Unable to load ${resource}.`);
    }
  }

  useEffect(() => {
    setEditingId(null);
    setForm(emptyForm);
    loadItems();
  }, [resource]);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description || '',
      image: item.image || '',
      logo: item.logo || '',
    });
    setMessage('');
    setError('');
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    const payload = resource === 'categories'
      ? { name: form.name, description: form.description, image: form.image }
      : { name: form.name, description: form.description, logo: form.logo };
    try {
      if (editingId) {
        await updateAdminCatalogItem(resource, editingId, payload);
        setMessage(`${resource.slice(0, -1)} updated.`);
      } else {
        await createAdminCatalogItem(resource, payload);
        setMessage(`${resource.slice(0, -1)} created.`);
      }
      resetForm();
      await loadItems();
    } catch (requestError) {
      setError(requestError.response?.data?.message || `Unable to save ${resource.slice(0, -1)}.`);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(`Delete this ${resource.slice(0, -1)}?`)) return;
    setError('');
    try {
      await deleteAdminCatalogItem(resource, id);
      setItems((current) => current.filter((item) => item.id !== id));
      if (editingId === id) resetForm();
      setMessage(`${resource.slice(0, -1)} deleted.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || `Unable to delete ${resource.slice(0, -1)}.`);
    }
  }

  const singular = resource === 'categories' ? 'category' : 'brand';
  const secondaryField = resource === 'categories' ? 'image' : 'logo';

  return (
    <section className="content-card wide-card">
      <h1>Catalog management</h1>
      <div className="catalog-tabs" role="tablist" aria-label="Catalog resources">
        <button type="button" className={resource === 'categories' ? '' : 'secondary-button'} onClick={() => setResource('categories')}>Categories</button>
        <button type="button" className={resource === 'brands' ? '' : 'secondary-button'} onClick={() => setResource('brands')}>Brands</button>
      </div>
      {error && <div className="error-message" role="alert">{error}</div>}
      {message && <div className="success-message" role="status">{message}</div>}
      <form className="review-form" onSubmit={handleSubmit}>
        <h2>{editingId ? `Edit ${singular}` : `Add ${singular}`}</h2>
        <label htmlFor="catalog-name">Name</label>
        <input id="catalog-name" name="name" value={form.name} onChange={updateField} maxLength="100" required />
        <label htmlFor="catalog-description">Description</label>
        <textarea id="catalog-description" name="description" value={form.description} onChange={updateField} maxLength="500" />
        <label htmlFor={`catalog-${secondaryField}`}>{secondaryField === 'image' ? 'Image URL' : 'Logo URL'}</label>
        <input id={`catalog-${secondaryField}`} name={secondaryField} value={form[secondaryField]} onChange={updateField} type="url" />
        <div>
          <button type="submit">{editingId ? 'Save changes' : `Create ${singular}`}</button>
          {editingId && <button type="button" className="secondary-button" onClick={resetForm}>Cancel</button>}
        </div>
      </form>
      <div className="catalog-admin-list">
        {items.map((item) => (
          <article className="order-card" key={item.id}>
            <strong>{item.name}</strong>
            <p>{item.description || 'No description'}</p>
            <button type="button" onClick={() => startEdit(item)}>Edit</button>
            <button type="button" className="secondary-button" onClick={() => handleDelete(item.id)}>Delete</button>
          </article>
        ))}
        {!items.length && <p>No {resource} found.</p>}
      </div>
    </section>
  );
}

export default AdminCatalog;
