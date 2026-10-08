import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { fetchOrders } from '../api/orderApi';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    fetchOrders().then(setOrders).catch(() => setError('Unable to load your orders.'));
  }, []);
  return (
    <section className="content-card wide-card">
      <h1>My orders</h1>
      {error && <div className="error-message">{error}</div>}
      {orders.map((order) => (
        <article className="order-card" key={order.id}>
          <h3><Link to={`/orders/${order.id}`}>Order #{order.id}</Link></h3>
          <p>{order.finalAmount.toLocaleString()} BDT · {order.paymentMethod} · {order.orderStatus}</p>
          <small>{order.createdAt}</small>
        </article>
      ))}
      {!orders.length && !error && <p>No orders yet.</p>}
    </section>
  );
}

export default Orders;
