// backend/controllers/orderController.js
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import foodModel from "../models/foodModel.js";
// import Stripe from "stripe";
import mongoose from "mongoose";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// const currency = "inr";
// const frontend_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const isMongoId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));

/* ---------------- helpers ---------------- */

/**
 * Build an items snapshot and subtotal from a server-side cart map.
 * cartMap: { [itemId]: quantity }
 * Returns { items:[{itemId,name,price,quantity}], amount:number }
 */
async function buildItemsAndAmount(cartMap = {}) {
  const ids = Object.keys(cartMap).filter(
    (id) => Number(cartMap[id]) > 0 && isMongoId(id)
  );
  if (!ids.length) return { items: [], amount: 0 };

  const foods = await foodModel.find({ _id: { $in: ids } }).lean();
  const byId = Object.fromEntries(foods.map((f) => [String(f._id), f]));

  let amount = 0;
  const items = [];
  for (const id of ids) {
    const f = byId[id];
    if (!f) continue;
    const q = Number(cartMap[id]) || 0;
    const price = Number(f.price || 0);
    amount += price * q;
    items.push({ itemId: id, name: String(f.name || ""), price, quantity: q });
  }
  return { items, amount };
}

/** Sanitize a client-provided cart snapshot */
function coerceClientCart(clientCart = []) {
  const out = [];
  let amount = 0;
  for (const raw of Array.isArray(clientCart) ? clientCart : []) {
    const quantity = Math.max(0, parseInt(raw?.quantity ?? 0, 10));
    const price = Number(raw?.price ?? 0);
    const name = String(raw?.name ?? "");
    const itemId = String(raw?.itemId ?? "");
    if (!quantity || !name) continue;
    out.push({ itemId, name, price, quantity });
    amount += price * quantity;
  }
  return { items: out, amount };
}

/* ---------------- place order (Stripe) ---------------- */
/**
 * POST /api/order/place
 * Body: { userId, firstName, lastName, email?, tableNumber, clientCart? }
 * Requires a valid existing userId. No guest auto-creation here.
 */
// const placeOrder = async (req, res) => {
//   try {
//     const { userId, firstName, lastName, email = "", tableNumber, clientCart } = req.body;

//     if (!isMongoId(userId)) {
//       return res.json({ success: false, message: "Invalid user" });
//     }
//     const user = await userModel.findById(userId);
//     if (!user) {
//       return res.json({ success: false, message: "User not found" });
//     }

//     if (!String(firstName || "").trim() || !String(lastName || "").trim() || !tableNumber) {
//       return res.json({ success: false, message: "Missing required fields" });
//     }

//     // Prefer client snapshot; fallback to server cart
//     let items = [], amount = 0;
//     if (Array.isArray(clientCart) && clientCart.length) {
//       ({ items, amount } = coerceClientCart(clientCart));
//     } else {
//       ({ items, amount } = await buildItemsAndAmount(user.cartData || {}));
//     }

//     if (!items.length) {
//       return res.json({ success: false, message: "Cart is empty" });
//     }

//     const newOrder = await orderModel.create({
//       userId: String(user._id),
//       firstName: String(firstName).trim(),
//       lastName:  String(lastName).trim(),
//       email:     String(email || "").trim(),
//       tableNumber: Number(tableNumber),
//       items,
//       amount,
//       payment: false,
//       status: "pending",
//     });

//     const line_items = items.map((i) => ({
//       price_data: {
//         currency,
//         product_data: { name: i.name },
//         unit_amount: Math.round(Number(i.price || 0) * 100),
//       },
//       quantity: i.quantity,
//     }));

//     const session = await stripe.checkout.sessions.create({
//       success_url: `${frontend_URL}/verify?success=true&orderId=${newOrder._id}`,
//       cancel_url:  `${frontend_URL}/verify?success=false&orderId=${newOrder._id}`,
//       line_items,
//       mode: "payment",
//     });

//     // clear server cart after creating the session
//     await userModel.findByIdAndUpdate(user._id, { cartData: {} });

//     res.json({ success: true, session_url: session.url });
//   } catch (error) {
//     console.error(error);
//     res.json({ success: false, message: "Error" });
//   }
// };

/* ---------------- place order (Pay on Counter) ---------------- */
/**
 * POST /api/order/placecod
 * Body: { userId, firstName, lastName, email?, tableNumber, clientCart? }
 * Requires a valid existing userId. No guest auto-creation here.
 */
const placeOrderCod = async (req, res) => {
  try {
    const { userId, firstName, lastName, email = "", tableNumber, clientCart } = req.body;

    if (!isMongoId(userId)) {
      return res.json({ success: false, message: "Invalid user" });
    }
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (!String(firstName || "").trim() || !String(lastName || "").trim() || !tableNumber) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    let items = [], amount = 0;
    if (Array.isArray(clientCart) && clientCart.length) {
      ({ items, amount } = coerceClientCart(clientCart));
    } else {
      ({ items, amount } = await buildItemsAndAmount(user.cartData || {}));
    }

    if (!items.length) {
      return res.json({ success: false, message: "Cart is empty" });
    }

    await orderModel.create({
      userId: String(user._id),
      firstName: String(firstName).trim(),
      lastName:  String(lastName).trim(),
      email:     String(email || "").trim(),
      tableNumber: Number(tableNumber),
      items,
      amount,
      payment: true,     // treated as paid operationally
      status: "pending",
    });

    await userModel.findByIdAndUpdate(user._id, { cartData: {} });

    res.json({ success: true, message: "Order Placed" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

/* ---------------- list with date filter (admin) ---------------- */
/**
 * GET /api/order/list?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
const listOrders = async (req, res) => {
  try {
    const { from, to } = req.query;
    const q = {};
    if (from || to) {
      q.createdAt = {};
      if (from) q.createdAt.$gte = new Date(from);
      if (to) {
        const t = new Date(to);
        if (to.length <= 10) t.setHours(23, 59, 59, 999);
        q.createdAt.$lte = t;
      }
    }
    const orders = await orderModel.find(q).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.body.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

const updateStatus = async (req, res) => {
  try {
    await orderModel.findByIdAndUpdate(req.body.orderId, { status: req.body.status });
    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  try {
    if (success === "true") {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      res.json({ success: true, message: "Paid" });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Not Paid" });
    }
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Not Verified" });
  }
};

/* ---------------- get single order by id (NEW) ---------------- */
/**
 * GET /api/order/:id
 */
const getOrderById = async (req, res) => {
  try {
    const id = String(req.params.id || "");
    if (!isMongoId(id)) {
      return res.status(400).json({ success: false, message: "Invalid order id" });
    }
    const order = await orderModel.findById(id).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.json({ success: true, data: order });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Error" });
  }
};

export {
  // placeOrder,
  placeOrderCod,
  listOrders,
  userOrders,
  updateStatus,
  verifyOrder,
  getOrderById,
};
