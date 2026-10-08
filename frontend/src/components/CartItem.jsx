import { useState } from 'react';

function CartItem({ item, onUpdate, onRemove }) {
  const [quantity, setQuantity] = useState(String(item.quantity));

  async function handleUpdate(event) {
    event.preventDefault();
    await onUpdate(item.id, Number(quantity));
  }

  return (
    <article className="cart-item">
      <div className="product-placeholder">{item.image ? <img src={item.image} alt="" /> : 'No image'}</div>
      <div>
        <h3>{item.name}</h3>
        <p>{item.vendor.storeName}</p>
        <p>{item.price.toLocaleString()} BDT each</p>
        <form className="quantity-form" onSubmit={handleUpdate}>
          <input type="number" min="1" max={item.stock} value={quantity} onChange={(event) => setQuantity(event.target.value)} aria-label={`Quantity for ${item.name}`} />
          <button type="submit">Update</button>
          <button type="button" className="secondary-button" onClick={() => onRemove(item.id)}>Remove</button>
        </form>
        <strong>{item.subtotal.toLocaleString()} BDT</strong>
      </div>
    </article>
  );
}

export default CartItem;
