import React, { useContext, useEffect, useMemo, useState } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../Context/StoreContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const PlaceOrder = () => {
  const {
    getTotalCartAmount,
    getAddOnTotal,
    getGrandTotal,
    buildClientCartSnapshot,
    setCheeseAddOns,
    token,
    url,
    setCartItems,
    setToken,
    currency,
  } = useContext(StoreContext);

  const navigate = useNavigate();

  // Dine-in customer info only
  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    tableNumber: "",
  });

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  // Snapshot of items to send, INCLUDING add-ons
  const clientCart = useMemo(() => buildClientCartSnapshot(), [buildClientCartSnapshot]);

  const cartSubtotal = useMemo(() => getTotalCartAmount(), [getTotalCartAmount]);
  const cheeseTotal = useMemo(() => getAddOnTotal(), [getAddOnTotal]);
  const grandTotal = useMemo(() => getGrandTotal(), [getGrandTotal]);

  const placeOrder = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Please sign in to place an order");
      navigate("/cart");
      return;
    }

    if (!data.firstName.trim() || !data.lastName.trim() || !data.tableNumber) {
      toast.error("First name, last name and table number are required");
      return;
    }

    // require at least one real menu item (add-ons alone should not be orderable)
    if (cartSubtotal <= 0) {
      toast.error("Your cart is empty");
      return;
    }

    try {
      const payload = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: (data.email || "").trim(),
        tableNumber: Number(data.tableNumber),

        // the whole line-item list, including add-ons
        clientCart,

        // optional metadata the backend can use or ignore
        meta: {
          cheeseTotal,
          grandTotal,
          currency,
        },
      };

      const response = await axios.post(`${url}/api/order/placecod`, payload, {
        headers: { token },
        validateStatus: () => true,
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        setToken("");
        toast.error(response.data?.message || "Session expired. Sign in again.");
        navigate("/cart");
        return;
      }

      if (response.data?.success) {
        toast.success(response.data.message || "Order placed");
        setCartItems({});
        setCheeseAddOns({ pasta: 0, moburg: 0 }); // reset add-ons after successful order
        navigate("/myorders");
      } else {
        toast.error(response.data?.message || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to place order");
    }
  };

  useEffect(() => {
    if (!token) {
      toast.error("Please sign in to place an order");
      navigate("/cart");
    } else if (getTotalCartAmount() === 0) {
      // allow page if there are add-ons, but still need at least one base item
      navigate("/cart");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <form onSubmit={placeOrder} className="place-order">
      <div className="place-order-left">
        <p className="title">Customer Info</p>

        <div className="multi-field">
          <input
            type="text"
            name="firstName"
            onChange={onChangeHandler}
            value={data.firstName}
            placeholder="First name"
            required
          />
          <input
            type="text"
            name="lastName"
            onChange={onChangeHandler}
            value={data.lastName}
            placeholder="Last name"
            required
          />
        </div>

        <input
          type="email"
          name="email"
          onChange={onChangeHandler}
          value={data.email}
          placeholder="Email address (optional)"
        />

        <div className="multi-field">
          <select
            name="tableNumber"
            value={data.tableNumber}
            onChange={onChangeHandler}
            required
          >
            <option value="" disabled>
              Table Number
            </option>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>
                {currency}
                {cartSubtotal}
              </p>
            </div>

            {cheeseTotal > 0 && (
              <>
                <hr />
                <div className="cart-total-details">
                  <p>Extra Cheese</p>
                  <p>
                    {currency}
                    {cheeseTotal}
                  </p>
                </div>
              </>
            )}

            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>
                {currency}
                {grandTotal}
              </b>
            </div>
          </div>
        </div>

        <div className="payment">
          <h2>Payment Method</h2>
          <div className="payment-option active">
            <span className="dot" aria-hidden>
              ●
            </span>
            <p>POC (Pay On Counter)</p>
          </div>
        </div>

        <button className="place-order-submit" type="submit">
          Place Order
        </button>
      </div>
    </form>
  );
};

export default PlaceOrder;
