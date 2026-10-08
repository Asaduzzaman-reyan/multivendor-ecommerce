import { useEffect, useState } from 'react';

import { fetchAdminOrders, updateAdminOrderStatus } from '../../api/adminApi';

const nextStatuses = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => { fetchAdminOrders().then(setOrders).catch(() => setError('Unable to load orders.')); }, []);
  async function update(id, status) {
    try {
      await updateAdminOrderStatus(id, status);
      setOrders(await fetchAdminOrders());
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update order.');
    }
  }
  return <section className="content-card wide-card"><h1>Orders</h1>{error && <div className="error-message">{error}</div>}{orders.map((order) => <article className="order-card" key={order.id}><strong>Order #{order.id}</strong><p>{order.buyerName} · {order.finalAmount} BDT · {order.orderStatus}</p><select value={order.orderStatus} onChange={(event) => update(order.id, event.target.value)}><option value={order.orderStatus}>{order.orderStatus}</option>{nextStatuses[order.orderStatus].map((status) => <option key={status} value={status}>{status}</option>)}</select></article>)}</section>;
}

export default AdminOrders;
