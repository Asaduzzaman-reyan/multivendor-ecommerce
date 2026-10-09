import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { fetchOrder } from '../api/orderApi';

const orderStages = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    fetchOrder(id).then(setOrder).catch(() => setError('Unable to load this order.'));
  }, [id]);
  if (error) return <section className="content-card"><div className="error-message">{error}</div></section>;
  if (!order) return <p className="route-status">Loading order...</p>;
  const currentStage = orderStages.indexOf(order.orderStatus);
  const isCancelled = order.orderStatus === 'cancelled';
  return (
    <section className="content-card wide-card">
      <h1>Order #{order.id}</h1>
      <p>Status: {order.orderStatus} · Payment: {order.paymentStatus}</p>
      <section className="order-timeline" aria-label="Order progress">
        <h2>Order progress</h2>
        {isCancelled ? (
          <p className="timeline-cancelled">This order was cancelled.</p>
        ) : (
          <ol>
            {orderStages.map((stage, index) => (
              <li className={index <= currentStage ? 'timeline-stage complete' : 'timeline-stage'} key={stage}>
                <span aria-hidden="true">{index <= currentStage ? '✓' : index + 1}</span>
                <strong>{stage}</strong>
              </li>
            ))}
          </ol>
        )}
      </section>
      <p>Delivery: {order.deliveryLocation} · {order.deliveryCharge} BDT</p>
      <p>Shipping address: {order.shippingAddress}</p>
      {order.items.map((item) => <article className="order-card" key={item.productId}><strong>{item.name}</strong><p>{item.storeName} · {item.quantity} × {item.price} BDT = {item.subtotal} BDT</p></article>)}
      <h2>Total: {order.finalAmount} BDT</h2>
    </section>
  );
}

export default OrderDetails;
