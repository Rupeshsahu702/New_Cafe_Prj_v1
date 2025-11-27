import React, { useContext, useMemo } from 'react';
import './Cart.css';
import { StoreContext } from '../../Context/StoreContext';
import { useNavigate } from 'react-router-dom';

const CHEESE_PRICE = 20;

const Cart = () => {
  const {
    cartItems,
    food_list,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    currency,
    deliveryCharge,
    cheeseAddOns,
    updateCheeseAddOns,
    getAddOnTotal,
  } = useContext(StoreContext);

  const navigate = useNavigate();

  // items with qty > 0
  const cartData = useMemo(
    () => food_list.filter((item) => cartItems[item._id] > 0),
    [food_list, cartItems]
  );

  // robust category getter
  const getCategory = (item) => {
    const raw = item.category || item.categoryName || item.menu_category || item.menu_name || '';
    return String(raw).toLowerCase();
  };

  // count total qty in a category
  const categoryQty = (needle) =>
    cartData.reduce((sum, item) => {
      const qty = cartItems[item._id] || 0;
      return getCategory(item).includes(needle) ? sum + qty : sum;
    }, 0);

  const pastaMax = categoryQty('pasta');
  const moburgMax = categoryQty('moburg');

  const addOnTotal = getAddOnTotal();

  return (
    <div className="cart">
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p>
          <p>Title</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>
        <br />
        <hr />

        {cartData.map((item, index) => {
          const qty = cartItems[item._id] || 0;
          return (
            <div key={item._id}>
              <div className="cart-items-title cart-items-item">
                {/* Serial number only */}
                <p className="cart-serial">{index + 1}.</p>

                {/* Title */}
                <p className="cart-title">{item.name}</p>

                {/* Unit Price */}
                <p>
                  {currency}
                  {item.price}
                </p>

                {/* Quantity (read-only cell) */}
                <div className="cart-qty-read">{qty}</div>

                {/* Line Total */}
                <p>
                  {currency}
                  {Number(item.price) * qty}
                </p>

                {/* +/- controls */}
                <div className="cart-qty-controls">
                  <button
                    className="cart-qty-btn"
                    onClick={() => removeFromCart(item._id)}
                    aria-label={`Remove one ${item.name}`}
                  >
                    −
                  </button>
                  <span className="cart-qty-count">{qty}</span>
                  <button
                    className="cart-qty-btn"
                    onClick={() => addToCart(item._id)}
                    aria-label={`Add one ${item.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
              <hr />
            </div>
          );
        })}
      </div>

      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>
                {currency}
                {getTotalCartAmount()}
              </p>
            </div>

            {(pastaMax > 0 || moburgMax > 0) && (
              <>
                <hr />
                <div className="cart-total-details">
                  <p>
                    Extra Cheese
                    {cheeseAddOns.pasta > 0 && <> · Pasta x{cheeseAddOns.pasta}</>}
                    {cheeseAddOns.moburg > 0 && <> · Moburg x{cheeseAddOns.moburg}</>}
                  </p>
                  <p>
                    {currency}
                    {addOnTotal}
                  </p>
                </div>
              </>
            )}

            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>
                {currency}
                {getTotalCartAmount() === 0 ? 0 : deliveryCharge}
              </p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>
                {currency}
                {getTotalCartAmount() === 0
                  ? 0
                  : getTotalCartAmount() + deliveryCharge + addOnTotal}
              </b>
            </div>
          </div>
          <button onClick={() => navigate('/order')}>PROCEED TO CHECKOUT</button>
        </div>

        <div className="cart-promocode">
          <div>
            <p>If you have a promo code, Enter it here</p>
            <div className="cart-promocode-input">
              <input type="text" placeholder="promo code" />
              <button>Submit</button>
            </div>

            {(pastaMax > 0 || moburgMax > 0) && (
              <div className="cart-upsell">
                <h4>Add-ons</h4>

                {pastaMax > 0 && (
                  <div className="upsell-row">
                    <div className="upsell-info">
                      <div className="upsell-title">Extra cheese for Pasta</div>
                      <div className="upsell-sub">
                        {currency}
                        {CHEESE_PRICE} each · You can add up to {pastaMax}
                      </div>
                    </div>
                    <div className="cart-qty-controls">
                      <button
                        className="cart-qty-btn"
                        onClick={() =>
                          updateCheeseAddOns({ pasta: Math.max(0, cheeseAddOns.pasta - 1) })
                        }
                        disabled={cheeseAddOns.pasta <= 0}
                        aria-label="Remove cheese for Pasta"
                      >
                        −
                      </button>
                      <span className="cart-qty-count">{cheeseAddOns.pasta}</span>
                      <button
                        className="cart-qty-btn"
                        onClick={() =>
                          updateCheeseAddOns({
                            pasta: Math.min(pastaMax, cheeseAddOns.pasta + 1),
                          })
                        }
                        disabled={cheeseAddOns.pasta >= pastaMax}
                        aria-label="Add cheese for Pasta"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {moburgMax > 0 && (
                  <div className="upsell-row">
                    <div className="upsell-info">
                      <div className="upsell-title">Extra cheese for Moburg</div>
                      <div className="upsell-sub">
                        {currency}
                        {CHEESE_PRICE} each · You can add up to {moburgMax}
                      </div>
                    </div>
                    <div className="cart-qty-controls">
                      <button
                        className="cart-qty-btn"
                        onClick={() =>
                          updateCheeseAddOns({ moburg: Math.max(0, cheeseAddOns.moburg - 1) })
                        }
                        disabled={cheeseAddOns.moburg <= 0}
                        aria-label="Remove cheese for Moburg"
                      >
                        −
                      </button>
                      <span className="cart-qty-count">{cheeseAddOns.moburg}</span>
                      <button
                        className="cart-qty-btn"
                        onClick={() =>
                          updateCheeseAddOns({
                            moburg: Math.min(moburgMax, cheeseAddOns.moburg + 1),
                          })
                        }
                        disabled={cheeseAddOns.moburg >= moburgMax}
                        aria-label="Add cheese for Moburg"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
