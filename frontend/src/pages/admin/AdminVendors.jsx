import { useEffect, useState } from 'react';

import { fetchAdminVendors, updateAdminVendorStatus } from '../../api/adminApi';

function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  useEffect(() => { fetchAdminVendors().then(setVendors).catch(() => {}); }, []);
  async function update(id, status) { await updateAdminVendorStatus(id, status); setVendors(await fetchAdminVendors()); }
  return <section className="content-card wide-card"><h1>Vendors</h1>{vendors.map((vendor) => <article className="order-card" key={vendor.id}><strong>{vendor.storeName}</strong><p>{vendor.name} · {vendor.status}</p><button type="button" onClick={() => update(vendor.id, 'approved')}>Approve</button> <button type="button" className="secondary-button" onClick={() => update(vendor.id, 'rejected')}>Reject</button></article>)}</section>;
}

export default AdminVendors;
