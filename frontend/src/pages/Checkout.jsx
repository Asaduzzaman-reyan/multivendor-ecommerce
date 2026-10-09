import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { fetchCheckout, previewCheckout } from '../api/checkoutApi';
import { simulatePayment } from '../api/paymentApi';
import { placeOrder } from '../api/orderApi';
import { useNavigate } from 'react-router-dom';

function Checkout() {
  const [checkout, setCheckout] = useState(null);
  const [form, setForm] = useState({
    deliveryLocation: 'inside_dhaka',
    paymentMethod: 'cash_on_delivery',
    shippingAddress: '',
    mobileNumber: '',
    transactionId: '',
  });
  const [preview, setPreview] = useState(null);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCheckout()
      .then((data) => {
        setCheckout(data);
        setForm((current) => ({ ...current, shippingAddress: data.customer.address }));
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load checkout.'))
      .finally(() => setIsLoading(false));
  }, []);

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setPreview(null);
    setPayment(null);
  }

  async function handlePreview(event) {
    event.preventDefault();
    setError('');
    try {
      setPreview(await previewCheckout(form));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to calculate checkout total.');
    }
  }

  async function handlePayment() {
    setError('');
    setPaymentLoading(true);
    try {
      if (!preview) {
        setPreview(await previewCheckout(form));
      }
      setPayment(await simulatePayment(form));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to simulate payment.');
    } finally {
      setPaymentLoading(false);
    }
  }

  async function handlePlaceOrder() {
    setError('');
    setOrderLoading(true);
    try {
      const order = await placeOrder(form);
      navigate(`/orders/${order.id}`, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to place order.');
    } finally {
      setOrderLoading(false);
    }
  }

  if (isLoading) return <p className="route-status">Loading checkout...</p>;
  if (error && !checkout) return <section className="content-card"><div className="error-message">{error}</div><Link to="/cart">Return to cart</Link></section>;
  if (!checkout) return null;

  const deliveryCharge = form.deliveryLocation === 'inside_dhaka' ? 80 : 150;
  return (
    <section className="content-card wide-card">
      <h1>Checkout</h1>
      {error && <div className="error-message" role="alert">{error}</div>}
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handlePreview}>
          <h2>Customer information</h2>
          <p>{checkout.customer.name} · {checkout.customer.phone} · {checkout.customer.email}</p>
          <label htmlFor="shippingAddress">Shipping address</label>
          <textarea id="shippingAddress" name="shippingAddress" value={form.shippingAddress} onChange={handleChange} required />
          <label htmlFor="deliveryLocation">Delivery location</label>
          <select id="deliveryLocation" name="deliveryLocation" value={form.deliveryLocation} onChange={handleChange}>
            {checkout.deliveryOptions.map((option) => <option key={option.value} value={option.value}>{option.label} - {option.charge} BDT</option>)}
          </select>
          <h2>Payment method</h2>
          {checkout.paymentMethods.map((method) => (
            <label className="radio-option" key={method.value}>
              <input type="radio" name="paymentMethod" value={method.value} checked={form.paymentMethod === method.value} onChange={handleChange} />
              {method.label} ({method.type})
            </label>
          ))}
          {(form.paymentMethod === 'bkash' || form.paymentMethod === 'nagad') && (
            <>
              <label htmlFor="mobileNumber">Mobile number</label>
              <input id="mobileNumber" name="mobileNumber" inputMode="tel" placeholder="01XXXXXXXXX" value={form.mobileNumber} onChange={handleChange} />
              <label htmlFor="transactionId">Transaction ID</label>
              <input id="transactionId" name="transactionId" placeholder="e.g. TXN123456" value={form.transactionId} onChange={handleChange} />
            </>
          )}
          <div className="checkout-actions">
            <button type="submit">Recalculate total</button>
            <button type="button" onClick={handlePayment} disabled={paymentLoading || orderLoading}>
              {paymentLoading ? 'Simulating...' : 'Simulate payment'}
            </button>
          </div>
          {payment && <p className="success-message">Payment {payment.status}: {payment.reference}. Review the details, then place your order.</p>}
          {payment && <button type="button" onClick={handlePlaceOrder} disabled={orderLoading || paymentLoading}>{orderLoading ? 'Placing order...' : 'Place order'}</button>}
        </form>
        <aside className="checkout-summary">
          <h2>Order summary</h2>
          {checkout.cart.items.map((item) => <p key={item.productId}>{item.name} × {item.quantity} <strong>{item.subtotal.toLocaleString()} BDT</strong></p>)}
          <hr />
          <p>Subtotal <strong>{(preview?.totalAmount ?? checkout.cart.subtotal).toLocaleString()} BDT</strong></p>
          <p>Delivery <strong>{(preview?.deliveryCharge ?? deliveryCharge).toLocaleString()} BDT</strong></p>
          <h3>Total <strong>{(preview?.finalAmount ?? checkout.cart.subtotal + deliveryCharge).toLocaleString()} BDT</strong></h3>
          <p className="muted-text">This is a simulated payment. No real gateway is contacted and no order is created yet.</p>
        </aside>
      </div>
    </section>
  );
}

export default Checkout;
