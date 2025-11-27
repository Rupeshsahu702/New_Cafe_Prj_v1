import React, { useContext, useEffect, useState } from "react";
import "./MyOrders.css";
import axios from "axios";
import { StoreContext } from "../../Context/StoreContext";
import { assets } from "../../assets/assets";

// Allowed statuses only
const STATUS_META = {
  pending:    { label: "pending",    color: "#f59e0b" },
  preparing:  { label: "preparing",  color: "#ff7a00" },
  ready:      { label: "ready",      color: "#0a84ff" },
  served:     { label: "served",     color: "#0a8a0a" },
  cancelled:  { label: "cancelled",  color: "#b40000" },
};

// Coerce any weird/legacy values into our allowed set
const normalizeStatus = (raw) => {
  const s = String(raw || "").toLowerCase().trim();
  if (STATUS_META[s]) return STATUS_META[s];
  // fallback: treat unknowns as pending rather than showing delivery junk
  return STATUS_META.pending;
};

const MyOrders = () => {
  const [data, setData] = useState([]);
  const [loadingId, setLoadingId] = useState(null); // which order is being “tracked” right now
  const { url, token, currency } = useContext(StoreContext);

  const fetchOrders = async () => {
    const res = await axios.post(
      `${url}/api/order/userorders`,
      {},
      { headers: { token } }
    );
    setData(Array.isArray(res.data?.data) ? res.data.data : []);
  };

  // Track a single order: refetch list and clear the spinner for that row
  const trackOrder = async (orderId) => {
    try {
      setLoadingId(orderId);
      await fetchOrders();
    } finally {
      setLoadingId(null);
    }
  };

  useEffect(() => {
    if (token) fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="my-orders">
      <h2>My Orders</h2>
      <div className="container">
        {data.map((order) => {
          const items = Array.isArray(order.items) ? order.items : [];
          const itemsText =
            items.length === 0
              ? "No items"
              : items
                  .map((item, idx) => {
                    const name = item?.name || item?.itemId || `Item ${idx + 1}`;
                    const qty = Number(item?.quantity || 0);
                    return `${name} x ${qty}`;
                  })
                  .join(", ");
          const { label, color } = normalizeStatus(order.status);
          const amount = Number(order.amount || 0).toFixed(2);

          return (
            <div key={order._id} className="my-orders-order">
              <img src={assets.parcel_icon} alt="" />
              <p className="items-line">{itemsText}</p>
              <p className="amount">
                {currency}
                {amount}
              </p>
              <p className="count">Items: {items.length}</p>
              <p className="status">
                <span className="status-dot" style={{ background: color }} />
                <b className="status-label">{label}</b>
              </p>
              <button
                onClick={() => trackOrder(order._id)}
                disabled={loadingId === order._id}
                className={loadingId === order._id ? "loading" : ""}
              >
                {loadingId === order._id ? "Updating…" : "Track Order"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyOrders;
