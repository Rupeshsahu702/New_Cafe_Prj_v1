import React, { useContext } from "react";
import "./FoodItem.css";
import { StoreContext } from "../../Context/StoreContext";

/**
 * FoodItem card without image or star ratings.
 * Shows: name, price, and +/- quantity controls.
 *
 * Props expected (same as before, extra props ignored safely):
 * - _id (string)  : item id
 * - name (string) : dish name
 * - price (number): unit price
 * - description?  : optional short text
 * - image?        : ignored on purpose
 */
const FoodItem = ({ _id, name, price, description }) => {
  const { cartItems, addToCart, removeFromCart, currency } =
    useContext(StoreContext);

  const qty = Number(cartItems?.[_id] || 0);

  return (
    <div className="fi-card" data-item={_id}>
      <div className="fi-main">
        <h3 className="fi-title" title={name}>
          {name}
        </h3>

        {description ? (
          <p className="fi-desc" title={description}>
            {description}
          </p>
        ) : null}

        <div className="fi-footer">
          <div className="fi-price">
            {currency}
            {Number(price || 0)}
          </div>

          {qty > 0 ? (
            <div className="fi-qty">
              <button
                type="button"
                className="fi-btn"
                onClick={() => removeFromCart(_id)}
                aria-label={`Remove one ${name}`}
              >
                −
              </button>
              <span className="fi-count" aria-live="polite">
                {qty}
              </span>
              <button
                type="button"
                className="fi-btn"
                onClick={() => addToCart(_id)}
                aria-label={`Add one ${name}`}
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="fi-add"
              onClick={() => addToCart(_id)}
              aria-label={`Add ${name} to cart`}
            >
              +
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodItem;