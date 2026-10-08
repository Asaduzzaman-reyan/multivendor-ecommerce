import { useEffect, useState } from 'react';

import { fetchVendorProfile, updateVendorProfile } from '../../api/vendorApi';

function VendorProfile() {
  const [form, setForm] = useState({ storeName: '', storeDescription: '', logo: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { fetchVendorProfile().then((vendor) => setForm({ storeName: vendor.storeName, storeDescription: vendor.storeDescription, logo: vendor.logo || '' })).catch(() => setError('Unable to load store profile.')); }, []);
  async function submit(event) {
    event.preventDefault();
    try { await updateVendorProfile(form); setMessage('Store profile updated.'); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to update store profile.'); }
  }
  return <section className="auth-card"><h1>Store profile</h1>{error && <div className="error-message">{error}</div>}{message && <p className="success-message">{message}</p>}<form onSubmit={submit}><label htmlFor="storeName">Store name</label><input id="storeName" value={form.storeName} onChange={(event) => setForm({ ...form, storeName: event.target.value })} required /><label htmlFor="storeDescription">Description</label><textarea id="storeDescription" value={form.storeDescription} onChange={(event) => setForm({ ...form, storeDescription: event.target.value })} /><label htmlFor="logo">Logo URL</label><input id="logo" value={form.logo} onChange={(event) => setForm({ ...form, logo: event.target.value })} /><button type="submit">Save profile</button></form></section>;
}

export default VendorProfile;
