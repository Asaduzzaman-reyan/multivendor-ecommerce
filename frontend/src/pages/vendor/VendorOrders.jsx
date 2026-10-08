import { useEffect, useState } from 'react';

import { fetchVendorOrders, updateVendorOrderStatus } from '../../api/vendorApi';

const nextStatuses = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => { fetchVendorOrders().then(setOrders).catch(() => setError('Unable to load vendor orders.')); }, []);
  async function update(id, status) {
    try {
      await updateVendorOrderStatus(id, status);
      setOrders(await fetchVendorOrders());
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update order.');
    }
  }
  return <section className="content-card wide-card"><h1>Vendor orders</h1>{error && <div className="error-message">{error}</div>}{orders.map((order) => <article className="order-card" key={order.id}><h3>Order #{order.id}</h3><p>{order.orderStatus} · {order.items.map((item) => `${item.name} × ${item.quantity}`).join(', ')}</p><select value={order.orderStatus} onChange={(event) => update(order.id, event.target.value)}><option value={order.orderStatus}>{order.orderStatus}</option>{nextStatuses[order.orderStatus].map((status) => <option key={status} value={status}>{status}</option>)}</select></article>)}</section>;
}

export default VendorOrders;
