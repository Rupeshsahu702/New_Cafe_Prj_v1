// food-del/admin/src/pages/Orders/Orders.jsx
import React, { useEffect, useState, useEffect as UseEffect2 } from "react";
import "./Orders.css";
import "./InlinePrint.css";
import axios from "axios";
import { toast } from "react-toastify";
import { url } from "../../assets/assets";
import DatePicker from "react-datepicker";
import { format, parseISO } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
// const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY;


/* helpers */
const todayISO = () => new Date().toISOString().slice(0, 10);
const currency = (n) => `₹${Number(n || 0)}`;
const qs = (obj) => {
  const p = [];
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      p.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    }
  });
  return p.length ? `?${p.join("&")}` : "";
};

/* shared date range component (same UX as Analytics) */
function DateRange({ from, to, onChange }) {
  const toDateObj = (iso) => (iso ? parseISO(iso) : null);
  const toISO = (d) => (d ? format(d, "yyyy-MM-dd") : "");

  const [start, setStart] = useState(toDateObj(from));
  const [end, setEnd] = useState(toDateObj(to));

  useEffect(() => setStart(toDateObj(from)), [from]);
  useEffect(() => setEnd(toDateObj(to)), [to]);

  const onFromChange = (d) => {
    if (!d) {
      setStart(null);
      onChange({ from: "" });
      return;
    }
    if (end && d > end) {
      setStart(end);
      setEnd(d);
      onChange({ from: toISO(end), to: toISO(d) });
    } else {
      setStart(d);
      onChange({ from: toISO(d) });
    }
  };

  const onToChange = (d) => {
    if (!d) {
      setEnd(null);
      onChange({ to: "" });
      return;
    }
    if (start && d < start) {
      setEnd(start);
      setStart(d);
      onChange({ from: toISO(d), to: toISO(start) });
    } else {
      setEnd(d);
      onChange({ to: toISO(d) });
    }
  };

  return (
    <div className="control">
      <label>Date range</label>
      <div className="control-row daterow">
        <DatePicker
          selected={start}
          onChange={onFromChange}
          dateFormat="dd-MM-yyyy"
          placeholderText="From"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          calendarStartDay={1}
          showPopperArrow={false}
          className="date-input"
        />
        <span>to</span>
        <DatePicker
          selected={end}
          onChange={onToChange}
          dateFormat="dd-MM-yyyy"
          placeholderText="To"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          calendarStartDay={1}
          showPopperArrow={false}
          className="date-input"
        />
      </div>
    </div>
  );
}

/* ---------- Printable Ticket (inline) ---------- */
function PrintableTicket({ order }) {
  if (!order) return null;

  const created = new Date(order.createdAt || Date.now());
  const two = (n) => String(n).padStart(2, "0");
  const ts = `${created.getDate()}-${two(created.getMonth() + 1)}-${created.getFullYear()} ${two(created.getHours())}:${two(created.getMinutes())}`;
  const totalQty = (order.items || []).reduce((s, i) => s + (Number(i.quantity) || 0), 0);
  const amount = Number(order.amount || 0).toFixed(2);

  return (
    <div className="ticket-root printable">
      <div className="ticket">
        <div className="ticket-header">
          <div className="brand">MOMO MAGIC</div>
          <div className="sub">Kitchen Ticket</div>
        </div>

        <div className="ticket-meta">
          <div>No: {String(order._id).slice(-6).toUpperCase()}</div>
          <div>Table: {order.tableNumber ?? "-"}</div>
          <div>Time: {ts}</div>
        </div>

        <div className="ticket-sep" />

        <div className="ticket-items">
          <div className="row head">
            <div className="col qty">QTY</div>
            <div className="col name">ITEM</div>
            <div className="col price">AMT</div>
          </div>
          {(order.items || []).map((it, idx) => (
            <div key={idx} className="row">
              <div className="col qty">{it.quantity}</div>
              <div className="col name">{it.name}</div>
              <div className="col price">₹{Number((it.price || 0) * (it.quantity || 0)).toFixed(2)}</div>
            </div>
          ))}
        </div>

        <div className="ticket-sep dotted" />

        <div className="ticket-totals">
          <div className="line">
            <span>Items</span>
            <span>{totalQty}</span>
          </div>
          <div className="line total">
            <span>Total</span>
            <span>₹{amount}</span>
          </div>
        </div>

        <div className="ticket-sep" />

        <div className="ticket-footer">
          <div>Customer: {(order.firstName || "—") + " " + (order.lastName || "")}</div>
          <div>Status: {String(order.status || "").toUpperCase()}</div>
          <div className="copy">KITCHEN COPY</div>
        </div>

        <div className="cut">─────── cut here ───────</div>
      </div>
    </div>
  );
}

const Orders = () => {
  /* default to today */
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // which order is being printed
  const [printOrder, setPrintOrder] = useState(null);

  async function fetchOrders() {
    try {
      setLoading(true);
      const r = await axios.get(`${url}/api/order/list${qs({ from, to })}`);
      setOrders(Array.isArray(r.data?.data) ? r.data.data : []);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, [from, to]);

  // status change
  const updateStatus = async (orderId, status) => {
    try {
      const r = await axios.post(`${url}/api/order/status`, { orderId, status });
      if (r.data?.success) {
        setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)));
      } else {
        toast.error(r.data?.message || "Failed to update");
      }
    } catch {
      toast.error("Failed to update");
    }
  };

  // trigger print in the same tab
  const handlePrint = (order) => {
    setPrintOrder(order);
  };

  // after printOrder mounts, fire print and clean up
  UseEffect2(() => {
    if (!printOrder) return;
    const onAfterPrint = () => setPrintOrder(null);
    // give the DOM a tick to render the ticket before printing
    const t = setTimeout(() => window.print(), 50);
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, [printOrder]);

  const totalOrders = orders.length;

  return (
    <div className="orders">
      {/* inline, hidden until printing */}
      {printOrder && <PrintableTicket order={printOrder} />}

      <div className="orders-head">
        <h3>Orders</h3>
        <div className="orders-filters">
          <DateRange
            from={from}
            to={to}
            onChange={({ from: f, to: t }) => {
              if (f !== undefined) setFrom(f);
              if (t !== undefined) setTo(t);
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="loader">Loading…</div>
      ) : (
        <>
          <div className="orders-count">
            {totalOrders} order{totalOrders === 1 ? "" : "s"}
          </div>

          <div className="orders-list">
            {orders.map((order) => (
              <div className="order" key={order._id}>
                <div className="order-content">
                  <p className="order-items">
                    {order.items.map((i) => `${i.name} x ${i.quantity}`).join(", ")}
                  </p>
                  <p className="order-customer">
                    {order.firstName || "Test"} {order.lastName || "User"}
                  </p>
                  <div className="order-meta">
                    <span className="chip">Email: {order.email || "—"}</span>
                    <span className="chip">Table: {order.tableNumber ?? "—"}</span>
                    <span className="chip">
                      Items: {order.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0}
                    </span>
                    <span className="chip">Total: {currency(order.amount)}</span>
                    <span className="chip ts">
                      {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div
                  className="order-actions"
                  style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end" }}
                >
                  <button className="btn btn-print" onClick={() => handlePrint(order)}>
                    Print
                  </button>

                  <select
                    className="order-status"
                    value={order.status}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="served">Served</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Orders;
